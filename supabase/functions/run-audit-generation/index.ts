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

    const payload = {
      inputs: inputsForVera,
      model_type: row.model_type ?? null,
      low_data: row.low_data ?? false,
      signals: storedSignals,
      competitor_signals,
      framing,
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
      await writeTerminal({
        status: "ready",
        report: genData.report,
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