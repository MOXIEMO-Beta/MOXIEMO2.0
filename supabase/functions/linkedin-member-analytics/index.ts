// Reads the signed-in member's LinkedIn creator post analytics.
// Tries each stored LinkedIn token (personal, then company) so a single
// authorization that granted r_member_postAnalytics is enough to flip the
// personal card live. Returns pending on 403 (partnerApi gate) with logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const LI_VERSION = "202606";

function liHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": LI_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

type Attempt = {
  connection_type: string;
  status: number;
  ok: boolean;
  body_preview?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ status: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rows, error: rowsErr } = await supabase
      .from("social_connections")
      .select("access_token, expires_at, connection_type, profile_name")
      .eq("user_id", userData.user.id)
      .eq("platform", "linkedin");
    if (rowsErr) throw rowsErr;

    const conns = (rows ?? []).filter((r) => !!r.access_token);
    if (conns.length === 0) {
      return new Response(JSON.stringify({ status: "not_connected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer the company (Pages/Community Management) token: only that app
    // has r_member_postAnalytics provisioned. Fall back to personal.
    const ordered = [...conns].sort((a, b) => {
      const ap = (a.connection_type ?? "personal") === "company" ? 0 : 1;
      const bp = (b.connection_type ?? "personal") === "company" ? 0 : 1;
      return ap - bp;
    });

    const attempts: Attempt[] = [];
    let liveJson: unknown = null;
    let profileName: string | null = null;
    let sawAuthError = false;

    for (const conn of ordered) {
      const token = conn.access_token as string;
      const url =
        "https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL";
      const r = await fetch(url, { headers: liHeaders(token) });
      const bodyText = await r.text();
      attempts.push({
        connection_type: conn.connection_type ?? "personal",
        status: r.status,
        ok: r.ok,
        body_preview: bodyText.slice(0, 300),
      });
      console.log("member-analytics attempt", {
        connection_type: conn.connection_type,
        status: r.status,
        preview: bodyText.slice(0, 240),
      });
      if (r.ok) {
        try {
          liveJson = JSON.parse(bodyText);
        } catch {
          liveJson = null;
        }
        profileName = conn.profile_name ?? null;
        break;
      }
      if (r.status === 401) sawAuthError = true;
    }

    if (liveJson) {
      const elements: Array<Record<string, unknown>> = Array.isArray(
        (liveJson as { elements?: unknown }).elements,
      )
        ? ((liveJson as { elements: Array<Record<string, unknown>> }).elements)
        : [];
      let impressions = 0;
      for (const el of elements) {
        const v = Number((el as { value?: unknown }).value ?? 0);
        if (Number.isFinite(v)) impressions += v;
      }
      return new Response(
        JSON.stringify({
          status: "ok",
          profile_name: profileName,
          impressions,
          raw: liveJson,
          attempts,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (sawAuthError) {
      return new Response(
        JSON.stringify({ status: "reauth_required", attempts }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Any 403 (or other non-200) — keep honest pending state; likely partner tier gate.
    return new Response(
      JSON.stringify({ status: "pending", attempts }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("linkedin-member-analytics error", err);
    return new Response(JSON.stringify({ status: "error", error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});