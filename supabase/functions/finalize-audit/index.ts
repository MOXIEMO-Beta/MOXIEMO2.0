import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeDomain } from "../_shared/audit-scrape.ts";

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

    // 1. Create audit row first (status = generating, with start timestamp)
    const { data: auditRow, error: auditErr } = await supabase
      .from("audits")
      .insert({
        domain,
        inputs: payload?.inputs ?? null,
        model_type: payload?.model_type ?? null,
        low_data: payload?.low_data ?? null,
        signals: payload?.signals ?? null,
        status: "generating",
        generation_started_at: new Date().toISOString(),
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