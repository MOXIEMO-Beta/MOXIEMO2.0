import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { supabase } from "@/integrations/supabase/client";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  warmPaper: "#F4F2ED", white: "#FFFFFF", ink: "#15171C",
  muted: "#6B6B6B", sage: "#B8C5A6", taupe: "#D8CEBD", border: "#E8E4DD",
};
const card: React.CSSProperties = { background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 };
const sectionLabel: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 14 };
const h1Style: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 4 };

type Post = {
  id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  pillar: string | null;
  status: string;
  published_at: string | null;
  topic: string | null;
  platform_post_ids: unknown;
};

type Analytic = {
  post_id: string | null;
  platform: string | null;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagement_rate: number | null;
  fetched_at: string;
};

type Strategy = {
  content_pillars?: unknown;
  strength_score?: number | null;
};

function platformEmoji(platform: string | null) {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("linkedin")) return "💼";
  if (p.includes("instagram")) return "📸";
  if (p.includes("facebook")) return "📘";
  return "📄";
}

function postHook(post: Post, maxLen = 60): string {
  if (!post.content_by_platform) return "Untitled post";
  const vals = Object.values(post.content_by_platform);
  const text = vals[0] ?? "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function MetricBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: C.warmPaper, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 20, fontWeight: 700, color: highlight ? C.coral : C.ink }}>
        {value}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div style={{ ...card, height: 80, background: C.border, opacity: 0.4 }} />;
}

