import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  GripVertical, Linkedin, Instagram, Facebook, Twitter, Pencil, Image as ImageIcon,
  Trash2, CloudUpload, Check, Video, Sparkles, CalendarPlus, Lightbulb, CalendarDays, RefreshCw,
  RotateCcw, X, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  return String(txt).slice(0, 100);
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
  const [openMediaFor, setOpenMediaFor] = useState<string | null>(null);
  const [showPublishBanner, setShowPublishBanner] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

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
        supabase.from("social_connections").select("platform").eq("user_id", userId),
      ]);
      setPosts((rows ?? []) as any);
      setConnections(new Set(((conns ?? []) as any[]).map((c) => c.platform)));
      setLoading(false);
    })();
  }, [userId]);

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
        const url = await signAssetUrl({ url: first, filename: null });
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

  async function handlePublish(post: SocialPost) {
    const plat = primaryPlatform(post);
    if (!connections.has(plat)) {
      setShowPublishBanner(true);
      return;
    }
    try {
      const { error } = await supabase.functions.invoke("publish-social-post", { body: { postId: post.id } });
      if (error) throw error;
      toast.success("Published!");
      setPosts((arr) => arr.map((p) => (p.id === post.id ? { ...p, status: "published", published_at: new Date().toISOString() } : p)));
    } catch (e: any) {
      toast.error(e?.message ?? "Publish failed");
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
            onClick={() => navigate("/app/settings#integrations")}>Go to Settings →</button>
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
                  style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 12, padding: "14px 16px" }}
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
                    <img src={thumbUrls[post.id] ?? thumb} alt="" className="flex-shrink-0"
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", border: "0.5px solid #ECEAE5" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ color: "#0E0F10" }}>
                      {previewText(post) || <span style={{ color: "#9A9896" }}>(empty)</span>}
                    </div>
                    {post.pillar && <div className="text-[11px]" style={{ color: "#9A9896" }}>{post.pillar}</div>}
                  </div>
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
    </div>
  );
}

/* ---------------- Media library panel ---------------- */
function MediaPanel({ userId, postId, onClose, onAttached }: {
  userId: string; postId: string; onClose: () => void; onAttached: (url: string) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState<"all" | "images" | "videos" | "colors">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});

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
        {(["all","images","videos","colors"] as const).map((t) => {
          const labels: any = { all: "All", images: "Images", videos: "Videos", colors: "Brand Colors" };
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
          <button onClick={attach} disabled={!selected || tab === "colors"} className="text-[12px] font-semibold"
            style={{
              background: "#E85A46", color: "#fff",
              borderRadius: 20, padding: "5px 14px",
              opacity: !selected || tab === "colors" ? 0.5 : 1,
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
          const { data: gen } = await supabase.functions.invoke("generate-pillar-angles", { body: {} });
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
      const { data: gen } = await supabase.functions.invoke("generate-pillar-angles", { body: { refresh: true } });
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
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          topic,
          platforms: [platform],
          postFormat: "Text post",
          toneOverride: null,
          strategy: strategy ?? {},
        },
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
            <div className="col-span-3 text-[12px]" style={{ color: "#9A9896" }}>
              No suggestions yet. Click "Refresh suggestions" below.
            </div>
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