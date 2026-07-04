import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { deriveFraming } from "../_shared/audit-framing.ts";

function cleanCompetitorDomain(input: string): string {
  let s = (input || "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  return s;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-ignore - EdgeRuntime is provided by Supabase Edge runtime
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const OUTER_TIMEOUT_MS = 150_000;

// Derive the three gap-hero fields (strategy_says / site_says / gap_verdict)
// deterministically from the founder's own strategy foundation and the scraped
// signals + Vera's report. Stored on report.gap_hero so both surfaces (in-app
// and PDF) can read them without any generation rewrite.
function deriveGapHero(report: any, signals: any, strategyFoundation: any): { strategy_says: string; site_says: string; gap_verdict: string } {
  const sf = strategyFoundation ?? {};
  const ef = (sf.enhanced_foundation && typeof sf.enhanced_foundation === "object") ? sf.enhanced_foundation : {};
  const period = (s: string) => (s && !/[.!?]$/.test(s) ? s + "." : s);
  const stripDashes = (s: string) => String(s).replace(/\s*[—–]\s*/g, ", ");
  const capSentences = (s: string, max = 3) => {
    const parts = String(s).trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    return parts.slice(0, max).join(" ").trim();
  };

  // strategy_says — a holistic PROMISE, not the raw ICP paragraph.
  // Prefer transformation + differentiation, then positioning statement.
  const transformation = stripDashes(String(sf.transformation ?? ef?.transformation ?? "").trim().replace(/\.$/, ""));
  const differentiation = stripDashes(String(sf.differentiation ?? ef?.differentiation ?? "").trim().replace(/\.$/, ""));
  const positioning = stripDashes(String(ef?.positioning?.statement ?? ef?.positioning_statement ?? "").trim());
  const brandName = String(sf.business_name ?? "Your brand").trim();

  // strategy_says = the PROMISE only. Never append the ICP paragraph.
  let strategy_says = "";
  const parts: string[] = [];
  if (transformation) {
    parts.push(period(`${brandName} promises ${transformation}`));
  } else if (positioning) {
    parts.push(period(positioning));
  }
  if (differentiation) parts.push(period(differentiation));
  if (parts.length === 0) {
    strategy_says = "Your strategy is not yet fully documented in MOXIEMO, so the report reads your site on its own terms.";
  } else {
    strategy_says = stripDashes(capSentences(parts.join(" "), 3));
  }

  // site_says — a whole-site impression from the scrape. Must NOT copy the
  // Positioning section's holding-back line.
  const seo = signals?.seo ?? {};
  const title = String(seo.title ?? "").trim();
  const metaDesc = String(seo.meta_description ?? "").trim();
  const cc = signals?.content_consistency ?? {};
  const face = signals?.face_of_the_brand ?? {};
  const pos = signals?.positioning ?? {};
  const renderOk = signals?.render_ok !== false;

  const impressionParts: string[] = [];
  const founderVisible = face?.face_visible || face?.founder_named_in_text || face?.named_founder_on_site;
  const hasStory = title || metaDesc;
  if (renderOk && hasStory) {
    if (founderVisible) {
      impressionParts.push(`Your site reads as a founder-led presence with a clear surface story${metaDesc ? `, framed as "${metaDesc.replace(/"/g, "'")}"` : ""}`);
    } else {
      impressionParts.push(`Your site reads as ${title ? `"${title.replace(/"/g, "'")}"` : "a capability page"}, without a distinct founder voice`);
    }
  } else if (!renderOk) {
    impressionParts.push("Your live site could not be fully read on this pass, most likely because it is a JavaScript-rendered site");
  } else {
    impressionParts.push("Your site reads as a generic capability list without a distinct point of view");
  }

  const gaps: string[] = [];
  const hasDiff = pos?.differentiation_present === true || (pos?.stance_detail && String(pos.stance_detail).length > 20);
  if (!hasDiff) gaps.push("no differentiation statement");
  if (cc?.blog_present === false) gaps.push("no published content");
  if (cc?.waitlist_present === true) gaps.push("it is still gated by a waitlist");
  // Merge into ONE clean flowing sentence so we never leave a lowercase fragment.
  let firstSentence = impressionParts[0] || "Your site reads as a generic capability list";
  if (gaps.length > 0) {
    firstSentence = `${firstSentence}, and ${gaps.slice(0, 2).join(" and ")}, so the market cannot yet verify the promise`;
  } else if (renderOk && hasStory) {
    firstSentence = `${firstSentence}, and the specifics of what the visitor gets, and why here, are still implied rather than named`;
  }
  const site_says = stripDashes(period(firstSentence));

  // gap_verdict — the one-line most-important move.
  let gap_verdict = "";
  const focus = String(report?.advisor_overview?.focus ?? "").trim();
  const firstFix = String(report?.priority_fixes?.[0]?.move ?? "").trim();
  if (focus) {
    gap_verdict = focus.split(/(?<=[.!?])\s+/)[0].trim();
  } else if (firstFix) {
    gap_verdict = firstFix;
  } else {
    gap_verdict = "Close the gap between what you know and what your brand says first";
  }
  gap_verdict = stripDashes(period(gap_verdict));

  return { strategy_says, site_says, gap_verdict };
}

