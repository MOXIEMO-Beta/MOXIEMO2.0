// Reads the signed-in member's LinkedIn creator post analytics.
// Uses the Pages / Community Management (company) token exclusively, since
// only that LinkedIn app has r_member_postAnalytics + r_member_profileAnalytics
// provisioned. The old personal Share app no longer carries these scopes,
// so we never fall back to a personal-app token.
// Returns pending on 403 (partnerApi gate) with logs.
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
    // Only the company (Pages / Community Management) token has the member
    // analytics scopes provisioned. Ignore any personal-app tokens entirely.
    const companyConns = conns.filter(
      (c) => (c.connection_type ?? "personal") === "company",
    );
    if (companyConns.length === 0) {
      return new Response(JSON.stringify({ status: "not_connected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ordered = companyConns;

    const attempts: Attempt[] = [];
    let liveJson: unknown = null;
    let profileName: string | null = null;
    let sawAuthError = false;
    let profileAnalyticsJson: unknown = null;

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
        // Best-effort: also pull member profile analytics (viewers, followers,
        // search appearances) using the same token. Non-fatal on failure.
        try {
          const pUrl =
            "https://api.linkedin.com/rest/memberProfileAnalytics?q=me&aggregation=TOTAL";
          const pr = await fetch(pUrl, { headers: liHeaders(token) });
          const pBody = await pr.text();
          console.log("member-profile-analytics", {
            status: pr.status,
            preview: pBody.slice(0, 240),
          });
          if (pr.ok) {
            try {
              profileAnalyticsJson = JSON.parse(pBody);
            } catch {
              profileAnalyticsJson = null;
            }
          }
        } catch (e) {
          console.log("member-profile-analytics fetch failed", String(e));
        }
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
          profile_analytics: profileAnalyticsJson,
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