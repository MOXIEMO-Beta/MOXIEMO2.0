import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set(["strategy", "brand-kit", "brand-audit"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const document_type: string = body?.document_type ?? "";
    const source_id: string = body?.source_id ?? "";
    const rotate: boolean = !!body?.rotate;

    if (!ALLOWED_TYPES.has(document_type)) {
      return new Response(JSON.stringify({ error: "invalid_document_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!source_id || typeof source_id !== "string") {
      return new Response(JSON.stringify({ error: "invalid_source_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a live (non-revoked) share already exists for this doc, reuse unless rotating.
    if (!rotate) {
      const existing = await supabase
        .from("brand_kit_shares")
        .select("token")
        .eq("user_id", user.id)
        .eq("document_type", document_type)
        .eq("source_id", source_id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing.data?.token) {
        const origin = req.headers.get("origin") || "https://buildwithmoxiemo.com";
        return new Response(JSON.stringify({
          token: existing.data.token,
          shareUrl: `${origin.replace(/\/$/, "")}/shared/${existing.data.token}`,
          reused: true,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      // Rotate: revoke all existing live tokens for this doc.
      await supabase
        .from("brand_kit_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("document_type", document_type)
        .eq("source_id", source_id)
        .is("revoked_at", null);
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const { error: insertErr } = await supabase.from("brand_kit_shares").insert({
      user_id: user.id,
      document_type,
      source_id,
      token,
    });
    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://buildwithmoxiemo.com";
    const shareUrl = `${origin.replace(/\/$/, "")}/shared/${token}`;
    return new Response(JSON.stringify({ token, shareUrl, reused: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});