// TEMP DIAGNOSTIC — remove after use.
// Read-only probe of the caller's LinkedIn connections. Does not write.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LI_VERSION = "202606";

async function introspect(token: string, clientId?: string, clientSecret?: string): Promise<string | null> {
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/introspectToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token,
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return typeof j?.scope === "string" ? j.scope : null;
  } catch {
    return null;
  }
}

async function probe(url: string, token: string) {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": LI_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    const body = await res.text();
    return { url, status: res.status, ok: res.ok, body: body.slice(0, 1500) };
  } catch (err) {
    return { url, status: 0, ok: false, body: `fetch_error: ${String(err)}`.slice(0, 1500) };
  }
}

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
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { data: rows, error: rowsErr } = await supabase
      .from("social_connections")
      .select("id, connection_type, access_token, expires_at, organization_id, organization_name, profile_name")
      .eq("user_id", userId)
      .eq("platform", "linkedin");
    if (rowsErr) throw rowsErr;

    const personalRow = (rows ?? []).find((r) => (r.connection_type ?? "personal") === "personal") ?? null;
    const orgRow = (rows ?? []).find((r) => r.connection_type === "company") ?? null;

    const now = Date.now();
    const isExpired = (iso: string | null | undefined) => !!iso && new Date(iso).getTime() < now;

    // Personal
    const personalToken = personalRow?.access_token ?? null;
    const personalScope = personalToken
      ? await introspect(personalToken, Deno.env.get("LINKEDIN_CLIENT_ID"), Deno.env.get("LINKEDIN_CLIENT_SECRET"))
      : null;
    const personalExpired = isExpired(personalRow?.expires_at);
    const memberAnalyticsScopePresent = !!personalScope && personalScope.includes("r_member_postAnalytics");
    const probeA = personalToken
      ? await probe(
          "https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL",
          personalToken,
        )
      : { url: "", status: 0, ok: false, body: "no_personal_token" };

    // Organization
    const orgToken = orgRow?.access_token ?? null;
    const orgId = orgRow?.organization_id ?? null;
    const orgScope = orgToken
      ? await introspect(orgToken, Deno.env.get("LINKEDIN_PAGES_CLIENT_ID"), Deno.env.get("LINKEDIN_PAGES_CLIENT_SECRET"))
      : null;
    const orgExpired = isExpired(orgRow?.expires_at);
    const orgReadScopePresent = !!orgScope && (
      orgScope.includes("r_organization_social") ||
      orgScope.includes("r_organization_admin") ||
      orgScope.includes("rw_organization_admin")
    );
    const probeB = orgToken && orgId
      ? await probe(
          `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(
            `urn:li:organization:${orgId}`,
          )}`,
          orgToken,
        )
      : { url: "", status: 0, ok: false, body: orgToken ? "no_org_id" : "no_org_token" };

    // Member analytics using the Pages/Community Management (org) token, which
    // now carries r_member_postAnalytics. The old personal-app token no longer
    // exists.
    const memberProbe = orgToken
      ? await probe(
          "https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=TOTAL",
          orgToken,
        )
      : { url: "", status: 0, ok: false, body: "no_org_token" };

    const result = {
      personal: {
        tokenPresent: !!personalToken,
        scope: personalScope,
        expiresAt: personalRow?.expires_at ?? null,
        expired: personalExpired,
        memberAnalyticsScopePresent,
        profileName: personalRow?.profile_name ?? null,
        probeA,
      },
      organization: {
        tokenPresent: !!orgToken,
        scope: orgScope,
        expiresAt: orgRow?.expires_at ?? null,
        expired: orgExpired,
        orgReadScopePresent,
        orgId,
        orgName: orgRow?.organization_name ?? null,
        probeB,
      },
      memberProbe,
    };

    console.log("linkedin-analytics-probe result:", JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("linkedin-analytics-probe error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});