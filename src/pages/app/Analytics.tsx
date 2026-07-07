import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Linkedin, User, Clock, TrendingUp, AlertTriangle, ArrowRight, Zap, CircleDot, RefreshCw, Facebook, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const CORAL = "#E85A46";
const BORDER = "0.5px solid #ECEAE5";
const SURFACE_1 = "#FFFDF7";
const SURFACE_2 = "#FFFFFF";
const TEXT_PRIMARY = "#0E0F10";
const TEXT_SECONDARY = "#3F3D38";
const TEXT_MUTED = "#6B6860";
const SUCCESS_BG = "#E8F5EC";
const SUCCESS_FG = "#1F7A3A";
const WARN_BG = "#FBEEDA";
const WARN_FG = "#8A5A1A";
const DISPLAY_FONT = "'Space Grotesk', ui-sans-serif, system-ui";

type Strategy = { content_pillars?: unknown; strength_score?: number | null };
type SocialPost = {
  id: string; user_id: string; platforms: string[] | null; content_by_platform: Record<string, string> | null;
  pillar: string | null; status: string; published_at: string | null; created_at: string; topic: string | null;
  platform_post_ids: Record<string, string> | string[] | null;
};
type SocialAnalytic = {
  post_id: string | null; platform: string | null; impressions: number | null; reach: number | null;
  likes: number | null; comments: number | null; shares: number | null; engagement_rate: number | null; fetched_at: string;
};
type SocialConn = {
  platform: string; connection_type: string | null; expires_at: string | null;
  organization_name: string | null; profile_name: string | null;
};

type PageStats = {
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementPct: number;
};
type PageTopPost = {
  urn: string; text: string; impressions: number; reach: number;
  reactions: number; comments: number; clicks: number; engagementPct: number | null;
};
type PageResp =
  | ({ status: "ok"; organization_name: string | null; stats: PageStats; topPosts: PageTopPost[]; window_days?: number } & CacheMeta)
  | ({ status: "empty"; organization_name: string | null; stats: PageStats; topPosts: PageTopPost[]; window_days?: number } & CacheMeta)
  | { status: "not_connected" }
  | ({ status: "reauth_required"; organization_name?: string | null } & CacheMeta)
  | ({ status: "rate_limited"; organization_name?: string | null } & CacheMeta)
  | ({ status: "error"; http_status?: number; body?: string; error?: string } & CacheMeta);

type CacheMeta = { cached_at?: string; stale?: boolean; rate_limited?: boolean; reauth_required?: boolean };

type MemberResp =
  | ({
      status: "ok";
      profile_name: string | null;
      profile?: { name: string | null; headline: string | null; pictureUrl: string | null } | null;
      window_days?: number;
      window_label?: string;
      impressions: number;
      reach: number;
      reactions: number;
      comments: number;
      reposts?: number;
      engagementPct: number;
      followersGained?: number | null;
      followersGainedPrior?: number | null;
      followerCountLifetime?: number | null;
      profileViewers?: number | null;
      searchAppearances?: number | null;
      attempts?: MemberAttempt[];
    } & CacheMeta)
  | ({ status: "reauth_required"; attempts?: MemberAttempt[] } & CacheMeta)
  | ({ status: "rate_limited" } & CacheMeta)
  | { status: "not_connected" }
  | ({ status: "error"; http_status?: number; error?: string; attempts?: MemberAttempt[] } & CacheMeta);

type MemberAttempt = {
  query: string;
  url: string;
  status: number;
  ok: boolean;
  body?: string;
};

function pillarsOf(s: Strategy | null): string[] {
  const v = s?.content_pillars;
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : (x as { name?: string })?.name ?? "")).filter(Boolean);
}

type RangeKey = "1" | "7" | "14" | "30" | "90";
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "1", label: "Today", days: 1 },
  { key: "7", label: "7d", days: 7 },
  { key: "14", label: "14d", days: 14 },
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
];
const RANGE_LABELS: Record<RangeKey, string> = {
  "1": "Today",
  "7": "Last 7 days",
  "14": "Last 14 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
};

