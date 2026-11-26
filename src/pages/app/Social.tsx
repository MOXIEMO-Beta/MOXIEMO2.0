import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check } from "lucide-react";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  warmPaper: "#F4F2ED", white: "#FFFFFF", ink: "#15171C",
  muted: "#6B6B6B", sage: "#B8C5A6", taupe: "#D8CEBD", border: "#E8E4DD",
};
const btnPrimary: React.CSSProperties = { background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnSm: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 };

type Post = {
  id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  status: string;
  scheduled_at: string | null;
  moxie_note?: string | null;
  topic?: string | null;
};

type Connection = {
  id: string;
  platform: string;
  profile_name: string | null;
  connection_type: string | null;
  expires_at: string | null;
};

function platformEmoji(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("linkedin")) return "💼";
  if (p.includes("instagram")) return "📸";
  if (p.includes("facebook")) return "📘";
  return "📄";
}

function statusColor(status: string): string {
  if (status === "pending_approval") return C.coral;
  if (status === "scheduled") return C.navy;
  if (status === "draft") return C.muted;
  if (status === "published") return C.sage;
  return C.muted;
}

function StatusPill({ status }: { status: string }) {
  const bg = statusColor(status);
  const label = status === "pending_approval" ? "Needs approval" : status.replace(/_/g, " ");
  return (
    <span style={{
      background: bg,
      color: "#fff",
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'DM Sans Variable',sans-serif",
      textTransform: "capitalize" as const,
      letterSpacing: "0.04em",
    }}>
      {label}
    </span>
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Social() {
  const { user } = useAuth();
  const { brandId } = useBrand();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [panelTab, setPanelTab] = useState<"queue" | "calendar">("queue");
  const [approving, setApproving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const postsQ = supabase.from("social_posts").select("*");
    const connsQ = supabase.from("social_connections").select("id,platform,profile_name,connection_type,expires_at");
    const [postsRes, connsRes] = await Promise.all([
      (brandId ? postsQ.eq("brand_id", brandId) : postsQ.eq("user_id", user.id)).order("scheduled_at", { ascending: true, nullsFirst: false }),
      (brandId ? connsQ.eq("brand_id", brandId) : connsQ.eq("user_id", user.id)),
    ]);
    setPosts((postsRes.data ?? []) as Post[]);
    setConnections((connsRes.data ?? []) as Connection[]);
  }, [user, brandId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [user, loadData]);

  const handleApprove = async () => {
    if (!selectedPost) return;
    setApproving(true);
    const { data, error } = await supabase.functions.invoke("publish-social-post", {
      body: { post_id: selectedPost.id },
    });
    setApproving(false);
    if (error || data?.error) {
      const msg = data?.error ?? error?.message ?? "Publish failed";
      toast.error(msg);
      return;
    }
    toast.success("Post published.");
    await loadData();
    setSelectedPost((p) => p ? { ...p, status: "published" } : p);
  };

  const hasLinkedIn = connections.some((c) => c.platform === "linkedin");

  // Calendar data
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  const postsByDay = new Map<number, Post[]>();
  for (const post of posts) {
    if (!post.scheduled_at) continue;
    const d = new Date(post.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const arr = postsByDay.get(day) ?? [];
      arr.push(post);
      postsByDay.set(day, arr);
    }
  }

  // Build grid cells: leading empty + days
  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) gridCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) gridCells.push(d);

  const postText = (post: Post) => {
    if (!post.content_by_platform) return "";
    const platforms = post.platforms ?? [];
    for (const p of platforms) {
      const text = post.content_by_platform[p];
      if (text) return text;
    }
    const vals = Object.values(post.content_by_platform);
    return vals[0] ?? "";
  };

  const primaryPlatform = (post: Post) => {
    return (post.platforms ?? [])[0] ?? "linkedin";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden", background: C.paper }}>
        <div style={{ width: 300, background: C.white, borderRight: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", color: C.muted, fontSize: 14 }}>Loading…</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      {/* Left panel */}
      <div style={{ width: 300, background: C.white, borderRight: `1.5px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "24px 20px 0" }}>
          <h1 style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
            Create
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, marginBottom: 16 }}>
            Plan it. Write it. Schedule it.
          </p>
          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 0, borderBottom: `1.5px solid ${C.border}`, marginBottom: 0 }}>
            {(["queue", "calendar"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: "none",
                  background: "transparent",
                  fontFamily: "'DM Sans Variable',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: panelTab === tab ? C.navy : C.muted,
                  borderBottom: panelTab === tab ? `2px solid ${C.coral}` : "2px solid transparent",
                  marginBottom: -1.5,
                }}
              >
                {tab === "queue" ? "Queue" : "Calendar"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {panelTab === "queue" && (
            <div style={{ padding: "12px 0" }}>
              {posts.length === 0 ? (
                <div style={{ padding: "24px 20px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                  No posts yet.
                </div>
              ) : posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    borderBottom: `1px solid ${C.border}`,
                    background: selectedPost?.id === post.id ? C.paper : C.white,
                    borderLeft: selectedPost?.id === post.id ? `3px solid ${C.coral}` : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{platformEmoji(primaryPlatform(post))}</span>
                    <StatusPill status={post.status} />
                    {post.scheduled_at && (
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, marginLeft: "auto" }}>
                        {new Date(post.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {postText(post).slice(0, 80) || "Untitled post"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {panelTab === "calendar" && (
            <div style={{ padding: "16px 12px" }}>
              <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 12, textAlign: "center" as const }}>
                {monthLabel}
              </div>
              {/* Day labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                  <div key={d} style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "center" as const }}>
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {gridCells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const dayPosts = postsByDay.get(day) ?? [];
                  const isToday = day === now.getDate();
                  return (
                    <div
                      key={day}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        padding: "4px 2px",
                        borderRadius: 6,
                        background: isToday ? C.navy : "transparent",
                        cursor: dayPosts.length > 0 ? "pointer" : "default",
                      }}
                      onClick={() => dayPosts.length > 0 && setSelectedPost(dayPosts[0])}
                    >
                      <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 600, color: isToday ? "#fff" : C.ink }}>
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "#fff" : C.coral, marginTop: 2 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: C.paper, padding: 40, overflowY: "auto" }}>
        {/* No connection banner */}
        {!hasLinkedIn && (
          <div style={{ background: C.navy, borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#fff" }}>
              Connect LinkedIn in Settings to publish posts.
            </span>
            <button onClick={() => navigate("/app/settings")} style={{ ...btnSm, background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff" }}>
              Go to Settings
            </button>
          </div>
        )}

        {!selectedPost ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%" }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: C.muted }}>
              Select a post to review
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: 600 }}>
            {/* LinkedIn card mockup */}
            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>M</span>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 14, fontWeight: 700, color: C.ink }}>MOXIEMO</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
                    {primaryPlatform(selectedPost) === "linkedin" ? "LinkedIn" : platformEmoji(primaryPlatform(selectedPost))}
                    {selectedPost.scheduled_at && ` · ${new Date(selectedPost.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <StatusPill status={selectedPost.status} />
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                {postText(selectedPost) || "No content yet."}
              </p>
            </div>

            {/* MOXIE note */}
            {(selectedPost as any).moxie_note && (
              <div style={{ background: C.warmPaper, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>
                  MOXIE note
                </div>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                  {(selectedPost as any).moxie_note}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              {selectedPost.status === "pending_approval" && (
                <button onClick={handleApprove} disabled={approving} style={btnPrimary}>
                  <Check size={14} style={{ display: "inline", marginRight: 6 }} />
                  {approving ? "Publishing…" : "Publish Now"}
                </button>
              )}
              <button
                onClick={() => toast.info("Rewrite requested — regenerating post.")}
                style={{ background: "transparent", color: C.navy, border: `1.5px solid ${C.taupe}`, borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Request rewrite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
