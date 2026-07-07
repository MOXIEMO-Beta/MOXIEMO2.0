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
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_KIND = "member";

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
    // memberCreatorPostAnalytics returns { elements: [{ count, dateRange, ... }] }.
    // Older shapes used `value`. Accept either.
    const raw = (el as { count?: unknown; value?: unknown }).count ??
      (el as { value?: unknown }).value ?? 0;
    const v = Number(raw);
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

    const userId = userData.user.id;

    // Read cache. Serve fresh cache immediately; keep stale for fallback on upstream failure.
    const { data: cacheRow } = await supabase
      .from("linkedin_analytics_cache")
      .select("payload, fetched_at")
      .eq("user_id", userId)
      .eq("kind", CACHE_KIND)
      .eq("window_days", windowDays)
      .maybeSingle();
    const cachedAt = cacheRow?.fetched_at ? new Date(cacheRow.fetched_at).getTime() : 0;
    const cachedPayload = (cacheRow?.payload ?? null) as Record<string, unknown> | null;
    if (cachedPayload && Date.now() - cachedAt < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ ...cachedPayload, cached_at: cacheRow!.fetched_at, stale: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const serveStale = (extra: Record<string, unknown> = {}) => {
      if (!cachedPayload) return null;
      return new Response(
        JSON.stringify({ ...cachedPayload, cached_at: cacheRow!.fetched_at, stale: true, ...extra }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    };

    const { data: rows, error: rowsErr } = await supabase
      .from("social_connections")
      .select("access_token, expires_at, connection_type, profile_name, organization_name")
      .eq("user_id", userId)
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
    let sawRateLimit = false;

    for (const q of queries) {
      let url = `${base}&queryType=${q.type}${dateRangeParam}`;
      let r = await fetch(url, { headers: liHeaders(token) });
      let bodyText = await r.text();
      // Fallback: if dateRange is rejected, retry lifetime TOTAL and mark
      // the response as "all time".
      if (!r.ok && dateRangeParam && (r.status === 400 || r.status === 422)) {
        console.log("member-analytics dateRange rejected, falling back to lifetime", { status: r.status, body: bodyText.slice(0, 500) });
        attempts.push({ query: q.type, url, status: r.status, ok: false, body: bodyText.slice(0, 1500) });
        dateRangeParam = "";
        effectiveWindowDays = 0;
        url = `${base}&queryType=${q.type}`;
        r = await fetch(url, { headers: liHeaders(token) });
        bodyText = await r.text();
      }
      attempts.push({ query: q.type, url, status: r.status, ok: r.ok, body: bodyText.slice(0, 1500) });
      console.log("member-analytics", { queryType: q.type, url, status: r.status, body: bodyText.slice(0, 1500), days: effectiveWindowDays });
      if (r.status === 401) { sawAuthError = true; continue; }
      if (r.status === 429) { sawRateLimit = true; continue; }
      if (!r.ok) continue;
      sawOk = true;
      try {
        results[q.key] = sumValues(JSON.parse(bodyText));
      } catch { results[q.key] = 0; }
    }

    // Member profile analytics: visibility metrics (viewers, followers gained,
    // search appearances). Typed queryTypes, same dateRange semantics as posts.
    const profileBase = "https://api.linkedin.com/rest/memberProfileAnalytics?q=me&aggregation=TOTAL";
    const profileQueries: Array<{ key: "followersGained" | "profileViewers" | "searchAppearances"; type: string }> = [
      { key: "followersGained", type: "FOLLOWER" },
      { key: "profileViewers", type: "PROFILE_VIEW" },
      { key: "searchAppearances", type: "SEARCH_APPEARANCE" },
    ];
    const profileResults: Record<string, number> = {};
    for (const pq of profileQueries) {
      try {
        let url = `${profileBase}&queryType=${pq.type}${dateRangeParam}`;
        let r = await fetch(url, { headers: liHeaders(token) });
        let bodyText = await r.text();
        if (!r.ok && dateRangeParam && (r.status === 400 || r.status === 422)) {
          attempts.push({ query: `profile:${pq.type}`, url, status: r.status, ok: false, body: bodyText.slice(0, 800) });
          url = `${profileBase}&queryType=${pq.type}`;
          r = await fetch(url, { headers: liHeaders(token) });
          bodyText = await r.text();
        }
        attempts.push({ query: `profile:${pq.type}`, url, status: r.status, ok: r.ok, body: bodyText.slice(0, 800) });
        console.log("member-profile-analytics", { queryType: pq.type, status: r.status, days: effectiveWindowDays });
        if (r.status === 401) { sawAuthError = true; continue; }
        if (r.status === 429) { sawRateLimit = true; continue; }
        if (!r.ok) continue;
        sawOk = true;
        try { profileResults[pq.key] = sumValues(JSON.parse(bodyText)); } catch { profileResults[pq.key] = 0; }
      } catch (e) {
        console.log("member-profile-analytics fetch failed", pq.type, String(e));
      }
    }

    // Prior-window follower count for trend (only when a window is set).
    let followersGainedPrior: number | null = null;
    if (effectiveWindowDays > 0) {
      try {
        const now = new Date();
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const currentStart = new Date(end.getTime() - effectiveWindowDays * 86_400_000);
        const priorStart = new Date(currentStart.getTime() - effectiveWindowDays * 86_400_000);
        const fmt = (d: Date) =>
          `(day:${d.getUTCDate()},month:${d.getUTCMonth() + 1},year:${d.getUTCFullYear()})`;
        const priorRange = `&dateRange=(start:${fmt(priorStart)},end:${fmt(currentStart)})`;
        const url = `${profileBase}&queryType=FOLLOWER${priorRange}`;
        const r = await fetch(url, { headers: liHeaders(token) });
        const bodyText = await r.text();
        console.log("member-profile-analytics prior", { status: r.status, days: effectiveWindowDays });
        if (r.ok) {
          try { followersGainedPrior = sumValues(JSON.parse(bodyText)); } catch { followersGainedPrior = null; }
        }
      } catch (e) {
        console.log("member-profile-analytics prior fetch failed", String(e));
      }
    }

    if (sawOk) {
      const impressions = results.impressions ?? 0;
      const reach = results.reach ?? 0;
      const reactions = results.reactions ?? 0;
      const comments = results.comments ?? 0;
      const engagementPct = impressions > 0
        ? Math.round(((reactions + comments) / impressions) * 10000) / 100
        : 0;
      const payload = {
        status: "ok" as const,
        profile_name: profileName,
        window_days: effectiveWindowDays,
        window_label: effectiveWindowDays > 0 ? `last ${effectiveWindowDays} days` : "all time",
        impressions,
        reach,
        reactions,
        comments,
        engagementPct,
        followersGained: profileResults.followersGained ?? 0,
        followersGainedPrior,
        profileViewers: profileResults.profileViewers ?? 0,
        searchAppearances: profileResults.searchAppearances ?? 0,
        attempts,
      };
      const nowIso = new Date().toISOString();
      await supabase.from("linkedin_analytics_cache").upsert({
        user_id: userId, kind: CACHE_KIND, window_days: windowDays,
        payload, fetched_at: nowIso,
      }, { onConflict: "user_id,kind,window_days" });
      return new Response(
        JSON.stringify({ ...payload, cached_at: nowIso, stale: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upstream failure paths: prefer serving stale cache when available.
    if (sawRateLimit) {
      const stale = serveStale({ rate_limited: true });
      if (stale) return stale;
      return new Response(
        JSON.stringify({ status: "rate_limited" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (sawAuthError) {
      const stale = serveStale({ reauth_required: true });
      if (stale) return stale;
      return new Response(
        JSON.stringify({ status: "reauth_required", attempts }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const staleAny = serveStale();
    if (staleAny) return staleAny;
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