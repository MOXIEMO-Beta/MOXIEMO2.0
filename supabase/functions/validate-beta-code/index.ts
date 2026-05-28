import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "validate";
    const code = String(body.code || "").toUpperCase().trim();
    if (!code) {
      return new Response(JSON.stringify({ valid: false, error: "code_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("beta_codes")
      .select("id, uses_count, max_uses, expires_at, active")
      .eq("code", code)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ valid: false, error: "invalid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((data.uses_count ?? 0) >= (data.max_uses ?? 0)) {
      return new Response(JSON.stringify({ valid: false, error: "max_uses_reached" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "consume") {
      // Auth required to consume
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ valid: false, error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
        headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
      });
      if (!userRes.ok) {
        return new Response(JSON.stringify({ valid: false, error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("beta_codes")
        .update({ uses_count: (data.uses_count ?? 0) + 1 })
        .eq("id", data.id);
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-beta-code error:", e);
    return new Response(JSON.stringify({ valid: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});