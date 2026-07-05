// Reads live LinkedIn organization analytics for the signed-in user's Page connection.
// Uses stored Page OAuth token. Returns aggregate stats + top posts by impressions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const LI_VERSION = "202606";

type Stats = {
  impressionCount?: number;
  uniqueImpressionsCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  clickCount?: number;
  engagement?: number;
};

type TopPost = {
  urn: string;
  text: string;
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  clicks: number;
  engagementPct: number | null;
};

function liHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": LI_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

function firstText(post: Record<string, unknown>): string {
  const commentary = (post as { commentary?: string }).commentary;
  if (typeof commentary === "string" && commentary.trim()) return commentary.trim();
  const specificContent = post["specificContent"] as
    | { "com.linkedin.ugc.ShareContent"?: { shareCommentary?: { text?: string } } }
    | undefined;
  const t = specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text;
  return typeof t === "string" ? t.trim() : "";
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

    const { data: rows, error: rowsErr } = await supabase
      .from("social_connections")
      .select("access_token, expires_at, organization_id, organization_name, connection_type")
      .eq("user_id", userData.user.id)
      .eq("platform", "linkedin")
      .eq("connection_type", "company");
    if (rowsErr) throw rowsErr;

    const conn = (rows ?? [])[0] ?? null;
    if (!conn?.access_token || !conn?.organization_id) {
      return new Response(
        JSON.stringify({ status: "not_connected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const orgUrn = `urn:li:organization:${conn.organization_id}`;
    const token = conn.access_token as string;

    // 1) Aggregate org stats
    const statsUrl = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`;
    const statsRes = await fetch(statsUrl, { headers: liHeaders(token) });
    if (statsRes.status === 401) {
      return new Response(
        JSON.stringify({ status: "reauth_required", organization_name: conn.organization_name }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!statsRes.ok) {
      const body = await statsRes.text();
      return new Response(
        JSON.stringify({ status: "error", http_status: statsRes.status, body: body.slice(0, 500) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const statsJson = await statsRes.json();
    const first = Array.isArray(statsJson?.elements) ? statsJson.elements[0] : null;
    const total: Stats = first?.totalShareStatistics ?? {};

    const impressions = total.impressionCount ?? 0;
    const engagementPct = typeof total.engagement === "number"
      ? Math.round(total.engagement * 10000) / 100
      : 0;

    // 2) Top posts by impressions.
    // /rest/posts returns the org's posts; then pull per-share stats.
    let topPosts: TopPost[] = [];
    try {
      const postsUrl = `https://api.linkedin.com/rest/posts?q=author&author=${encodeURIComponent(orgUrn)}&count=20&sortBy=LAST_MODIFIED`;
      const postsRes = await fetch(postsUrl, { headers: liHeaders(token) });
      if (postsRes.ok) {
        const postsJson = await postsRes.json();
        const els: Array<Record<string, unknown>> = postsJson?.elements ?? [];
        const urns = els.map((p) => String(p["id"] ?? "")).filter(Boolean);
        const textByUrn = new Map<string, string>();
        for (const p of els) textByUrn.set(String(p["id"] ?? ""), firstText(p));

        // Per-share stats: query one URN at a time (simple and reliable).
        const perShareLimit = Math.min(urns.length, 12);
        const results = await Promise.all(
          urns.slice(0, perShareLimit).map(async (urn) => {
            const url = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}&shares=List(${encodeURIComponent(urn)})`;
            const r = await fetch(url, { headers: liHeaders(token) });
            if (!r.ok) return null;
            const j = await r.json();
            const el = Array.isArray(j?.elements) ? j.elements[0] : null;
            const s: Stats = el?.totalShareStatistics ?? {};
            return {
              urn,
              text: textByUrn.get(urn) ?? "",
              impressions: s.impressionCount ?? 0,
              reach: s.uniqueImpressionsCount ?? 0,
              reactions: s.likeCount ?? 0,
              comments: s.commentCount ?? 0,
              clicks: s.clickCount ?? 0,
              engagementPct: typeof s.engagement === "number"
                ? Math.round(s.engagement * 10000) / 100
                : null,
            } as TopPost;
          }),
        );
        topPosts = results
          .filter((x): x is TopPost => !!x && x.impressions > 0)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 5);
      }
    } catch (_) {
      // Best-effort. Aggregate stats are already returned.
    }

    return new Response(
      JSON.stringify({
        status: impressions === 0 && topPosts.length === 0 ? "empty" : "ok",
        organization_name: conn.organization_name,
        organization_id: conn.organization_id,
        expires_at: conn.expires_at,
        stats: {
          impressions,
          reach: total.uniqueImpressionsCount ?? 0,
          reactions: total.likeCount ?? 0,
          comments: total.commentCount ?? 0,
          shares: total.shareCount ?? 0,
          clicks: total.clickCount ?? 0,
          engagementPct,
        },
        topPosts,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("linkedin-page-analytics error", err);
    return new Response(JSON.stringify({ status: "error", error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});