export default function Analytics() {
  const { user } = useAuth();
  const { brandId } = useBrand();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const stratQ = supabase.from("strategies").select("content_pillars,strength_score");
    const [postsRes, analyticsRes, strategyRes] = await Promise.all([
      supabase.from("social_posts").select("id,platforms,content_by_platform,pillar,status,published_at,topic,platform_post_ids").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("social_analytics").select("post_id,platform,impressions,reach,likes,comments,shares,engagement_rate,fetched_at").eq("user_id", user.id).order("fetched_at", { ascending: false }),
      (brandId ? stratQ.eq("brand_id", brandId) : stratQ.eq("user_id", user.id)).maybeSingle(),
    ]);
    setPosts((postsRes.data ?? []) as Post[]);
    setAnalytics((analyticsRes.data ?? []) as Analytic[]);
    setStrategy(strategyRes.data as Strategy | null);
  }, [user, brandId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [user, loadData]);

  if (loading) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const publishedPosts = posts.filter((p) => p.status === "published");
  const pendingApproval = posts.filter((p) => p.status === "pending_approval");
  const totalImpressions = analytics.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const engValues = analytics.map((a) => a.engagement_rate).filter((v): v is number => v != null);
  const avgEngagement = engValues.length ? engValues.reduce((a, b) => a + b, 0) / engValues.length : 0;

  const analyticsMap = new Map<string, Analytic>();
  for (const a of analytics) { if (a.post_id) analyticsMap.set(a.post_id, a); }

  const abPosts = publishedPosts.slice(0, 2);

  const topPost = publishedPosts.reduce<Post | null>((best, p) => {
    const a = analyticsMap.get(p.id);
    const bestA = best ? analyticsMap.get(best.id) : null;
    if (!a) return best;
    if (!bestA) return p;
    return (a.impressions ?? 0) > (bestA.impressions ?? 0) ? p : best;
  }, null);
  const topPostAnalytics = topPost ? (analyticsMap.get(topPost.id) ?? null) : null;

  const abWinner = (() => {
    if (abPosts.length < 2) return null;
    const a0 = analyticsMap.get(abPosts[0].id);
    const a1 = analyticsMap.get(abPosts[1].id);
    const e0 = a0?.engagement_rate ?? 0;
    const e1 = a1?.engagement_rate ?? 0;
    if (e0 === 0 && e1 === 0) return null;
    return e0 >= e1 ? 0 : 1;
  })();

  return (
    <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={h1Style}>Growth</h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, marginBottom: 32 }}>
          Results from your content. I read the data so you do not have to.
        </p>

        {/* Next move banner */}
        {pendingApproval.length > 0 ? (
          <div style={{ background: C.coral, borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#fff" }}>
              {pendingApproval.length} post{pendingApproval.length !== 1 ? "s" : ""} need your approval.
            </span>
            <button
              onClick={() => navigate("/app/social")}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Review posts
            </button>
          </div>
        ) : publishedPosts.length === 0 ? (
          <div style={{ background: C.navy, borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
              Your first content goes live soon. Results appear here after posts publish.
            </span>
          </div>
        ) : null}

        {/* 4-stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <MetricBox label="Published" value={String(publishedPosts.length)} />
          <MetricBox label="Impressions" value={totalImpressions.toLocaleString()} />
          <MetricBox label="Engagement" value={avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : "—"} highlight={avgEngagement > 2} />
          <MetricBox label="Goal" value="0 of 100" />
        </div>

        {/* A/B test card */}
        <div style={card}>
          <div style={sectionLabel}>A/B test</div>
          {abPosts.length < 2 ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[0, 1].map((i) => {
                  const post = abPosts[i];
                  return (
                    <div key={i} style={{ background: C.paper, borderRadius: 12, padding: 20, border: `1.5px solid ${C.border}` }}>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, margin: "0 0 12px", fontStyle: "italic" }}>
                        {post ? postHook(post) : "Waiting for data"}
                      </p>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, color: C.muted }}>
                          Impressions: {post ? (analyticsMap.get(post.id)?.impressions?.toLocaleString() ?? "—") : "—"}
                        </span>
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, color: C.muted }}>
                          Engagement: {post ? (analyticsMap.get(post.id)?.engagement_rate != null ? `${analyticsMap.get(post.id)!.engagement_rate!.toFixed(1)}%` : "—") : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, marginTop: 14 }}>
                Waiting for data — publish 2 posts to unlock A/B comparison.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                {abPosts.map((post, i) => {
                  const a = analyticsMap.get(post.id);
                  const isLeading = abWinner === i;
                  return (
                    <div
                      key={post.id}
                      style={{
                        background: C.paper,
                        borderRadius: 12,
                        padding: 20,
                        border: isLeading ? `1.5px solid ${C.navy}` : `1.5px solid ${C.border}`,
                      }}
                    >
                      {isLeading && (
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, background: C.navy, color: "#fff", borderRadius: 20, padding: "2px 10px", display: "inline-block", marginBottom: 8 }}>
                          Leading
                        </span>
                      )}
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, margin: "0 0 12px", lineHeight: 1.5 }}>
                        {postHook(post)}
                      </p>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, color: C.muted }}>
                          {a?.impressions?.toLocaleString() ?? "—"} impressions
                        </span>
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, color: C.muted }}>
                          {a?.engagement_rate != null ? `${a.engagement_rate.toFixed(1)}%` : "—"} eng
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
                MOXIE is tracking your post performance. The leading post shows the angle resonating most.
              </p>
            </div>
          )}
        </div>

        {/* Top post */}
        {publishedPosts.length === 0 ? (
          <div style={{ ...card, textAlign: "center" as const, padding: 48 }}>
            <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 18, color: C.ink, marginBottom: 12 }}>
              No published posts yet.
            </p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, marginBottom: 24 }}>
              Once your first post goes live, analytics will appear here.
            </p>
            <button
              onClick={() => navigate("/app/social")}
              style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Review posts
            </button>
          </div>
        ) : topPost ? (
          <div style={card}>
            <div style={sectionLabel}>Top post</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>{platformEmoji((topPost.platforms ?? [])[0])}</span>
              <div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: "0 0 6px" }}>
                  {postHook(topPost, 120)}
                </p>
                {topPost.published_at && (
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
                    Published {new Date(topPost.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <MetricBox label="Impressions" value={topPostAnalytics?.impressions?.toLocaleString() ?? "—"} />
              <MetricBox label="Engagement" value={topPostAnalytics?.engagement_rate != null ? `${topPostAnalytics.engagement_rate.toFixed(1)}%` : "—"} highlight={(topPostAnalytics?.engagement_rate ?? 0) > 2} />
              <MetricBox label="Likes" value={topPostAnalytics?.likes?.toLocaleString() ?? "—"} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
