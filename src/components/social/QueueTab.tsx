import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  GripVertical, Linkedin, Instagram, Facebook, Twitter, Pencil, Image as ImageIcon,
  Trash2, CloudUpload, Check, Video, Sparkles, CalendarPlus, Lightbulb, CalendarDays, RefreshCw,
  RotateCcw, X, Loader2, ImagePlus, Search, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

async function invokeWithAuth<T = any>(name: string, body: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not signed in");
  }
  return supabase.functions.invoke<T>(name, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body,
  });
}

type Platform = "linkedin" | "instagram" | "facebook" | "x";

type SocialPost = {
  id: string;
  user_id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  pillar: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  media_urls: any;
  sort_order: number | null;
  created_at: string;
};

type LinkedInConnection = {
  id: string;
  connection_type: string;
  organization_name: string | null;
  profile_name: string | null;
};

type Asset = {
  id: string;
  url: string;
  filename: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
};

// Resolve a signed URL for a stored asset. We persist the storage path in
// `filename`; fall back to parsing the path out of legacy `url` values.
function storagePathOf(a: Pick<Asset, "url" | "filename">): string | null {
  if (a.filename && a.filename.includes("/")) return a.filename;
  const m = a.url?.match(/social-assets\/(.+)$/);
  if (m) return m[1];
  return a.filename ?? null;
}
async function signAssetUrl(a: Pick<Asset, "url" | "filename">): Promise<string> {
  const path = storagePathOf(a);
  if (!path) return a.url ?? "";
  const { data } = await supabase.storage.from("social-assets").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? a.url ?? "";
}

const PLATFORM_META: Record<Platform, { bg: string; color: string; Icon: any; label: string }> = {
  linkedin:  { bg: "#E8F1FB", color: "#0A66C2", Icon: Linkedin,  label: "LinkedIn" },
  instagram: { bg: "#FCE8F5", color: "#C13584", Icon: Instagram, label: "Instagram" },
  facebook:  { bg: "#E8F0FD", color: "#1877F2", Icon: Facebook,  label: "Facebook" },
  x:         { bg: "#F0EFEC", color: "#0E0F10", Icon: Twitter,   label: "X" },
};

