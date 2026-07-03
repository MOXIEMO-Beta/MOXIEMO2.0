import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let token: string | null = null;
    if (req.method === "GET") {
      token = new URL(req.url).searchParams.get("token");
    } else {
      const body = await req.json().catch(() => ({}));
      token = body?.token ?? null;
    }
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client bypasses RLS to fetch the underlying document.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const share = await admin
      .from("brand_kit_shares")
      .select("id, user_id, document_type, source_id, revoked_at, created_at")
      .eq("token", token)
      .maybeSingle();

    if (share.error || !share.data) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (share.data.revoked_at) {
      return new Response(JSON.stringify({ error: "revoked" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_type, source_id, user_id } = share.data as {
      document_type: "strategy" | "brand-kit" | "brand-audit";
      source_id: string;
      user_id: string;
    };

    let document: unknown = null;

    if (document_type === "strategy") {
      const r = await admin.from("strategies").select("*").eq("id", source_id).maybeSingle();
      if (r.error || !r.data) {
        return new Response(JSON.stringify({ error: "document_missing" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      document = r.data;
    } else if (document_type === "brand-audit") {
      const r = await admin.from("audits").select("*").eq("id", source_id).maybeSingle();
      if (r.error || !r.data) {
        return new Response(JSON.stringify({ error: "document_missing" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      document = r.data;
    } else if (document_type === "brand-kit") {
      // Kit is derived from the owner's profile + strategy.
      const [profile, strategy] = await Promise.all([
        admin.from("profiles")
          .select("business_name, full_name, website_url, brand_colors, brand_logo_url, brand_fonts")
          .eq("id", user_id).maybeSingle(),
        admin.from("strategies").select("*").eq("user_id", user_id).maybeSingle(),
      ]);
      document = {
        profile: profile.data ?? null,
        strategy: strategy.data ?? null,
      };
    }

    return new Response(JSON.stringify({
      document_type,
      created_at: share.data.created_at,
      document,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});