async function runGeneration(audit_id: string) {
  const t0 = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let step = "init";
  let terminalWritten = false;

  async function writeTerminal(update: Record<string, unknown>) {
    terminalWritten = true;
    await supabase.from("audits").update(update).eq("id", audit_id);
  }

  try {
    step = "load_payload";
    const { data: row, error: loadErr } = await supabase
      .from("audits")
      .select("inputs, model_type, low_data, signals, review_reason, report, stage, posture")
      .eq("id", audit_id)
      .maybeSingle();
    if (loadErr || !row) throw new Error(loadErr?.message || "audit row not found");

    // Re-derive framing if missing (covers older rows or repair retries).
    const framing = (row.stage && row.posture)
      ? { stage: row.stage as any, posture: row.posture as any }
      : deriveFraming({
          inputs: row.inputs ?? null,
          signals: row.signals ?? null,
          model_type: row.model_type ?? null,
          low_data: row.low_data ?? null,
        });

    // Normalize entered competitor list to clean root domains before Vera sees it.
    const rawInputs: any = row.inputs ?? {};
    const cleanCompetitors: string[] = Array.isArray(rawInputs.competitors)
      ? rawInputs.competitors
          .map((c: any) => (typeof c === "string" ? cleanCompetitorDomain(c) : ""))
          .filter((c: string) => !!c)
      : [];
    const inputsForVera = { ...rawInputs, competitors: cleanCompetitors };

    // Pull competitor_signals out of stored signals so Vera sees real per-competitor data.
    const storedSignals: any = row.signals ?? {};
    const competitor_signals = Array.isArray(storedSignals.competitor_signals)
      ? storedSignals.competitor_signals
      : [];
    // Hoist optional strategy_foundation (present when a signed-in user ran the
    // audit) so Vera sees it as an authoritative top-level payload key.
    const strategy_foundation = storedSignals.strategy_foundation ?? null;

    const payload = {
      inputs: inputsForVera,
      model_type: row.model_type ?? null,
      low_data: row.low_data ?? false,
      signals: storedSignals,
      competitor_signals,
      framing,
      render_ok: storedSignals?.render_ok !== false,
      render_meta: storedSignals?.render_meta ?? null,
      strategy_foundation,
    };
    const previousValidationError = typeof row.review_reason === "string" ? row.review_reason.trim() : "";
    const existingReport = row.report && typeof row.report === "object" && !Array.isArray(row.report) && Array.isArray((row.report as any).sections)
      ? row.report
      : null;

    step = "mark_generating";
    await supabase.from("audits").update({
      status: "generating",
      generation_started_at: new Date().toISOString(),
      review_reason: null,
    }).eq("id", audit_id);
    const tLoad = Date.now();
    console.log(`[run-audit-generation] ${audit_id} payload loaded in ${tLoad - t0}ms`);

    step = "call_generate_audit";
    const genUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-audit`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OUTER_TIMEOUT_MS);
    let genRes: Response;
    try {
      genRes = await fetch(genUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          payload,
          previous_validation_error: previousValidationError,
          existing_report: existingReport,
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") throw new Error(`generate-audit timed out after ${OUTER_TIMEOUT_MS}ms`);
      throw e;
    } finally {
      clearTimeout(timer);
    }
    const tGen = Date.now();

    step = "parse_generate_audit";
    const bodyText = await genRes.text();
    let genData: any = {};
    try { genData = bodyText ? JSON.parse(bodyText) : {}; } catch {
      throw new Error(`generate-audit returned non-JSON (status ${genRes.status}): ${bodyText.slice(0, 200)}`);
    }
    console.log(`[run-audit-generation] ${audit_id} generate-audit returned in ${tGen - tLoad}ms http=${genRes.status} status=${genData?.status}`);

    if (!genRes.ok && !genData?.status) {
      throw new Error(`generate-audit http ${genRes.status}: ${genData?.error ?? bodyText.slice(0, 200)}`);
    }

    step = "persist_result";
    if (genData?.status === "ready") {
      const reportWithGap = {
        ...genData.report,
        gap_hero: deriveGapHero(genData.report, storedSignals, strategy_foundation),
      };
      await writeTerminal({
        status: "ready",
        report: reportWithGap,
        brand_audit_score: genData.brand_audit_score,
        review_reason: null,
        raw_report: genData.raw_report ?? null,
        validation: genData.validation ?? null,
      });
      console.log(`[run-audit-generation] ${audit_id} ready in ${Date.now() - t0}ms total`);
      return;
    }

    // Note: generate-audit no longer returns a "review" status. Validation and
    // surgical repair run server-side and always terminate in either "ready"
    // (with any unresolved contradictions downgraded to soft warnings and the
    // copy rewritten to a signal-safe version) or an error. The user-facing
    // regenerate wall has been removed by design.

    throw new Error(genData?.error ?? `generate-audit returned unexpected status: ${genData?.status ?? "none"}`);
  } catch (e: any) {
    const reason = `[${step}] ${String(e?.message ?? e)}`;
    console.error(`[run-audit-generation] ${audit_id} failed`, reason);
    try {
      await writeTerminal({ status: "failed", review_reason: reason });
    } catch (writeErr) {
      console.error(`[run-audit-generation] ${audit_id} failed to write terminal status`, writeErr);
    }
  } finally {
    if (!terminalWritten) {
      try {
        const { data: cur } = await supabase
          .from("audits").select("status").eq("id", audit_id).maybeSingle();
        if (cur?.status === "generating") {
          await supabase.from("audits").update({
            status: "failed",
            review_reason: `[${step}] generation exited without writing a terminal status`,
          }).eq("id", audit_id);
        }
      } catch (e) {
        console.error(`[run-audit-generation] ${audit_id} finally guard error`, e);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { audit_id } = await req.json();
    if (!audit_id || typeof audit_id !== "string") {
      return new Response(JSON.stringify({ error: "invalid_audit_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const task = runGeneration(audit_id);
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(task);
    }

    return new Response(JSON.stringify({ audit_id, status: "generating" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});