function primaryPlatform(p: SocialPost): Platform {
  const arr = p.platforms ?? [];
  const first = (arr[0] ?? "linkedin").toLowerCase();
  if (first === "twitter") return "x";
  if (["linkedin","instagram","facebook","x"].includes(first)) return first as Platform;
  return "linkedin";
}
function previewText(p: SocialPost): string {
  const plat = primaryPlatform(p);
  const cbp = p.content_by_platform ?? {};
  const txt = cbp[plat] || Object.values(cbp)[0] || "";
  return String(txt);
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function toLocalInputValue(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function QueueTab({ userId, onChangeTab }: { userId: string | null; onChangeTab?: (t: string) => void }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filter, setFilter] = useState<"all" | Platform>("all");
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [platformConnections, setPlatformConnections] = useState<Record<string, LinkedInConnection[]>>({});
  const [pickerFor, setPickerFor] = useState<{ post: SocialPost; options: LinkedInConnection[] } | null>(null);
  const [openMediaFor, setOpenMediaFor] = useState<string | null>(null);
  const [showPublishBanner, setShowPublishBanner] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  type GuidedQuestion = { label: string; hint?: string };
  type Suggestion = {
    pillar: string;
    angle: string;
    platform?: string;
    anecdoteRequired?: boolean;
    guidedQuestions?: GuidedQuestion[];
  };
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guidedResult, setGuidedResult] = useState<{ post: string; answers: Record<string, string> } | null>(null);
  const [guidedLoading, setGuidedLoading] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = sessionStorage.getItem("moxiemo_queue_suggest_dismiss");
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      const [{ data: rows }, { data: conns }] = await Promise.all([
        supabase
          .from("social_posts")
          .select("id, user_id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, media_urls, sort_order, created_at")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true })
          .order("scheduled_for", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase.from("social_connections").select("id, platform, connection_type, organization_name, profile_name").eq("user_id", userId),
      ]);
      setPosts((rows ?? []) as any);
      const list = (conns ?? []) as any[];
      setConnections(new Set(list.map((c) => c.platform)));
      const grouped: Record<string, LinkedInConnection[]> = {};
      for (const c of list) {
        (grouped[c.platform] ??= []).push({
          id: c.id,
          connection_type: c.connection_type,
          organization_name: c.organization_name,
          profile_name: c.profile_name,
        });
      }
      setPlatformConnections(grouped);
      setLoading(false);
    })();
  }, [userId]);

  // Pick one auto-suggestion from pillar_feed_cache (most underrepresented pillar in queue)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("pillar_feed_cache").select("angles_json").eq("user_id", userId).maybeSingle();
      const list = ((data as any)?.angles_json?.angles ?? []) as Array<{ pillar: string; angle: string; platform?: string }>;
      if (!Array.isArray(list) || list.length === 0) { setSuggestion(null); return; }
      const counts: Record<string, number> = {};
      posts.forEach((p) => { if (p.pillar) counts[p.pillar] = (counts[p.pillar] ?? 0) + 1; });
      const sorted = [...list].sort((a, b) => (counts[a.pillar] ?? 0) - (counts[b.pillar] ?? 0));
      const pick = sorted.find((s) => s.angle && !suggestionDismissed.has(s.angle)) ?? null;
      setSuggestion(pick);
    })();
  }, [userId, posts, suggestionDismissed]);

  function dismissSuggestion(angle: string) {
    setSuggestionDismissed((prev) => {
      const next = new Set(prev); next.add(angle);
      try { sessionStorage.setItem("moxiemo_queue_suggest_dismiss", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  async function saveSuggestionAsDraft(open: boolean) {
    if (!suggestion || !userId) return;
    const platform: Platform = (["linkedin","instagram","facebook","x"].includes((suggestion.platform ?? "").toLowerCase())
      ? (suggestion.platform!.toLowerCase() as Platform)
      : "linkedin");
    const { data, error } = await supabase.from("social_posts").insert({
      user_id: userId,
      platforms: [platform],
      content_by_platform: { [platform]: suggestion.angle } as any,
      status: "draft",
      pillar: suggestion.pillar,
      sort_order: 0,
    }).select("id, user_id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, media_urls, sort_order, created_at").single();
    if (error) { toast.error(error.message); return; }
    setPosts((arr) => [data as any, ...arr]);
    dismissSuggestion(suggestion.angle);
    if (open) setEditingId((data as any).id);
    toast.success(open ? "Draft ready — edit and save" : "Saved to queue");
  }

  // Resolve signed URLs for post thumbnails (private bucket)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries: Array<[string, string]> = [];
      for (const p of posts) {
        const arr = Array.isArray(p.media_urls) ? (p.media_urls as any[]) : [];
        const first = arr[0];
        if (!first || typeof first !== "string") continue;
        if (thumbUrls[p.id]) continue;
        // `first` is a storage path (e.g. "userId/1234-pexels.jpg"). Pass it as
        // `filename` so storagePathOf() recognizes it and we produce a signed URL
        // instead of returning the raw path (which renders as a broken image).
        const url = await signAssetUrl({ url: first, filename: first });
        if (url) entries.push([p.id, url]);
      }
      if (!cancelled && entries.length) {
        setThumbUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
  }, [posts]);

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => primaryPlatform(p) === filter);
  }, [posts, filter]);

  async function handleDateChange(post: SocialPost, value: string) {
    if (!value) return;
    const iso = new Date(value).toISOString();
    const nextStatus = post.status === "draft" ? "scheduled" : post.status;
    setPosts((arr) => arr.map((p) => (p.id === post.id ? { ...p, scheduled_for: iso, status: nextStatus } : p)));
    const { error } = await supabase
      .from("social_posts")
      .update({ scheduled_for: iso, status: nextStatus })
      .eq("id", post.id);
    if (error) toast.error(error.message);
    else toast.success("Schedule updated");
  }

  async function handleDelete(post: SocialPost) {
    if (!confirm("Delete this post?")) return;
    const prev = posts;
    setPosts((arr) => arr.filter((p) => p.id !== post.id));
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    if (error) { setPosts(prev); toast.error(error.message); }
    else toast.success("Post deleted");
  }

  async function publishToConnection(post: SocialPost, connectionId?: string) {
    try {
      const { data, error } = await invokeWithAuth<any>("publish-social-post", {
        postId: post.id,
        ...(connectionId ? { connectionId } : {}),
      });
      if (error) {
        // supabase.functions.invoke surfaces non-2xx as FunctionsHttpError;
        // try to read the response body for structured errors.
        const ctx: any = (error as any).context;
        let payload: any = null;
        try { payload = await ctx?.json?.(); } catch {}
        if (payload?.error === "multiple_destinations_available" && payload.connections?.length) {
          setPickerFor({ post, options: payload.connections });
          return { ok: false, skipped: true };
        }
        throw new Error(payload?.error ?? error.message ?? "Publish failed");
      }
      if (data?.error === "multiple_destinations_available" && data.connections?.length) {
        setPickerFor({ post, options: data.connections });
        return { ok: false, skipped: true };
      }
      if (data?.error) throw new Error(data.error);
      return { ok: true, destination: data?.destination as string | undefined };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Publish failed" };
    }
  }

  async function handlePublish(post: SocialPost) {
    const plat = primaryPlatform(post);
    if (!connections.has(plat)) {
      setShowPublishBanner(true);
      return;
    }
    const options = platformConnections[plat] ?? [];
    if (options.length > 1) {
      setPickerFor({ post, options });
      return;
    }
    const result = await publishToConnection(post);
    if (result.ok) {
      toast.success(result.destination ? `Published to ${result.destination}` : "Published!");
      setPosts((arr) => arr.map((p) => (p.id === post.id ? { ...p, status: "published", published_at: new Date().toISOString() } : p)));
    } else if (!result.skipped) {
      toast.error(result.error ?? "Publish failed");
    }
  }

  async function handlePickerPublish(selectedIds: string[]) {
    if (!pickerFor || selectedIds.length === 0) return;
    const post = pickerFor.post;
    setPickerFor(null);
    const results = await Promise.all(
      selectedIds.map(async (id) => {
        const opt = (platformConnections[primaryPlatform(post)] ?? []).find((c) => c.id === id);
        const label = opt?.connection_type === "company"
          ? (opt.organization_name ?? "Company page")
          : (opt?.profile_name ?? "Personal");
        const r = await publishToConnection(post, id);
        return { id, label, ...r };
      }),
    );
    const wins = results.filter((r) => r.ok);
    const fails = results.filter((r) => !r.ok && !r.skipped);
    if (wins.length) {
      toast.success(`Published to ${wins.map((w) => w.label).join(", ")}`);
      setPosts((arr) => arr.map((p) => (p.id === post.id ? { ...p, status: "published", published_at: new Date().toISOString() } : p)));
    }
    for (const f of fails) {
      toast.error(`Failed to publish to ${f.label}`, { description: (f as any).error });
    }
  }

  function onDragStart(id: string) { setDragId(id); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function onDropOn(target: SocialPost) {
    if (!dragId || dragId === target.id) return;
    const src = posts.find((p) => p.id === dragId);
    if (!src) return;
    const without = posts.filter((p) => p.id !== dragId);
    const idx = without.findIndex((p) => p.id === target.id);
    const next = [...without.slice(0, idx), src, ...without.slice(idx)];
    setPosts(next);
    setDragId(null);
    // persist sort_order
    const updates = next.map((p, i) => supabase.from("social_posts").update({ sort_order: i }).eq("id", p.id));
    await Promise.all(updates);
  }

  return (
    <div className="space-y-4">
      {showPublishBanner && (
        <div className="rounded-lg px-3.5 py-2.5 text-[12px] flex items-center justify-between"
          style={{ background: "#FEF3C7", border: "0.5px solid #FBBF24", color: "#854F0B" }}>
          <span>Connect a platform in Settings to publish posts directly from MOXIEMO.</span>
          <button className="text-[12px] font-medium" style={{ color: "#E85A46" }}
            onClick={() => navigate("/app/settings#integrations-section")}>Go to Settings →</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "linkedin", "instagram", "facebook", "x"] as const).map((p) => {
            const active = filter === p;
            const label = p === "all" ? "All platforms" : PLATFORM_META[p as Platform].label;
            return (
              <button key={p} onClick={() => setFilter(p)}
                className="text-[12px] font-medium transition"
                style={{
                  borderRadius: 20, padding: "5px 14px",
                  border: active ? "1px solid #E85A46" : "0.5px solid #ECEAE5",
                  color: active ? "#E85A46" : "#6B6860",
                  background: "transparent",
                }}>{label}</button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: "#9A9896" }}>{filtered.length} posts in queue</span>
          {posts.length > 0 && (
            <button onClick={() => setComposeOpen((v) => !v)}
              className="text-[12px] font-medium"
              style={{
                border: composeOpen ? "1px solid #E85A46" : "0.5px solid #ECEAE5",
                borderRadius: 8, height: 32, padding: "0 14px",
                color: composeOpen ? "#E85A46" : "#0E0F10",
                background: "transparent",
              }}>
              Add post
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-[12px]" style={{ color: "#9A9896" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <ComposeBlock
          userId={userId!}
          variant="empty"
          onSaved={(p) => setPosts((arr) => [p, ...arr])}
          onChangeTab={onChangeTab}
        />
      ) : (
        <div>
          {suggestion && !suggestionDismissed.has(suggestion.angle) && (
            <div style={{
              background: "#FEF1EE", border: "1px dashed #F5C4B3", borderRadius: 12,
              padding: "14px 16px", marginBottom: 18,
            }}>
              <div className="flex items-center gap-1.5" style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "#E85A46", marginBottom: 8,
              }}>
                <Sparkles size={12} /> MOXIEMO started this for you
              </div>
              <div style={{ fontSize: 13, color: "#0E0F10", lineHeight: 1.55, marginBottom: 6 }}>
                {suggestion.angle}
              </div>
              <div style={{ fontSize: 11, color: "#9A9896", marginBottom: 12 }}>
                {suggestion.pillar}{suggestion.platform ? ` · ${suggestion.platform}` : ""}
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveSuggestionAsDraft(false)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20,
                    background: "#E85A46", color: "#fff", border: "1px solid #E85A46", cursor: "pointer" }}>
                  Use this
                </button>
                <button onClick={() => saveSuggestionAsDraft(true)}
                  style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20,
                    background: "#fff", color: "#6B6860", border: "0.5px solid #ECEAE5", cursor: "pointer" }}>
                  Edit first
                </button>
                <button onClick={() => dismissSuggestion(suggestion.angle)}
                  style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20,
                    background: "#fff", color: "#6B6860", border: "0.5px solid #ECEAE5", cursor: "pointer" }}>
                  Not now
                </button>
              </div>
            </div>
          )}
          {composeOpen && (
            <ComposeBlock
              userId={userId!}
              variant="panel"
              onSaved={(p) => setPosts((arr) => [p, ...arr])}
              onCollapse={() => setComposeOpen(false)}
              onChangeTab={onChangeTab}
            />
          )}
          {filtered.map((post) => {
            const plat = primaryPlatform(post);
            const meta = PLATFORM_META[plat];
            const Icon = meta.Icon;
            const isConnected = connections.has(plat);
            const isOpen = openMediaFor === post.id;
            const hasMedia = Array.isArray(post.media_urls) ? post.media_urls.length > 0 : false;
            const thumb = hasMedia ? (post.media_urls as any[])[0] : null;
            const status = (post.status || "draft").toLowerCase();
            return (
              <div key={post.id}>
                <div
                  className="group flex items-center gap-2.5 mb-2"
                  style={{
                    background: "#fff",
                    border: "0.5px solid #ECEAE5",
                    borderRadius: 12,
                    padding: hasMedia ? "14px 16px" : "14px 16px",
                    minHeight: hasMedia ? 96 : 56,
                  }}
                  draggable
                  onDragStart={() => onDragStart(post.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDropOn(post)}
                >
                  <GripVertical size={16} color="#9A9896" style={{ cursor: "grab", flexShrink: 0 }} />
                  <div className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 28, height: 28, borderRadius: 7, background: meta.bg }}>
                    <Icon size={15} color={meta.color} />
                  </div>
                  {thumb && (
                    <img
                      src={thumbUrls[post.id] ?? thumb}
                      alt=""
                      className="flex-shrink-0"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "0.5px solid #ECEAE5",
                        background: "#F0EFEC",
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px]"
                      style={{
                        color: "#0E0F10",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {previewText(post) || <span style={{ color: "#9A9896" }}>(empty)</span>}
                    </div>
                    {post.pillar && <div className="text-[11px]" style={{ color: "#9A9896" }}>{post.pillar}</div>}
                  </div>
                  {!hasMedia && (
                    <button
                      onClick={() => setOpenMediaFor(isOpen ? null : post.id)}
                      className="flex items-center gap-1.5 flex-shrink-0"
                      style={{
                        fontSize: 11, color: "#E85A46",
                        border: "1px dashed #F5C4B3",
                        borderRadius: 7, padding: "4px 8px",
                        background: "transparent", cursor: "pointer",
                      }}
                      title="Add a visual to this post"
                    >
                      <ImagePlus size={13} /> Add visual
                    </button>
                  )}
                  <label className="text-[12px] whitespace-nowrap cursor-pointer" style={{ color: "#6B6860" }}>
                    {fmtDate(post.scheduled_for)}
                    <input type="datetime-local" defaultValue={toLocalInputValue(post.scheduled_for)}
                      className="sr-only" onChange={(e) => handleDateChange(post, e.target.value)} />
                  </label>
                  <span className="text-[10px] font-semibold whitespace-nowrap"
                    style={{
                      borderRadius: 4, padding: "2px 8px",
                      background: status === "scheduled" ? "#E6F1FB" : status === "published" ? "#EAF3DE" : "#F0EFEC",
                      color: status === "scheduled" ? "#185FA5" : status === "published" ? "#3B6D11" : "#6B6860",
                      border: status === "draft" ? "0.5px solid #ECEAE5" : "none",
                    }}>
                    {status[0].toUpperCase() + status.slice(1)}
                  </span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button title="Edit" onClick={() => setEditingId(editingId === post.id ? null : post.id)}>
                      <Pencil size={13} color={editingId === post.id ? "#E85A46" : "#6B6860"} /></button>
                    <button title="Media library" onClick={() => setOpenMediaFor(isOpen ? null : post.id)}>
                      <ImageIcon size={13} color="#6B6860" /></button>
                    <button title="Delete" onClick={() => handleDelete(post)}>
                      <Trash2 size={13} color="#6B6860" /></button>
                  </div>
                  {isConnected && (
                    <button onClick={() => handlePublish(post)}
                      className="font-semibold"
                      style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 26, padding: "0 10px", fontSize: 11 }}>
                      Publish now
                    </button>
                  )}
                  {!isConnected && (
                    <button onClick={() => setShowPublishBanner(true)}
                      className="font-semibold opacity-60"
                      style={{ background: "#E85A46", color: "#fff", borderRadius: 6, height: 26, padding: "0 10px", fontSize: 11 }}>
                      Publish now
                    </button>
                  )}
                </div>
                {isOpen && (
                  <MediaPanel userId={userId!} postId={post.id}
                    onClose={() => setOpenMediaFor(null)}
                    onAttached={(url) => {
                      setPosts((arr) => arr.map((p) => (p.id === post.id ? { ...p, media_urls: [url] } : p)));
                    }} />
                )}
                {editingId === post.id && (
                  <EditPostPanel
                    post={post}
                    userId={userId!}
                    onClose={() => setEditingId(null)}
                    onSaved={(updated) => {
                      setPosts((arr) => arr.map((p) => (p.id === updated.id ? updated : p)));
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      {pickerFor && (
        <DestinationPicker
          options={pickerFor.options}
          onCancel={() => setPickerFor(null)}
          onConfirm={handlePickerPublish}
        />
      )}
    </div>
  );
}

function DestinationPicker({ options, onCancel, onConfirm }: {
  options: LinkedInConnection[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(options.map((o) => o.id)));
  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(14,15,16,0.4)" }}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5" style={{ border: "0.5px solid #ECEAE5" }}>
        <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>Publish to</div>
        <div className="text-[12px] mt-1" style={{ color: "#6B6860" }}>Choose one or more LinkedIn destinations.</div>
        <div className="mt-3 space-y-2">
          {options.map((o) => {
            const label = o.connection_type === "company"
              ? `${o.organization_name ?? "Company page"} (Company Page)`
              : `${o.profile_name ?? "Personal"} (Personal)`;
            const on = selected.has(o.id);
            return (
              <label key={o.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2"
                style={{ border: "0.5px solid #ECEAE5", background: on ? "#FBF5F3" : "#fff" }}>
                <input type="checkbox" checked={on} onChange={() => toggle(o.id)} />
                <span className="text-[13px]" style={{ color: "#0E0F10" }}>{label}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="text-[12px] font-medium"
            style={{ border: "0.5px solid #ECEAE5", borderRadius: 8, height: 32, padding: "0 14px", color: "#6B6860", background: "transparent" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(Array.from(selected))} disabled={selected.size === 0}
            className="text-[12px] font-semibold text-white"
            style={{ background: "#E85A46", borderRadius: 8, height: 32, padding: "0 14px", opacity: selected.size === 0 ? 0.5 : 1 }}>
            Publish now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Media library panel ---------------- */
function PhotoCard({
  photo, attaching, onAttach, onCanva,
}: {
  photo: { id: number; thumbnailUrl: string; fullUrl: string; photographer?: string };
  attaching: boolean;
  onAttach: () => void;
  onCanva: () => void;
}) {
  return (
    <div className="relative group overflow-hidden"
      style={{ aspectRatio: "1", borderRadius: 10, cursor: "pointer" }}>
      <img src={photo.thumbnailUrl} alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div className="absolute inset-0 flex items-end justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(15,17,20,0.45)", padding: 8 }}>
        <button
          onClick={onAttach}
          disabled={attaching}
          style={{
            fontSize: 10, fontWeight: 600, padding: "5px 9px",
            borderRadius: 14, background: "#E85A46", color: "#fff",
            border: "none", cursor: "pointer",
          }}
        >{attaching ? "Adding…" : "Add to post"}</button>
        <button
          onClick={(e) => { e.stopPropagation(); onCanva(); }}
          title="Download & open Canva"
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 10, fontWeight: 600, padding: "5px 9px",
            borderRadius: 14, background: "#fff", color: "#0E0F10",
            border: "none", cursor: "pointer",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="#00C4CC" />
            <path d="M22 20.4c-1.6 1.9-3.8 3-6.2 3-4.1 0-7.3-3.5-7.3-7.9 0-4.8 3.5-8.3 7.9-8.3 3.2 0 5.7 1.7 5.7 4.1 0 1.1-.6 1.9-1.5 1.9-1 0-1.6-.6-1.9-1.7-.3-1.5-1.1-2.3-2.4-2.3-2 0-3.5 2.4-3.5 5.6 0 3.2 1.5 5.7 3.6 5.7 1.4 0 2.5-.7 3.6-2.4l1.9 2.2z" fill="#fff" />
          </svg>
          Canva
        </button>
      </div>
    </div>
  );
}

function MediaPanel({ userId, postId, onClose, onAttached }: {
  userId: string; postId: string; onClose: () => void; onAttached: (url: string) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState<"all" | "images" | "videos" | "colors" | "stock">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState<Array<{ id: number; thumbnailUrl: string; fullUrl: string; photographer: string }>>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<Array<{ id: number; thumbnailUrl: string; fullUrl: string; photographer: string }>>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recAvailable, setRecAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: prof }] = await Promise.all([
        supabase.from("social_media_assets").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("profiles").select("brand_colors").eq("id", userId).maybeSingle(),
      ]);
      const list = (a ?? []) as any[];
      setAssets(list as any);
      const bc = (prof as any)?.brand_colors;
      setBrandColors(Array.isArray(bc) ? bc : []);
      // sign all image URLs
      const pairs = await Promise.all(
        list.filter((x) => x.media_type !== "video").map(async (x) => [x.id, await signAssetUrl(x)] as [string, string])
      );
      setSigned(Object.fromEntries(pairs));
    })();
  }, [userId]);

  // Load cached recommendations (or check strategy availability) when Stock tab opens
  useEffect(() => {
    if (tab !== "stock" || !userId) return;
    let cancelled = false;
    (async () => {
      // Determine if we have enhanced_foundation for this user
      const { data: strat } = await supabase
        .from("strategies").select("enhanced_foundation").eq("user_id", userId).maybeSingle();
      const ef = (strat as any)?.enhanced_foundation;
      const hasStrategy = ef && typeof ef === "object" && Object.keys(ef).length > 0;
      if (cancelled) return;
      setRecAvailable(hasStrategy);
      if (!hasStrategy) return;

      const { data: cache } = await supabase
        .from("brand_image_cache")
        .select("images_json, generated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const stale = !cache || (Date.now() - new Date((cache as any).generated_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
      if (cache && !stale) {
        setRecommended((((cache as any).images_json ?? []) as any[]).map((p) => ({
          id: p.id, thumbnailUrl: p.thumbnailUrl, fullUrl: p.fullUrl, photographer: p.photographer,
        })));
      } else {
        await generateRecommended(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId]);

  async function generateRecommended(force: boolean) {
    setRecLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (force) {
        await supabase.from("brand_image_cache").delete().eq("user_id", userId);
      }
      const { data, error } = await supabase.functions.invoke("generate-brand-images", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { refresh: force },
      });
      if (error) throw error;
      const imgs = ((data as any)?.images ?? []) as any[];
      setRecommended(imgs.map((p) => ({
        id: p.id, thumbnailUrl: p.thumbnailUrl, fullUrl: p.fullUrl, photographer: p.photographer,
      })));
      if (force) toast.success("Recommendations refreshed");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't generate recommendations");
    } finally { setRecLoading(false); }
  }

  function editInCanva(fullUrl: string) {
    // Fallback handoff: download image locally, then open a blank Canva design.
    // Canva has no public no-auth URL scheme that reliably pre-loads an external image asset.
    try {
      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = "moxiemo-image.jpg";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { /* noop */ }
    window.open("https://www.canva.com/create/", "_blank", "noopener,noreferrer");
    toast.info("Image downloaded — upload it in Canva to start designing");
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("social-assets").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("social-assets").getPublicUrl(path);
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { data, error } = await supabase.from("social_media_assets").insert({
        user_id: userId, url: publicUrl, filename: path, media_type: mediaType, size_bytes: file.size,
      }).select().single();
      if (error) throw error;
      setAssets((arr) => [data as any, ...arr]);
      if (mediaType === "image") {
        const url = await signAssetUrl(data as any);
        setSigned((s) => ({ ...s, [(data as any).id]: url }));
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(false); }
  }

  async function attach() {
    const asset = assets.find((a) => a.id === selected);
    if (!asset) return;
    // Persist the storage path; we'll sign at render time
    const path = storagePathOf(asset) ?? asset.url;
    const { error } = await supabase.from("social_posts").update({ media_urls: [path] }).eq("id", postId);
    if (error) { toast.error(error.message); return; }
    const display = await signAssetUrl(asset);
    onAttached(display || path);
    toast.success("Attached to post");
    onClose();
  }

  async function runStockSearch() {
    const q = stockQuery.trim();
    if (!q) return;
    setStockLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("pexels-search", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { query: q },
      });
      if (error) throw error;
      setStockResults(((data as any)?.results ?? []) as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
    } finally { setStockLoading(false); }
  }

  async function attachStockPhoto(photo: { id: number; fullUrl: string }) {
    setAttachingId(photo.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("pexels-attach", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { imageUrl: photo.fullUrl, postId },
      });
      if (error) throw error;
      const payload = data as any;
      const asset = payload?.asset as Asset | undefined;
      const path = payload?.path as string | undefined;
      if (asset) {
        setAssets((arr) => [asset, ...arr]);
        const display = await signAssetUrl(asset);
        setSigned((s) => ({ ...s, [asset.id]: display }));
      }
      onAttached(path ?? payload?.url ?? "");
      toast.success("Attached to post");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Attach failed");
    } finally { setAttachingId(null); }
  }

  const visible = useMemo(() => {
    if (tab === "images") return assets.filter((a) => a.media_type === "image");
    if (tab === "videos") return assets.filter((a) => a.media_type === "video");
    return assets;
  }, [assets, tab]);

  return (
    <div style={{ background: "#F7F5F1", border: "0.5px solid #ECEAE5", borderRadius: 10, padding: 16, marginTop: 8, marginBottom: 8 }}>
      <label
        className="block text-center cursor-pointer"
        style={{ border: "0.5px dashed #ECEAE5", borderRadius: 8, padding: 20, background: "#fff" }}>
        <input type="file" className="hidden" accept="image/*,video/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        <CloudUpload size={22} color="#9A9896" className="mx-auto" />
        <div className="text-[12px] mt-1" style={{ color: "#9A9896" }}>
          {uploading ? "Uploading…" : "Drag and drop or click to upload"}
        </div>
        <div className="text-[11px]" style={{ color: "#9A9896" }}>PNG, JPG, GIF, MP4</div>
      </label>

      <div className="flex gap-2 mt-3">
        {(["all","images","videos","colors","stock"] as const).map((t) => {
          const labels: any = { all: "All", images: "Images", videos: "Videos", colors: "Brand Colors", stock: "Stock Photos" };
          const active = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} className="text-[12px] font-medium"
              style={{
                borderRadius: 20, padding: "4px 12px",
                border: active ? "1px solid #E85A46" : "0.5px solid #ECEAE5",
                color: active ? "#E85A46" : "#6B6860",
              }}>{labels[t]}</button>
          );
        })}
      </div>

      {tab === "colors" ? (
        <div className="flex flex-wrap gap-3 mt-3">
          {brandColors.length === 0 ? (
            <div className="text-[12px]" style={{ color: "#9A9896" }}>No brand colors saved yet.</div>
          ) : brandColors.map((c) => (
            <div key={c} className="flex flex-col items-center gap-1">
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: "0.5px solid #ECEAE5" }} />
              <div className="text-[11px]" style={{ color: "#6B6860" }}>{c}</div>
            </div>
          ))}
        </div>
      ) : tab === "stock" ? (
        <div className="mt-3">
          {/* Recommended for your brand — strategy-aware curated row */}
          {recAvailable !== false && (
            <div style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
                <Sparkles size={13} color="#E85A46" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0E0F10" }}>Recommended for your brand</span>
              </div>
              <p style={{ fontSize: 11, color: "#6B6860", margin: "0 0 8px 0" }}>
                Based on your positioning, aesthetic, and industry — no search needed.
              </p>
              {recLoading ? (
                <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#9A9896" }}>
                  <Loader2 size={12} className="animate-spin" /> Curating imagery…
                </div>
              ) : recommended.length === 0 ? (
                <div style={{ fontSize: 11, color: "#9A9896" }}>
                  No recommendations yet.{" "}
                  <button onClick={() => generateRecommended(true)} style={{ color: "#E85A46", fontWeight: 600 }}>
                    Generate now
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {recommended.map((photo) => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        attaching={attachingId === photo.id}
                        onAttach={() => attachStockPhoto(photo)}
                        onCanva={() => editInCanva(photo.fullUrl)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "#9A9896" }}>Photos provided by Pexels</span>
                    <button
                      onClick={() => generateRecommended(true)}
                      disabled={recLoading}
                      className="inline-flex items-center gap-1"
                      style={{
                        fontSize: 11, color: "#6B6860", background: "transparent",
                        border: "0.5px solid #ECEAE5", borderRadius: 14, padding: "3px 10px",
                      }}
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {recAvailable === false && (
            <div style={{
              fontSize: 11, color: "#6B6860", background: "#fff",
              border: "0.5px solid #ECEAE5", borderRadius: 8, padding: "8px 10px", marginBottom: 14,
            }}>
              Complete your strategy to unlock brand-matched image recommendations.
            </div>
          )}
          <div className="flex gap-2 mb-3">
            <input
              value={stockQuery}
              onChange={(e) => setStockQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  await runStockSearch();
                }
              }}
              placeholder="Search millions of free stock photos..."
              style={{
                flex: 1, height: 34, border: "0.5px solid #ECEAE5",
                borderRadius: 8, padding: "0 12px", fontSize: 13, background: "#F7F5F1",
              }}
            />
            <button
              onClick={runStockSearch}
              disabled={stockLoading}
              style={{
                height: 34, padding: "0 16px", borderRadius: 8, border: "none",
                background: "#0E0F10", color: "#F7F5F1", fontSize: 12, fontWeight: 500,
                cursor: "pointer", opacity: stockLoading ? 0.6 : 1,
              }}
            >{stockLoading ? "Searching…" : "Search"}</button>
          </div>
          {stockResults.length === 0 && !stockLoading && (
            <div className="text-[12px] text-center py-6" style={{ color: "#9A9896" }}>
              Search for photos to browse Pexels' free library.
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {stockResults.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                attaching={attachingId === photo.id}
                onAttach={() => attachStockPhoto(photo)}
                onCanva={() => editInCanva(photo.fullUrl)}
              />
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#9A9896", textAlign: "right", marginTop: 4 }}>
            Photos provided by Pexels
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {visible.map((a) => {
            const sel = selected === a.id;
            return (
              <button key={a.id} onClick={() => setSelected(sel ? null : a.id)}
                className="relative overflow-hidden"
                style={{
                  aspectRatio: "1", borderRadius: 8,
                  border: sel ? "2px solid #E85A46" : "0.5px solid #ECEAE5",
                  background: "#F0EFEC",
                }}>
                {a.media_type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center"><Video size={20} color="#9A9896" /></div>
                ) : signed[a.id] ? (
                  <img
                    src={signed[a.id]}
                    alt={a.filename ?? ""}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} color="#9A9896" /></div>
                )}
                {sel && (
                  <div className="absolute top-1 right-1 flex items-center justify-center"
                    style={{ width: 16, height: 16, borderRadius: "50%", background: "#E85A46", border: "1.5px solid #fff" }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
              </button>
            );
          })}
          {visible.length === 0 && (
            <div className="col-span-5 text-[12px] text-center py-4" style={{ color: "#9A9896" }}>No assets yet.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3.5 pt-3" style={{ borderTop: "0.5px solid #ECEAE5" }}>
        <span className="text-[12px]" style={{ color: "#9A9896" }}>{selected ? "1 selected" : "0 selected"}</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="text-[12px]"
            style={{ border: "0.5px solid #ECEAE5", borderRadius: 20, padding: "5px 14px", color: "#6B6860" }}>Cancel</button>
          <button onClick={attach} disabled={!selected || tab === "colors" || tab === "stock"} className="text-[12px] font-semibold"
            style={{
              background: "#E85A46", color: "#fff",
              borderRadius: 20, padding: "5px 14px",
              opacity: !selected || tab === "colors" || tab === "stock" ? 0.5 : 1,
            }}>Attach to post</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Compose block (empty state + Add Post panel) ---------------- */
const CHAR_LIMITS: Record<Platform, number> = {
  linkedin: 3000, instagram: 2200, facebook: 63206, x: 280,
};
const PILL_ACTIVE: Record<Platform, { bg: string; border: string; color: string }> = {
  linkedin:  { bg: "#E8F1FB", border: "#0A66C2", color: "#0A66C2" },
  instagram: { bg: "#FCE8F5", border: "#C13584", color: "#C13584" },
  facebook:  { bg: "#E8F0FD", border: "#1877F2", color: "#1877F2" },
  x:         { bg: "#F0EFEC", border: "#0E0F10", color: "#0E0F10" },
};

type CachedAngle = { pillar: string; angle: string };

function ComposeBlock({
  userId, variant, onSaved, onCollapse, onChangeTab,
}: {
  userId: string;
  variant: "empty" | "panel";
  onSaved: (post: SocialPost) => void;
  onCollapse?: () => void;
  onChangeTab?: (t: string) => void;
}) {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [angles, setAngles] = useState<CachedAngle[] | null>(null);
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [phase, setPhase] = useState<"idea" | "generating" | "generated">("idea");
  const [idea, setIdea] = useState("");
  const [pillarUsed, setPillarUsed] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase.from("strategies").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setStrategy((data as any) ?? {}));
  }, [userId]);

  const limit = CHAR_LIMITS[platform];

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("pillar_feed_cache").select("angles_json").eq("user_id", userId).maybeSingle();
      const arr = ((data as any)?.angles_json?.angles ?? []) as CachedAngle[];
      if (cancelled) return;
      if (Array.isArray(arr) && arr.length > 0) {
        setAngles(arr.slice(0, 3));
      } else {
        // Background generate
        setLoadingAngles(true);
        try {
          const { data: gen } = await invokeWithAuth("generate-pillar-angles", {});
          const a = (gen as any)?.angles?.angles ?? [];
          if (!cancelled) setAngles(Array.isArray(a) ? a.slice(0, 3) : []);
        } catch {
          if (!cancelled) setAngles([]);
        } finally {
          if (!cancelled) setLoadingAngles(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  async function refreshAngles() {
    setLoadingAngles(true);
    try {
      await supabase.from("pillar_feed_cache").delete().eq("user_id", userId);
      const { data: gen } = await invokeWithAuth("generate-pillar-angles", { refresh: true });
      const a = (gen as any)?.angles?.angles ?? [];
      setAngles(Array.isArray(a) ? a.slice(0, 3) : []);
      toast.success("Suggestions refreshed");
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally { setLoadingAngles(false); }
  }

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("social_posts").insert({
        user_id: userId,
        platforms: [platform],
        content_by_platform: { [platform]: text.trim() } as any,
        status: "draft",
        pillar: pillarUsed,
        sort_order: 0,
      }).select("id, user_id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, media_urls, sort_order, created_at").single();
      if (error) throw error;
      onSaved(data as any);
      setText("");
      setIdea("");
      setPillarUsed(null);
      setPhase("idea");
      toast.success("Saved to queue");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally { setSaving(false); }
  }

  async function runGenerate(useIdea?: string) {
    const topic = (useIdea ?? text).trim();
    if (!topic) return;
    setIdea(topic);
    setPhase("generating");
    try {
      const { data, error } = await invokeWithAuth("generate-social-post", {
        topic,
        platforms: [platform],
        postFormat: "Text post",
        toneOverride: null,
        strategy: strategy ?? {},
      });
      if (error) throw error;
      const posts = (data as any)?.posts ?? {};
      const generated = posts[platform] || Object.values(posts).find((v: any) => v) || "";
      setText(String(generated));
      setPhase("generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
      setPhase("idea");
    }
  }

  const isPanel = variant === "panel";

  return (
    <div style={{
      background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 14,
      padding: isPanel ? "20px 24px" : "28px 32px",
      marginBottom: isPanel ? 14 : 0,
    }}>
      {isPanel ? (
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="text-[13px] font-semibold" style={{ color: "#0E0F10" }}>New post</div>
          <button onClick={onCollapse} className="text-[11px]" style={{ color: "#E85A46" }}>Collapse</button>
        </div>
      ) : (
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>What would you like to post?</div>
          <div className="text-[12px]" style={{ color: "#6B6860", marginTop: 4 }}>
            Write something now, or pick a suggestion from your strategy below.
          </div>
        </div>
      )}

      {/* Compose area */}
      <div style={{
        background: "#F7F5F1", border: "0.5px solid #ECEAE5", borderRadius: 10,
        padding: "14px 16px", marginTop: isPanel ? 0 : 16,
      }}>
        <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 10 }}>
          {(["linkedin","instagram","facebook","x"] as Platform[]).map((p) => {
            const meta = PLATFORM_META[p];
            const Icon = meta.Icon;
            const active = platform === p;
            const a = PILL_ACTIVE[p];
            return (
              <button key={p} onClick={() => setPlatform(p)}
                className="flex items-center gap-1.5"
                style={{
                  borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 500,
                  cursor: "pointer",
                  border: active ? `1px solid ${a.border}` : "0.5px solid #ECEAE5",
                  background: active ? a.bg : "#fff",
                  color: active ? a.color : "#6B6860",
                }}>
                <Icon size={12} /> {meta.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind? Write your post here, or click a suggestion below to get started..."
          style={{
            width: "100%", minHeight: isPanel ? 52 : 64, background: "transparent",
            border: "none", outline: "none", fontSize: 13, color: "#0E0F10",
            borderLeft: phase === "generated" ? "3px solid #E85A46" : "none",
            paddingLeft: phase === "generated" ? 12 : 0,
            lineHeight: 1.6, resize: "vertical", fontFamily: "Space Grotesk, sans-serif",
          }}
          disabled={phase === "generating"}
        />
        {phase === "generating" && (
          <div className="flex items-center justify-center gap-2" style={{ padding: "10px 0", color: "#9A9896", fontSize: 12 }}>
            <Loader2 size={14} color="#E85A46" className="animate-spin" /> Generating your post...
          </div>
        )}
        {phase === "generated" && pillarUsed && (
          <div style={{ fontSize: 10, color: "#9A9896", marginTop: 6 }}>
            {PLATFORM_META[platform].label} · {pillarUsed}
          </div>
        )}

        <div className="flex items-center justify-between"
          style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid #ECEAE5" }}>
          <div className="flex gap-2">
            <button onClick={() => setShowMedia((v) => !v)}
              className="flex items-center gap-1.5"
              style={{ border: "0.5px solid #ECEAE5", borderRadius: 20, padding: "5px 12px",
                fontSize: 12, fontWeight: 500, color: "#6B6860", background: "transparent", cursor: "pointer" }}>
              <ImageIcon size={12} /> Add image
            </button>
            {phase === "generated" && (
              <button onClick={() => runGenerate(idea)}
                className="flex items-center gap-1.5"
                style={{ border: "0.5px solid #ECEAE5", borderRadius: 20, padding: "5px 12px",
                  fontSize: 12, fontWeight: 500, color: "#6B6860", background: "transparent", cursor: "pointer" }}>
                <RotateCcw size={12} /> Regenerate
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: text.length > limit ? "#E85A46" : "#9A9896" }}>
              {text.length} / {limit}
            </span>
            {phase === "generated" ? (
              <button onClick={save} disabled={saving || !text.trim()}
                className="flex items-center gap-1 font-semibold"
                style={{
                  background: "#E85A46", color: "#fff", border: "none",
                  borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: (!text.trim() || saving) ? "not-allowed" : "pointer",
                  opacity: !text.trim() || saving ? 0.45 : 1,
                }}>
                <CalendarPlus size={12} /> Save to queue
              </button>
            ) : (
              <button onClick={() => runGenerate()} disabled={!text.trim() || phase === "generating"}
                className="flex items-center gap-1.5 font-semibold"
                style={{
                  background: "#E85A46", color: "#fff", border: "none",
                  borderRadius: 20, padding: "5px 18px", fontSize: 13, fontWeight: 600,
                  cursor: !text.trim() ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(232,90,70,0.25)",
                  opacity: !text.trim() || phase === "generating" ? 0.45 : 1,
                }}>
                <Sparkles size={14} /> Generate post →
              </button>
            )}
          </div>
        </div>

        {showMedia && (
          <div style={{ marginTop: 12 }}>
            <SimpleMediaUploader userId={userId} onClose={() => setShowMedia(false)} />
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          color: "#9A9896", letterSpacing: "0.08em", marginBottom: 10,
        }}>Suggested from your strategy</div>
        <div className="grid grid-cols-3 gap-2">
          {angles === null || loadingAngles ? (
            [0,1,2].map((i) => (
              <div key={i} className="animate-pulse"
                style={{ background: "#F0EFEC", border: "0.5px solid #ECEAE5", borderRadius: 10, height: 78 }} />
            ))
          ) : angles.length === 0 ? (
            [0,1,2].map((i) => (
              <div key={i}
                style={{
                  background: "#fff", border: "0.5px solid #ECEAE5",
                  borderRadius: 10, padding: "10px 14px", height: 78,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textAlign: "center", color: "#9A9896", fontSize: 12,
                }}>
                Click "Refresh suggestions" to load ideas from your strategy.
              </div>
            ))
          ) : (
            angles.map((a, i) => (
              <button key={i} onClick={() => { setText(a.angle); setPillarUsed(a.pillar); setPhase("idea"); }}
                className="text-left transition"
                style={{
                  background: "#fff", border: "0.5px solid #ECEAE5",
                  borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E85A46")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ECEAE5")}>
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                  color: "#E85A46", letterSpacing: "0.08em", marginBottom: 4,
                }}>{a.pillar}</div>
                <div style={{ fontSize: 12, color: "#0E0F10", lineHeight: 1.45 }}>{a.angle}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Or divider + quick actions */}
      <div className="flex items-center gap-2.5" style={{ margin: "14px 0" }}>
        <div style={{ flex: 1, height: 0.5, background: "#ECEAE5" }} />
        <span style={{ fontSize: 11, color: "#9A9896" }}>or start from</span>
        <div style={{ flex: 1, height: 0.5, background: "#ECEAE5" }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onChangeTab?.("pillar")}
          className="flex items-center gap-1.5"
          style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: "#6B6860", cursor: "pointer" }}>
          <Lightbulb size={13} /> Browse Pillar Feed for angles
        </button>
        <button onClick={() => onChangeTab?.("calendar")}
          className="flex items-center gap-1.5"
          style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: "#6B6860", cursor: "pointer" }}>
          <CalendarDays size={13} /> See what's scheduled this month
        </button>
        <button onClick={refreshAngles}
          className="flex items-center gap-1.5"
          style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: "#6B6860", cursor: "pointer" }}>
          <RefreshCw size={13} /> Refresh suggestions
        </button>
      </div>
    </div>
  );
}

function SimpleMediaUploader({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("social-assets").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("social-assets").getPublicUrl(path);
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { error } = await supabase.from("social_media_assets").insert({
        user_id: userId, url: publicUrl, filename: path, media_type: mediaType, size_bytes: file.size,
      });
      if (error) throw error;
      toast.success("Uploaded to media library");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(false); }
  }
  return (
    <label className="block text-center cursor-pointer"
      style={{ border: "0.5px dashed #ECEAE5", borderRadius: 8, padding: 16, background: "#fff" }}>
      <input type="file" className="hidden" accept="image/*,video/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
      <CloudUpload size={20} color="#9A9896" className="mx-auto" />
      <div className="text-[12px] mt-1" style={{ color: "#9A9896" }}>
        {uploading ? "Uploading…" : "Drag and drop or click to upload"}
      </div>
    </label>
  );
}

/* ---------------- Inline edit panel ---------------- */
function EditPostPanel({
  post, userId, onClose, onSaved,
}: {
  post: SocialPost;
  userId: string;
  onClose: () => void;
  onSaved: (p: SocialPost) => void;
}) {
  const initialPlatform = primaryPlatform(post);
  const initialText = (post.content_by_platform ?? {})[initialPlatform] ?? Object.values(post.content_by_platform ?? {})[0] ?? "";
  const initialMedia = Array.isArray(post.media_urls) && post.media_urls.length > 0 ? (post.media_urls[0] as string) : null;

  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [text, setText] = useState<string>(String(initialText));
  const [mediaPath, setMediaPath] = useState<string | null>(initialMedia);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const limit = CHAR_LIMITS[platform];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mediaPath) { setThumbUrl(null); return; }
      const url = await signAssetUrl({ url: mediaPath, filename: null });
      if (!cancelled) setThumbUrl(url);
    })();
    return () => { cancelled = true; };
  }, [mediaPath]);

  async function handleSave() {
    setSaving(true);
    try {
      const cbp = { ...(post.content_by_platform ?? {}), [platform]: text };
      const { data, error } = await supabase.from("social_posts").update({
        platforms: [platform],
        content_by_platform: cbp,
        media_urls: mediaPath ? [mediaPath] : [],
      }).eq("id", post.id)
        .select("id, user_id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, media_urls, sort_order, created_at")
        .single();
      if (error) throw error;
      onSaved(data as any);
      toast.success("Post updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ background: "#F7F5F1", border: "0.5px solid #ECEAE5", borderRadius: 10, padding: 16, marginTop: 8, marginBottom: 8 }}>
      <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 10 }}>
        {(["linkedin","instagram","facebook","x"] as Platform[]).map((p) => {
          const meta = PLATFORM_META[p];
          const Icon = meta.Icon;
          const active = platform === p;
          const a = PILL_ACTIVE[p];
          return (
            <button key={p} onClick={() => setPlatform(p)} className="flex items-center gap-1.5"
              style={{
                borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 500, cursor: "pointer",
                border: active ? `1px solid ${a.border}` : "0.5px solid #ECEAE5",
                background: active ? a.bg : "#fff",
                color: active ? a.color : "#6B6860",
              }}><Icon size={12} /> {meta.label}</button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 8, padding: 12,
          fontSize: 13, color: "#0E0F10", lineHeight: 1.6, width: "100%", minHeight: 96, resize: "vertical",
          outline: "none", fontFamily: "Space Grotesk, sans-serif",
        }}
      />

      {mediaPath && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 52, height: 52, borderRadius: 6, border: "0.5px solid #ECEAE5", overflow: "hidden", background: "#F0EFEC" }}>
            {thumbUrl ? (
              <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} color="#9A9896" /></div>
            )}
          </div>
          <button onClick={() => setMediaPath(null)} title="Remove image"
            style={{ border: "0.5px solid #ECEAE5", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
            <X size={12} color="#6B6860" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: text.length > limit ? "#E85A46" : "#9A9896" }}>{text.length} / {limit}</span>
          <button onClick={() => setShowLibrary((v) => !v)} className="flex items-center gap-1.5"
            style={{ border: "0.5px solid #ECEAE5", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#6B6860", background: "transparent", cursor: "pointer" }}>
            <ImageIcon size={12} /> {mediaPath ? "Change image" : "Add image"}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            style={{ border: "0.5px solid #ECEAE5", color: "#6B6860", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 500, background: "transparent", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: "#E85A46", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            Save changes
          </button>
        </div>
      </div>

      {showLibrary && (
        <div style={{ marginTop: 12 }}>
          <MediaPanel
            userId={userId}
            postId={post.id}
            onClose={() => setShowLibrary(false)}
            onAttached={(url) => { setMediaPath(url); setShowLibrary(false); }}
          />
        </div>
      )}
    </div>
  );
}