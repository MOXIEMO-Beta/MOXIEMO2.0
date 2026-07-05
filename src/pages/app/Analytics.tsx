import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Linkedin, User, Clock, TrendingUp, AlertTriangle, ArrowRight, Zap, CircleDot, RefreshCw } from "lucide-react";
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
  | { status: "ok"; organization_name: string | null; stats: PageStats; topPosts: PageTopPost[] }
  | { status: "empty"; organization_name: string | null; stats: PageStats; topPosts: PageTopPost[] }
  | { status: "not_connected" }
  | { status: "reauth_required"; organization_name?: string | null }
  | { status: "error"; http_status?: number; body?: string; error?: string };

function pillarsOf(s: Strategy | null): string[] {
  const v = s?.content_pillars;
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : (x as { name?: string })?.name ?? "")).filter(Boolean);
}

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

function postPreview(p: SocialPost): string {
  const cmap = p.content_by_platform || {};
  const text = Object.values(cmap).join(" ").trim();
  return text || p.topic || "Untitled post";
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
  const [pageRetryCount, setPageRetryCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        supabase.from("strategies").select("content_pillars, strength_score").eq("user_id", user.id).maybeSingle(),
        supabase.from("social_posts").select("id, user_id, platforms, content_by_platform, pillar, status, published_at, created_at, topic").eq("user_id", user.id).order("created_at", { ascending: false }),
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
    try {
      const { data, error } = await supabase.functions.invoke("linkedin-page-analytics", { method: "POST" });
      if (error) throw error;
      setPageResp(data as PageResp);
    } catch {
      setPageResp({ status: "error", error: "network" });
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchPage();
  }, [user, fetchPage]);

  // Quiet retry for transient errors (max 2 retries).
  useEffect(() => {
    if (pageResp?.status !== "error" || pageRetryCount >= 2) return;
    const t = setTimeout(() => {
      setPageRetryCount((c) => c + 1);
      void fetchPage();
    }, 4000 * (pageRetryCount + 1));
    return () => clearTimeout(t);
  }, [pageResp, pageRetryCount, fetchPage]);

  const orgConn = useMemo(() => connections.find((c) => c.connection_type === "company") ?? null, [connections]);
  const personalConn = useMemo(() => connections.find((c) => (c.connection_type ?? "personal") === "personal") ?? null, [connections]);

  // Latest analytics per post
  const analyticsByPost = useMemo(() => {
    const m = new Map<string, SocialAnalytic>();
    for (const a of analytics) {
      if (!a.post_id) continue;
      const cur = m.get(a.post_id);
      if (!cur || new Date(a.fetched_at) > new Date(cur.fetched_at)) m.set(a.post_id, a);
    }
    return m;
  }, [analytics]);

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
  const pageIsError = pageResp?.status === "error";

  // What the data says — grounded in live Page stats.
  const insights = useMemo(() => {
    const out: { kind: "up" | "warn"; text: string }[] = [];
    if (pageIsLive) {
      if (pageStats.engagementPct >= 5) {
        out.push({ kind: "up", text: `Page engagement is ${pageStats.engagementPct}% against impressions, above the LinkedIn norm.` });
      } else if (pageStats.engagementPct > 0) {
        out.push({ kind: "warn", text: `Page engagement is ${pageStats.engagementPct}% against impressions. Tighter hooks on the first two lines will lift this.` });
      }
      if (bestPagePosts[0]) {
        out.push({ kind: "up", text: `Your top post is pulling ${bestPagePosts[0].impressions} impressions. Rework that angle.` });
      }
    } else if (pageIsEmpty) {
      out.push({ kind: "warn", text: "Your Page has no lifetime activity to score yet. Publish two posts this week to unlock real signal." });
    } else {
      out.push({ kind: "warn", text: "Waiting on live LinkedIn Page numbers to score the pattern." });
    }
    const empty = pillars.filter((p) => !posts.some((post) => post.pillar === p));
    if (empty.length > 0) {
      out.push({ kind: "warn", text: `${empty[0]} has no posts yet. That pillar is going untested.` });
    }
    return out.slice(0, 3);
  }, [pageIsLive, pageIsEmpty, pageStats, bestPagePosts, pillars, posts]);

  // What to make next — leans on empty pillars since Page-side pillar tagging lives in MOXIEMO records only.
  const suggestions = useMemo(() => {
    const out: { text: string; pillar?: string }[] = [];
    // top-performing pillar from MOXIEMO-tagged posts (if we happen to have analytics)
    const byPillar = new Map<string, number>();
    for (const p of posts) {
      const a = analyticsByPost.get(p.id);
      if (!a || !p.pillar) continue;
      byPillar.set(p.pillar, (byPillar.get(p.pillar) || 0) + (a.impressions || 0));
    }
    const topPillar = [...byPillar.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topPillar) out.push({ text: `Another ${topPillar} post, your best-performing angle.`, pillar: topPillar });
    // empty pillars
    const empty = pillars.filter((p) => !posts.some((post) => post.pillar === p));
    for (const p of empty.slice(0, 2)) out.push({ text: `A ${p} post to balance your pillars.`, pillar: p });
    // fallback
    if (out.length === 0 && pillars.length > 0) {
      out.push({ text: `Start with a ${pillars[0]} post to seed the engine.`, pillar: pillars[0] });
    }
    if (out.length === 0) out.push({ text: "Set your content pillars in Strategy, then generate your first post." });
    return out.slice(0, 3);
  }, [posts, analyticsByPost, pillars]);

  const personalPublished = useMemo(
    () => posts.filter((p) => p.status === "published" && (p.platforms || []).includes("linkedin")).length,
    [posts]
  );

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

      <div style={{ marginBottom: "0.6rem" }}>
        <Eyebrow color={TEXT_MUTED}>Distribution</Eyebrow>
      </div>

      {/* LinkedIn Page card */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Linkedin size={19} style={{ color: CORAL }} />
            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>
              {(pageHasStats && (pageResp as { organization_name: string | null }).organization_name)
                || orgConn?.organization_name
                || "LinkedIn Page"}
            </span>
          </div>
          {!orgConn && pageResp?.status === "not_connected" ? (
            <Badge tone="pending"><Clock size={12} /> Not connected</Badge>
          ) : pageNeedsReauth ? (
            <button onClick={() => navigate("/app/settings?tab=integrations")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "3px 9px", borderRadius: 999, background: WARN_BG, color: WARN_FG, border: "none", cursor: "pointer" }}>
              <RefreshCw size={12} /> Reconnect LinkedIn
            </button>
          ) : pageIsLive ? (
            <Badge tone="live"><CircleDot size={8} /> Live from LinkedIn</Badge>
          ) : pageIsError ? (
            <Badge tone="pending"><RefreshCw size={12} /> Retrying</Badge>
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
      {bestPagePosts.length > 0 && (
        <Card style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <Eyebrow>Your best posts</Eyebrow>
            <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>Ranked by impressions</span>
          </div>
          {bestPagePosts.map((tp, i) => (
            <div key={tp.urn}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "0.7rem 0", borderBottom: i < bestPagePosts.length - 1 ? BORDER : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#0A66C2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Linkedin size={17} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  fontSize: 13.5, color: TEXT_PRIMARY, lineHeight: 1.4,
                }}>{tp.text || "Untitled Page post"}</div>
                <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 3 }}>LinkedIn Page</div>
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

      {/* Personal profile pending */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} style={{ color: TEXT_MUTED }} />
            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>
              {personalConn?.profile_name ? `${personalConn.profile_name}, personal profile` : "Your personal profile"}
            </span>
          </div>
          <Badge tone="pending"><Clock size={12} /> Pending LinkedIn approval</Badge>
        </div>
        <p style={{ fontSize: 13, color: TEXT_SECONDARY, margin: "0 0 0.85rem" }}>
          Personal post analytics and best-post ranking need LinkedIn partner approval. The request is in review. Until it clears, MOXIEMO shows what it published for you.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))", gap: 12 }}>
          <Metric label="Posts published" value={personalPublished} />
          <Metric label="Impressions" value="Locked" mutedValue />
          <Metric label="Best post" value="Locked" mutedValue />
        </div>
      </Card>
    </div>
  );
}