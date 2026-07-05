// Reads the signed-in member's LinkedIn creator post analytics.
// Uses the Pages / Community Management (company) token exclusively, since
// only that LinkedIn app has r_member_postAnalytics + r_member_profileAnalytics
// provisioned. Supports an optional { days } window that maps to LinkedIn
// timeIntervals (DAY granularity); omit for lifetime TOTAL.
// Returns reauth_required on 401 so the UI can prompt reconnect.
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
  query: string;
  url: string;
  status: number;
  ok: boolean;
  body?: string;
};

function sumValues(json: unknown): number {
  const els: Array<Record<string, unknown>> = Array.isArray(
    (json as { elements?: unknown })?.elements,
  )
    ? ((json as { elements: Array<Record<string, unknown>> }).elements)
    : [];
  let total = 0;
  for (const el of els) {
    const v = Number((el as { value?: unknown }).value ?? 0);
    if (Number.isFinite(v)) total += v;
  }
  return total;
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
      return new Response(JSON.stringify({ status: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse optional window (days). Cap at 90. 0 = lifetime.
    let windowDays = 0;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const raw = Number((body as { days?: unknown })?.days);
        if (Number.isFinite(raw)) windowDays = Math.max(0, Math.min(90, Math.floor(raw)));
      }
    } catch (_) { /* noop */ }

    const { data: rows, error: rowsErr } = await supabase
      .from("social_connections")
      .select("access_token, expires_at, connection_type, profile_name, organization_name")
      .eq("user_id", userData.user.id)
      .eq("platform", "linkedin");
    if (rowsErr) throw rowsErr;

    const conns = (rows ?? []).filter((r) => !!r.access_token);
    const companyConns = conns.filter(
      (c) => (c.connection_type ?? "personal") === "company",
    );
    if (companyConns.length === 0) {
      return new Response(JSON.stringify({ status: "not_connected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conn = companyConns[0];
    const token = conn.access_token as string;
    const profileName = conn.profile_name ?? conn.organization_name ?? null;

    // memberCreatorPostAnalytics does NOT accept timeIntervals (returns 400
    // QUERY_PARAM_NOT_ALLOWED). It supports dateRange=(start:(day,month,year),
    // end:(day,month,year)) at aggregation=TOTAL. When windowDays > 0 we send
    // a dateRange; otherwise lifetime TOTAL.
    let dateRangeParam = "";
    let effectiveWindowDays = windowDays;
    if (windowDays > 0) {
      const now = new Date();
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const start = new Date(end.getTime() - windowDays * 86_400_000);
      const fmt = (d: Date) =>
        `(day:${d.getUTCDate()},month:${d.getUTCMonth() + 1},year:${d.getUTCFullYear()})`;
      dateRangeParam = `&dateRange=(start:${fmt(start)},end:${fmt(end)})`;
    } else {
      effectiveWindowDays = 0;
    }

    const base = "https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=me&aggregation=TOTAL";
    const queries: Array<{ key: "impressions" | "reach" | "reactions" | "comments"; type: string }> = [
      { key: "impressions", type: "IMPRESSION" },
      { key: "reach", type: "MEMBERS_REACHED" },
      { key: "reactions", type: "REACTION" },
      { key: "comments", type: "COMMENT" },
    ];

    const attempts: Attempt[] = [];
    const results: Record<string, number> = {};
    let sawAuthError = false;
    let sawOk = false;

    for (const q of queries) {
      const url = `${base}&queryType=${q.type}${dateRangeParam}`;
      const r = await fetch(url, { headers: liHeaders(token) });
      const bodyText = await r.text();
      attempts.push({ query: q.type, url, status: r.status, ok: r.ok, body: bodyText.slice(0, 1500) });
      console.log("member-analytics", { queryType: q.type, url, status: r.status, body: bodyText.slice(0, 1500), days: windowDays });
      if (r.status === 401) { sawAuthError = true; continue; }
      if (!r.ok) continue;
      sawOk = true;
      try {
        results[q.key] = sumValues(JSON.parse(bodyText));
      } catch { results[q.key] = 0; }
    }

    // Best-effort: member profile analytics (viewers, followers, search appearances).
    let profileAnalyticsJson: unknown = null;
    try {
      const pUrl = `https://api.linkedin.com/rest/memberProfileAnalytics?q=me&aggregation=TOTAL${dateRangeParam}`;
      const pr = await fetch(pUrl, { headers: liHeaders(token) });
      const pBody = await pr.text();
      console.log("member-profile-analytics", { status: pr.status, days: windowDays });
      if (pr.status === 401) sawAuthError = true;
      if (pr.ok) {
        try { profileAnalyticsJson = JSON.parse(pBody); } catch { profileAnalyticsJson = null; }
      }
    } catch (e) {
      console.log("member-profile-analytics fetch failed", String(e));
    }

    if (sawOk) {
      const impressions = results.impressions ?? 0;
      const reach = results.reach ?? 0;
      const reactions = results.reactions ?? 0;
      const comments = results.comments ?? 0;
      const engagementPct = impressions > 0
        ? Math.round(((reactions + comments) / impressions) * 10000) / 100
        : 0;
      return new Response(
        JSON.stringify({
          status: "ok",
          profile_name: profileName,
          window_days: effectiveWindowDays,
          window_label: effectiveWindowDays > 0 ? `last ${effectiveWindowDays} days` : "all time",
          impressions,
          reach,
          reactions,
          comments,
          engagementPct,
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

    const firstFailure = attempts.find((a) => !a.ok) ?? attempts[0] ?? null;
    return new Response(
      JSON.stringify({
        status: "error",
        http_status: firstFailure?.status ?? 0,
        error: firstFailure ? `LinkedIn member analytics returned ${firstFailure.status}` : "LinkedIn member analytics returned no response",
        attempts,
      }),
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