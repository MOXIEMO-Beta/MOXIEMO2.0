import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeDomain } from "../_shared/audit-scrape.ts";
import { deriveFraming } from "../_shared/audit-framing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-ignore - EdgeRuntime is provided by Supabase Edge runtime
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const url: string = body?.url ?? "";
    const payload = body?.payload ?? {};
    const lead = body?.lead ?? {};

    const domain = normalizeDomain(url);

    // OPTIONAL AUTH — the public marketing-tool path must continue to work with
    // zero changes. Only when the caller sent a Bearer token do we look up the
    // user, own the row, and load their strategy foundation.
    let userId: string | null = null;
    let strategyFoundation: any = null;
    let strategyId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const authed = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
        );
        const { data: userData } = await authed.auth.getUser();
        const sub = userData?.user?.id;
        if (sub) {
          userId = sub;
          const { data: strat } = await supabase
            .from("strategies")
            .select("id, enhanced_foundation, business_name, ideal_client, pain_point, differentiation, voice_attributes, transformation")
            .eq("user_id", sub)
            .maybeSingle();
          if (strat) {
            strategyId = strat.id ?? null;
            strategyFoundation = {
              enhanced_foundation: strat.enhanced_foundation ?? null,
              business_name: strat.business_name ?? null,
              ideal_client: strat.ideal_client ?? null,
              pain_point: strat.pain_point ?? null,
              differentiation: strat.differentiation ?? null,
              voice_attributes: strat.voice_attributes ?? null,
              transformation: strat.transformation ?? null,
            };
          }
        }
      } catch (e) {
        // Auth failure must not break the public flow. Log and continue as anon.
        console.warn("[finalize-audit] optional auth resolution failed:", String(e));
      }
    }

    // Derive stage and posture once, store on the row, and pass into Vera.
    const framing = deriveFraming({
      inputs: payload?.inputs ?? null,
      signals: payload?.signals ?? null,
      model_type: payload?.model_type ?? null,
      low_data: payload?.low_data ?? null,
    });

    // Merge competitor_signals (light-scraped per-competitor data) into the stored
    // signals so Vera can reason from real signal on every entered competitor.
    // If a signed-in user ran this audit, stash their strategy foundation on the
    // row so run-audit-generation can hoist it into the Vera payload.
    const mergedSignals = {
      ...(payload?.signals ?? {}),
      competitor_signals: Array.isArray(payload?.competitor_signals) ? payload.competitor_signals : [],
      render_ok: payload?.render_ok !== false,
      render_meta: payload?.render_meta ?? null,
      strategy_foundation: strategyFoundation,
      strategy_id: strategyId,
    };

    // 1. Create audit row first (status = generating, with start timestamp)
    const { data: auditRow, error: auditErr } = await supabase
      .from("audits")
      .insert({
        domain,
        inputs: payload?.inputs ?? null,
        model_type: payload?.model_type ?? null,
        low_data: payload?.low_data ?? null,
        signals: mergedSignals,
        stage: framing.stage,
        posture: framing.posture,
        status: "generating",
        generation_started_at: new Date().toISOString(),
        user_id: userId,
      })
      .select("id")
      .single();

    if (auditErr || !auditRow) {
      return new Response(JSON.stringify({ error: auditErr?.message ?? "audit_insert_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const audit_id = auditRow.id;

    // 2. Capture the lead immediately, even if generation fails
    if (lead?.email) {
      await supabase.from("leads").insert({
        audit_id,
        first_name: lead.first_name ?? null,
        last_name: lead.last_name ?? null,
        email: String(lead.email).trim().toLowerCase(),
        source: "brand_audit_tool",
      });
    }

    // 3. Fire-and-forget background generation via run-audit-generation.
    //    We return audit_id immediately and let the client poll get-audit-report.
    const runUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/run-audit-generation`;
    const kickoff = fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ audit_id }),
    }).catch((e) => {
      console.error("[finalize-audit] kickoff failed", e);
    });

    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(kickoff);
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