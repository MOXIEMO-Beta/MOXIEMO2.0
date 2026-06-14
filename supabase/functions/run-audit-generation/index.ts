import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-ignore - EdgeRuntime is provided by Supabase Edge runtime
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

async function runGeneration(audit_id: string) {
  const t0 = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Load stored payload from the audit row
  const { data: row, error: loadErr } = await supabase
    .from("audits")
    .select("inputs, model_type, low_data, signals")
    .eq("id", audit_id)
    .maybeSingle();

  if (loadErr || !row) {
    console.error("[run-audit-generation] load failed", audit_id, loadErr);
    await supabase.from("audits").update({
      status: "review",
      review_reason: "Could not load audit payload.",
    }).eq("id", audit_id);
    return;
  }

  const payload = {
    inputs: row.inputs ?? {},
    model_type: row.model_type ?? null,
    low_data: row.low_data ?? false,
    signals: row.signals ?? {},
  };

  // Mark generation start (re-stamp in case of regenerate)
  await supabase.from("audits").update({
    status: "generating",
    generation_started_at: new Date().toISOString(),
    review_reason: null,
  }).eq("id", audit_id);

  const tLoad = Date.now();
  console.log(`[run-audit-generation] ${audit_id} payload loaded in ${tLoad - t0}ms`);

  try {
    const genUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-audit`;
    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ payload }),
    });
    const tGen = Date.now();
    const genData = await genRes.json().catch(() => ({} as any));
    console.log(`[run-audit-generation] ${audit_id} generate-audit returned in ${tGen - tLoad}ms status=${genData?.status}`);

    if (genData?.status === "ready") {
      await supabase.from("audits").update({
        status: "ready",
        report: genData.report,
        brand_audit_score: genData.brand_audit_score,
        review_reason: null,
      }).eq("id", audit_id);
      console.log(`[run-audit-generation] ${audit_id} ready in ${Date.now() - t0}ms total`);
      return;
    }

    if (genData?.status === "review") {
      const issues: string[] = Array.isArray(genData.issues) ? genData.issues : [];
      const reason = issues[0] || "Report did not pass validation.";
      await supabase.from("audits").update({
        status: "review",
        report: { issues },
        review_reason: reason,
      }).eq("id", audit_id);
      console.log(`[run-audit-generation] ${audit_id} review reason=${reason}`);
      return;
    }

    await supabase.from("audits").update({
      status: "review",
      review_reason: genData?.error ?? "Generation failed.",
    }).eq("id", audit_id);
  } catch (e: any) {
    console.error("[run-audit-generation] exception", audit_id, e);
    await supabase.from("audits").update({
      status: "review",
      review_reason: String(e?.message ?? e),
    }).eq("id", audit_id);
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