function Eyebrow({ children, color = CORAL }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 500, color }}>{children}</div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SURFACE_2, border: BORDER, borderRadius: 12, padding: "1.1rem 1.25rem", ...style }}>{children}</div>
  );
}

function Metric({ label, value, sub, mutedValue }: { label: string; value: React.ReactNode; sub?: React.ReactNode; mutedValue?: boolean }) {
  return (
    <div style={{ background: SURFACE_1, borderRadius: 10, padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{label}</div>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 500, marginTop: 2, color: mutedValue ? TEXT_MUTED : TEXT_PRIMARY }}>
        {value} {sub && <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 400 }}>{sub}</span>}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "live" | "pending"; children: React.ReactNode }) {
  const bg = tone === "live" ? SUCCESS_BG : WARN_BG;
  const fg = tone === "live" ? SUCCESS_FG : WARN_FG;
  return (
    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, display: "inline-flex", gap: 5, alignItems: "center", background: bg, color: fg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function extractUrns(v: SocialPost["platform_post_ids"]): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "object") return Object.values(v).filter((x): x is string => typeof x === "string");
  return [];
}

function relativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "updated just now";
  const m = Math.round(s / 60);
  if (m < 60) return `updated ${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `updated ${h} hr ago`;
  return "updated a while ago";
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<SocialAnalytic[]>([]);
  const [connections, setConnections] = useState<SocialConn[]>([]);
  const [pageResp, setPageResp] = useState<PageResp | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [memberResp, setMemberResp] = useState<MemberResp | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("30");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        supabase.from("strategies").select("content_pillars, strength_score").eq("user_id", user.id).maybeSingle(),
        supabase.from("social_posts").select("id, user_id, platforms, content_by_platform, pillar, status, published_at, created_at, topic, platform_post_ids").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("social_analytics").select("post_id, platform, impressions, reach, likes, comments, shares, engagement_rate, fetched_at").eq("user_id", user.id).order("fetched_at", { ascending: false }),
        supabase.from("social_connections").select("platform, connection_type, expires_at, organization_name, profile_name").eq("user_id", user.id).eq("platform", "linkedin"),
      ]);
      const get = <T,>(i: number, fallback: T): T =>
        results[i].status === "fulfilled" ? ((results[i] as PromiseFulfilledResult<{ data: T | null }>).value?.data ?? fallback) : fallback;
      setStrategy(get(0, null as Strategy | null));
      setPosts(get(1, [] as SocialPost[]));
      setAnalytics(get(2, [] as SocialAnalytic[]));
      setConnections(get(3, [] as SocialConn[]));
      setLoading(false);
    })();
  }, [user]);

  const fetchPage = useCallback(async () => {
    setPageLoading(true);
    const days = RANGES.find((r) => r.key === range)?.days ?? 30;
    try {
      const { data, error } = await supabase.functions.invoke("linkedin-page-analytics", {
        method: "POST",
        body: { days },
      });
      if (error) throw error;
      setPageResp(data as PageResp);
    } catch {
      setPageResp({ status: "error", error: "network" });
    } finally {
      setPageLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (!user) return;
    void fetchPage();
  }, [user, fetchPage]);

  // Member (personal) analytics — reruns when the range control changes so
  // the personal window mirrors the Page window.
  const fetchMember = useCallback(async () => {
    setMemberLoading(true);
    const days = RANGES.find((r) => r.key === range)?.days ?? 30;
    try {
      const { data, error } = await supabase.functions.invoke("linkedin-member-analytics", {
        method: "POST",
        body: { days },
      });
      if (error) throw error;
      setMemberResp(data as MemberResp);
    } catch {
      setMemberResp({ status: "error", error: "network" });
    } finally {
      setMemberLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (!user) return;
    void fetchMember();
  }, [user, fetchMember]);

  const orgConn = useMemo(() => connections.find((c) => c.connection_type === "company") ?? null, [connections]);

  // URN → pillar map, so top posts (fetched from LinkedIn) can show their MOXIEMO pillar tag.
  const pillarByUrn = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of posts) {
      if (!p.pillar) continue;
      for (const urn of extractUrns(p.platform_post_ids)) m.set(urn, p.pillar);
    }
    return m;
  }, [posts]);

  // Engine health
  const pillars = useMemo(() => pillarsOf(strategy), [strategy]);
  const piecesGenerated = posts.length;
  const pillarsUsed = useMemo(() => {
    const s = new Set<string>();
    for (const p of posts) if (p.pillar && pillars.includes(p.pillar)) s.add(p.pillar);
    return s.size;
  }, [posts, pillars]);
  const strategyStrength = strategy?.strength_score ?? 0;
  const draftsReady = useMemo(() => posts.filter((p) => p.status === "draft").length, [posts]);

  // LinkedIn Page performance — sourced from the org statistics endpoint, not MOXIEMO's posts.
  const pageHasStats = pageResp?.status === "ok" || pageResp?.status === "empty";
  const pageStats: PageStats = pageHasStats
    ? (pageResp as { stats: PageStats }).stats
    : { impressions: 0, reach: 0, reactions: 0, comments: 0, shares: 0, clicks: 0, engagementPct: 0 };
  const bestPagePosts: PageTopPost[] = pageHasStats
    ? (pageResp as { topPosts: PageTopPost[] }).topPosts
    : [];
  const pageIsLive = pageResp?.status === "ok";
  const pageIsEmpty = pageResp?.status === "empty";
  const pageNeedsReauth = pageResp?.status === "reauth_required";
  const pageIsRateLimited = pageResp?.status === "rate_limited" || !!(pageResp && "rate_limited" in pageResp && (pageResp as { rate_limited?: boolean }).rate_limited);
  const pageIsError = pageResp?.status === "error";
  const pageStale = !!(pageResp && "stale" in pageResp && (pageResp as { stale?: boolean }).stale);
  const pageCachedAt = (pageResp && "cached_at" in pageResp ? (pageResp as { cached_at?: string }).cached_at : undefined);
  const rangeLabel = RANGE_LABELS[range];

  // Enrich top posts with pillar tags derived from MOXIEMO records.
  const bestPagePostsEnriched = useMemo(
    () => bestPagePosts.map((tp) => ({ ...tp, pillar: pillarByUrn.get(tp.urn) ?? null })),
    [bestPagePosts, pillarByUrn]
  );

  // Deeper insights read the top-5 set within the selected window.
  const topSetStats = useMemo(() => {
    const set = bestPagePostsEnriched;
    if (set.length === 0) {
      return { avgEngagement: 0, dominantPillar: null as string | null, weakPillar: null as string | null, count: 0 };
    }
    const engVals = set.map((p) => p.engagementPct).filter((x): x is number => typeof x === "number");
    const avgEngagement = engVals.length
      ? Math.round((engVals.reduce((a, b) => a + b, 0) / engVals.length) * 100) / 100
      : 0;
    const counts = new Map<string, number>();
    for (const p of set) if (p.pillar) counts.set(p.pillar, (counts.get(p.pillar) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const dominantPillar = sorted[0]?.[0] ?? null;
    // Weak pillar: a strategy pillar with the fewest (or zero) hits in the top-5.
    let weakPillar: string | null = null;
    if (pillars.length > 0) {
      const scored = pillars.map((p) => ({ p, n: counts.get(p) ?? 0 })).sort((a, b) => a.n - b.n);
      if (scored[0] && scored[0].p !== dominantPillar) weakPillar = scored[0].p;
    }
    return { avgEngagement, dominantPillar, weakPillar, count: set.length };
  }, [bestPagePostsEnriched, pillars]);

  const insights = useMemo(() => {
    const out: { kind: "up" | "warn"; text: string }[] = [];
    if (pageIsLive && topSetStats.count > 0) {
      const label = rangeLabel.toLowerCase();
      if (topSetStats.avgEngagement >= 5) {
        out.push({ kind: "up", text: `Your top ${topSetStats.count} posts average ${topSetStats.avgEngagement}% engagement against impressions over the ${label}, above the LinkedIn norm.` });
      } else if (topSetStats.avgEngagement > 0) {
        out.push({ kind: "warn", text: `Your top ${topSetStats.count} posts average ${topSetStats.avgEngagement}% engagement against impressions over the ${label}. Tighter opening lines will lift this.` });
      }
      if (topSetStats.dominantPillar) {
        out.push({ kind: "up", text: `${topSetStats.dominantPillar} holds the most spots on your leaderboard. That angle is landing.` });
      }
      if (topSetStats.weakPillar) {
        out.push({ kind: "warn", text: `${topSetStats.weakPillar} is thin on the leaderboard. Test it with a fresh angle.` });
      }
    } else if (pageIsLive && topSetStats.count === 0) {
      out.push({ kind: "warn", text: `No Page posts landed in the ${rangeLabel.toLowerCase()} window. Widen the range or publish a new post to build signal.` });
    } else if (pageIsEmpty) {
      out.push({ kind: "warn", text: "Your Page has no activity in this window to score yet. Publish two posts this week to unlock real signal." });
    } else if (pageNeedsReauth) {
      out.push({ kind: "warn", text: "Reconnect your LinkedIn Page to read live analytics." });
    } else {
      out.push({ kind: "warn", text: "Waiting on live LinkedIn Page numbers to score the pattern." });
    }
    return out.slice(0, 3);
  }, [pageIsLive, pageIsEmpty, pageNeedsReauth, topSetStats, rangeLabel]);

  const suggestions = useMemo(() => {
    const out: { text: string; pillar?: string }[] = [];
    if (topSetStats.dominantPillar) {
      out.push({ text: `Another ${topSetStats.dominantPillar} post, your best-performing angle on the leaderboard.`, pillar: topSetStats.dominantPillar });
    }
    if (topSetStats.weakPillar) {
      out.push({ text: `A ${topSetStats.weakPillar} post to lift your weakest pillar.`, pillar: topSetStats.weakPillar });
    }
    if (out.length === 0) {
      const empty = pillars.filter((p) => !posts.some((post) => post.pillar === p));
      for (const p of empty.slice(0, 2)) out.push({ text: `A ${p} post to balance your pillars.`, pillar: p });
    }
    if (out.length === 0 && pillars.length > 0) {
      out.push({ text: `Start with a ${pillars[0]} post to seed the engine.`, pillar: pillars[0] });
    }
    if (out.length === 0) out.push({ text: "Set your content pillars in Strategy, then generate your first post." });
    return out.slice(0, 3);
  }, [topSetStats, pillars, posts]);

  const memberAttempts: MemberAttempt[] =
    memberResp && "attempts" in memberResp && Array.isArray(memberResp.attempts) ? memberResp.attempts : [];
  void memberAttempts;
  const memberStale = !!(memberResp && "stale" in memberResp && (memberResp as { stale?: boolean }).stale);
  const memberCachedAt = (memberResp && "cached_at" in memberResp ? (memberResp as { cached_at?: string }).cached_at : undefined);
  const memberIsRateLimited = memberResp?.status === "rate_limited" || !!(memberResp && "rate_limited" in memberResp && (memberResp as { rate_limited?: boolean }).rate_limited);
  const memberCalmLabel = memberLoading
    ? "Loading"
    : memberResp?.status === "not_connected"
      ? "Not connected"
      : memberResp?.status === "reauth_required"
        ? "Reconnect needed"
        : "Refreshing shortly";
  const memberImpressionsValue = memberResp?.status === "ok" ? memberResp.impressions.toLocaleString() : memberCalmLabel;
  const memberReachValue = memberResp?.status === "ok" ? memberResp.reach.toLocaleString() : memberCalmLabel;
  const memberEngagementValue = memberResp?.status === "ok" ? `${memberResp.engagementPct}%` : memberCalmLabel;
  const memberReactionsValue = memberResp?.status === "ok" ? memberResp.reactions.toLocaleString() : memberCalmLabel;
  const memberCommentsValue = memberResp?.status === "ok" ? memberResp.comments.toLocaleString() : memberCalmLabel;
  const memberFollowersGained = memberResp?.status === "ok" ? (memberResp.followersGained ?? null) : null;
  const memberFollowersPrior = memberResp?.status === "ok" ? (memberResp.followersGainedPrior ?? null) : null;
  const memberTotalFollowers = memberResp?.status === "ok" ? (memberResp.followerCountLifetime ?? null) : null;
  const memberReposts = memberResp?.status === "ok" ? (memberResp.reposts ?? null) : null;
  const memberProfile = memberResp?.status === "ok" ? (memberResp.profile ?? null) : null;
  const memberProfileViewers: number | null = null;
  const followersTrend = (() => {
    if (memberFollowersGained == null || memberFollowersPrior == null) return null;
    const delta = memberFollowersGained - memberFollowersPrior;
    if (memberFollowersPrior === 0 && memberFollowersGained === 0) return null;
    if (memberFollowersPrior === 0) return { dir: "up" as const, text: "new this window" };
    const pct = Math.round((delta / Math.max(1, memberFollowersPrior)) * 100);
    if (pct === 0) return { dir: "flat" as const, text: "flat vs prior window" };
    return { dir: pct > 0 ? ("up" as const) : ("down" as const), text: `${pct > 0 ? "+" : ""}${pct}% vs prior window` };
  })();

  const personalInsights = useMemo(() => {
    const out: { kind: "up" | "warn"; text: string }[] = [];
    if (memberResp?.status !== "ok") {
      out.push({ kind: "warn", text: "Waiting on live LinkedIn creator numbers to score your personal pattern." });
      return out;
    }
    const eng = memberResp.engagementPct ?? 0;
    if (eng >= 5) {
      out.push({ kind: "up", text: `Your posts run at ${eng}% engagement, above the LinkedIn creator norm.` });
    } else if (eng > 0) {
      out.push({ kind: "warn", text: `Your posts run at ${eng}% engagement. Sharper hooks in the first two lines will lift this.` });
    }
    if (followersTrend) {
      if (followersTrend.dir === "up") {
        out.push({ kind: "up", text: `Followers are accelerating (${followersTrend.text}). Keep the cadence.` });
      } else if (followersTrend.dir === "down") {
        out.push({ kind: "warn", text: `Follower growth slowed (${followersTrend.text}). A stronger point of view post can restart it.` });
      } else {
        out.push({ kind: "warn", text: "Follower growth is flat. A stronger point of view post can restart it." });
      }
    }
    const viewers = memberProfileViewers ?? 0;
    const gained = memberFollowersGained ?? 0;
    if (viewers > 0) {
      const conv = Math.round((gained / viewers) * 1000) / 10;
      if (gained === 0) {
        out.push({ kind: "warn", text: `${viewers} profile viewers converted to zero follows. Your headline and About need a clearer promise.` });
      } else {
        out.push({ kind: "up", text: `${viewers} profile viewers converted to ${gained} follows (${conv}%).` });
      }
    }
    return out.slice(0, 3);
  }, [memberResp, followersTrend, memberProfileViewers, memberFollowersGained]);

  const personalSuggestions = useMemo(() => {
    const out: { text: string; pillar?: string }[] = [];
    if (memberResp?.status === "ok") {
      const eng = memberResp.engagementPct ?? 0;
      const primary = topSetStats.dominantPillar ?? pillars[0] ?? null;
      if (primary) {
        out.push({ text: `A first-person ${primary} post from your point of view — your strongest angle.`, pillar: primary });
      }
      if (eng < 3) {
        out.push({ text: "A short hook-led post (2 line opener, one insight, one ask) to lift engagement." });
      }
      if ((memberFollowersGained ?? 0) === 0 && (memberProfileViewers ?? 0) > 0) {
        out.push({ text: "A profile-repositioning post that restates who you help and how, to convert viewers to follows." });
      }
    }
    if (out.length === 0 && pillars.length > 0) {
      out.push({ text: `A ${pillars[0]} post to seed your personal signal.`, pillar: pillars[0] });
    }
    if (out.length === 0) {
      out.push({ text: "Set your content pillars in Strategy, then generate your first personal post." });
    }
    return out.slice(0, 3);
  }, [memberResp, topSetStats.dominantPillar, pillars, memberFollowersGained, memberProfileViewers]);

  function goCreate(pillar?: string) {
    const q = pillar ? `?pillar=${encodeURIComponent(pillar)}` : "";
    navigate(`/app/content${q}`);
  }

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-8 w-full">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-8 w-96 mb-2" />
        <Skeleton className="h-4 w-[520px] mb-8" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8 w-full" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", color: TEXT_PRIMARY }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <Eyebrow>Analytics</Eyebrow>
        <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 500, color: TEXT_PRIMARY, margin: "0.35rem 0 0.3rem" }}>
          Is the engine working?
        </h2>
        <div style={{ fontSize: 13.5, color: TEXT_SECONDARY }}>
          The numbers, the posts behind them, what the pattern says, and what to make next.
        </div>
      </div>

      {/* Engine health */}
      <Card style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <Eyebrow color={SUCCESS_FG}>Engine health</Eyebrow>
          <span style={{ fontSize: 11.5, color: TEXT_MUTED, display: "inline-flex", gap: 5, alignItems: "center" }}>
            <Zap size={13} /> Always on, from your strategy
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="Pieces generated" value={piecesGenerated} />
          <Metric label="Pillar coverage" value={pillarsUsed} sub={`of ${pillars.length || 0}`} />
          <Metric label="Strategy alignment" value={`${strategyStrength}%`} />
          <Metric label="Drafts ready" value={draftsReady} />
        </div>
      </Card>

      {/* Distribution header + range control */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", gap: 12, flexWrap: "wrap" }}>
        <Eyebrow color={TEXT_MUTED}>Distribution</Eyebrow>
        <div role="tablist" aria-label="Date range" style={{ display: "inline-flex", background: SURFACE_2, border: BORDER, borderRadius: 999, padding: 2 }}>
          {RANGES.map((r) => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={active}
                onClick={() => setRange(r.key)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: active ? CORAL : "transparent",
                  color: active ? "#fff" : TEXT_SECONDARY,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LinkedIn Page card */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Linkedin size={19} style={{ color: CORAL }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>
                {(pageHasStats && (pageResp as { organization_name: string | null }).organization_name)
                  || orgConn?.organization_name
                  || "LinkedIn Page"}
              </span>
              <span style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 1 }}>
                {memberResp?.status === "ok" && memberResp.window_label
                  ? memberResp.window_label.charAt(0).toUpperCase() + memberResp.window_label.slice(1)
                  : rangeLabel}
              </span>
            </div>
          </div>
          {!orgConn && pageResp?.status === "not_connected" ? (
            <Badge tone="pending"><Clock size={12} /> Not connected</Badge>
          ) : pageNeedsReauth ? (
            <button onClick={() => navigate("/app/settings?tab=integrations")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 9px", borderRadius: 999, background: WARN_BG, color: WARN_FG, border: "none", cursor: "pointer" }}>
              <RefreshCw size={12} /> Reconnect LinkedIn
            </button>
          ) : pageIsLive && !pageStale ? (
            <Badge tone="live"><CircleDot size={8} /> Live from LinkedIn</Badge>
          ) : pageStale || pageIsRateLimited ? (
            <Badge tone="pending"><Clock size={12} /> {relativeTime(pageCachedAt) ?? "Refreshing shortly"}</Badge>
          ) : pageIsError ? (
            <Badge tone="pending"><Clock size={12} /> Refreshing shortly</Badge>
          ) : pageLoading ? (
            <Badge tone="pending"><Clock size={12} /> Loading</Badge>
          ) : (
            <Badge tone="pending"><Clock size={12} /> No lifetime activity</Badge>
          )}
        </div>
        {pageNeedsReauth && (
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: "0 0 0.85rem" }}>
            The LinkedIn Page token expired or was revoked. Reconnect to see live Page analytics again.
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="Impressions" value={pageStats.impressions} />
          <Metric label="Unique reach" value={pageStats.reach} />
          <Metric label="Engagement" value={`${pageStats.engagementPct}%`} sub="of impressions" />
          <Metric label="Reactions" value={pageStats.reactions} />
          <Metric label="Comments" value={pageStats.comments} />
          <Metric label="Clicks" value={pageStats.clicks} />
        </div>
      </Card>

      {/* Best posts */}
      {bestPagePostsEnriched.length > 0 && (
        <Card style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <Eyebrow>Your best posts</Eyebrow>
            <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>Top 5 by impressions, {rangeLabel.toLowerCase()}</span>
          </div>
          {bestPagePostsEnriched.map((tp, i) => (
            <div key={tp.urn}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "0.7rem 0", borderBottom: i < bestPagePostsEnriched.length - 1 ? BORDER : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#0A66C2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Linkedin size={17} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  fontSize: 13.5, color: TEXT_PRIMARY, lineHeight: 1.4,
                }}>{tp.text || "Untitled Page post"}</div>
                <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 3, display: "flex", gap: 8, alignItems: "center" }}>
                  <span>LinkedIn Page</span>
                  {tp.pillar && (
                    <span style={{ padding: "1px 7px", borderRadius: 999, background: SURFACE_1, border: BORDER, color: TEXT_SECONDARY }}>
                      {tp.pillar}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: 500 }}>{tp.impressions}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>impressions</div>
                {tp.engagementPct != null && (
                  <div style={{ fontSize: 11, color: SUCCESS_FG, marginTop: 1 }}>{tp.engagementPct}% engaged</div>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Data says + Make next */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: "1rem" }}>
        <Card>
          <div style={{ marginBottom: "0.7rem" }}><Eyebrow>What the data says</Eyebrow></div>
          {insights.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "0.35rem 0" }}>
              {it.kind === "up"
                ? <TrendingUp size={16} style={{ color: SUCCESS_FG, marginTop: 2, flexShrink: 0 }} />
                : <AlertTriangle size={16} style={{ color: WARN_FG, marginTop: 2, flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{it.text}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ marginBottom: "0.7rem" }}><Eyebrow>What to make next</Eyebrow></div>
          {suggestions.map((s, i) => (
            <div key={i}
              style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", padding: "0.35rem 0", borderBottom: i < suggestions.length - 1 ? BORDER : "none" }}>
              <span style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{s.text}</span>
              <button onClick={() => goCreate(s.pillar)}
                style={{ fontSize: 12.5, color: CORAL, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", background: "none", border: "none", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
                Generate <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </Card>
      </div>

      {/* Personal profile */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {memberProfile?.pictureUrl ? (
              <img
                src={memberProfile.pictureUrl}
                alt={memberProfile.name ?? "Profile"}
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: BORDER }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: SURFACE_1, border: BORDER, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} style={{ color: TEXT_MUTED }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>
                {memberProfile?.name
                  ?? (memberResp?.status === "ok" ? memberResp.profile_name : null)
                  ?? "Your personal profile"}
              </span>
              <span style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 1 }}>
                {memberProfile?.headline ? `${memberProfile.headline} · ${rangeLabel}` : rangeLabel}
              </span>
            </div>
          </div>
          {memberResp?.status === "ok" && !memberStale ? (
            <Badge tone="live"><CircleDot size={8} /> Live from LinkedIn</Badge>
          ) : memberResp?.status === "reauth_required" ? (
            <button onClick={() => navigate("/app/settings?tab=integrations")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 9px", borderRadius: 999, background: WARN_BG, color: WARN_FG, border: "none", cursor: "pointer" }}>
              <RefreshCw size={12} /> Reconnect LinkedIn
            </button>
          ) : memberStale || memberIsRateLimited ? (
            <Badge tone="pending"><Clock size={12} /> {relativeTime(memberCachedAt) ?? "Refreshing shortly"}</Badge>
          ) : memberLoading ? (
            <Badge tone="pending"><Clock size={12} /> Loading</Badge>
          ) : (
            <Badge tone="pending"><Clock size={12} /> Refreshing shortly</Badge>
          )}
        </div>
        <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: "0 0 0.85rem" }}>
          Loads from your Build With MOXIEMO® connection,{" "}
          {memberResp?.status === "ok" && memberResp.window_label
            ? memberResp.window_label.toLowerCase()
            : rangeLabel.toLowerCase()}
          .
        </p>
        <div style={{ marginBottom: "0.5rem" }}><Eyebrow color={TEXT_MUTED}>Visibility</Eyebrow></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))", gap: 12, marginBottom: "0.9rem" }}>
          <Metric
            label="Followers gained"
            value={memberFollowersGained != null ? memberFollowersGained.toLocaleString() : memberCalmLabel}
            sub={followersTrend?.text}
            mutedValue={memberResp?.status !== "ok"}
          />
          <Metric
            label="Total followers"
            value={memberTotalFollowers != null ? memberTotalFollowers.toLocaleString() : memberCalmLabel}
            sub="lifetime"
            mutedValue={memberResp?.status !== "ok" || memberTotalFollowers == null}
          />
          <Metric
            label="Reposts"
            value={memberReposts != null ? memberReposts.toLocaleString() : memberCalmLabel}
            sub={memberResp?.status === "ok" ? "of your posts" : undefined}
            mutedValue={memberResp?.status !== "ok" || memberReposts == null}
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}><Eyebrow color={TEXT_MUTED}>Post performance</Eyebrow></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="Impressions" value={memberImpressionsValue} mutedValue={memberResp?.status !== "ok"} />
          <Metric label="Reach" value={memberReachValue} mutedValue={memberResp?.status !== "ok"} />
          <Metric label="Engagement" value={memberEngagementValue} sub={memberResp?.status === "ok" ? "of impressions" : undefined} mutedValue={memberResp?.status !== "ok"} />
          <Metric label="Reactions" value={memberReactionsValue} mutedValue={memberResp?.status !== "ok"} />
          <Metric label="Comments" value={memberCommentsValue} mutedValue={memberResp?.status !== "ok"} />
        </div>
        {memberResp?.status === "reauth_required" && (
          <p style={{ fontSize: 12.5, color: WARN_FG, margin: "0.75rem 0 0" }}>
            Reconnect LinkedIn to read personal profile analytics. LinkedIn tokens expire every 60 days.
          </p>
        )}
      </Card>

      {/* Personal insights + suggestions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: "1rem" }}>
        <Card>
          <div style={{ marginBottom: "0.7rem" }}><Eyebrow>What the data says</Eyebrow></div>
          {personalInsights.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "0.35rem 0" }}>
              {it.kind === "up"
                ? <TrendingUp size={16} style={{ color: SUCCESS_FG, marginTop: 2, flexShrink: 0 }} />
                : <AlertTriangle size={16} style={{ color: WARN_FG, marginTop: 2, flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{it.text}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ marginBottom: "0.7rem" }}><Eyebrow>What to make next</Eyebrow></div>
          {personalSuggestions.map((s, i) => (
            <div key={i}
              style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", padding: "0.35rem 0", borderBottom: i < personalSuggestions.length - 1 ? BORDER : "none" }}>
              <span style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{s.text}</span>
              <button onClick={() => goCreate(s.pillar)}
                style={{ fontSize: 12.5, color: CORAL, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", background: "none", border: "none", padding: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
                Generate <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </Card>
      </div>

      {/* Meta coming-soon (quiet) */}
      <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
        <Eyebrow color={TEXT_MUTED}>Also coming</Eyebrow>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {[
          { name: "Facebook Page", Icon: Facebook, color: "#1877F2" },
          { name: "Instagram", Icon: Instagram, color: "#C13584" },
        ].map(({ name, Icon, color }) => (
          <div key={name} style={{ background: SURFACE_1, border: BORDER, borderRadius: 12, padding: "1rem 1.1rem", opacity: 0.85 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={17} style={{ color }} />
                <span style={{ fontFamily: DISPLAY_FONT, fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY }}>{name}</span>
              </div>
              <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: SURFACE_2, border: BORDER, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Coming soon
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: TEXT_MUTED, margin: 0, lineHeight: 1.5 }}>
              Analytics arrive when Meta publishing lands in Beta 1.0.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}