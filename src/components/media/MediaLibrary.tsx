import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Search,
  Trash2,
  Pencil,
  Tag as TagIcon,
  Play,
  Sparkles,
  Loader2,
  Check,
  Plus,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DropZone } from "@/hooks/useFileDrop";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type MediaAsset = {
  id: string;
  user_id: string | null;
  url: string;
  filename: string | null;
  display_name: string | null;
  file_type: string | null;
  file_size_kb: number | null;
  tags: string[] | null;
  asset_type: string | null;
  source: string | null;
  photographer: string | null;
  pexels_url: string | null;
  pexels_id: number | null;
  uploaded_at: string | null;
};

type FilterTab = "all" | "images" | "videos" | "stock";
type SortKey = "newest" | "oldest" | "name";

type Props = {
  userId: string | null;
  mode?: "page" | "picker";
  onSelect?: (asset: MediaAsset) => void;
  headerless?: boolean;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CORAL = "#E85A46";
const INK = "#0E0F10";
const MUTED = "#6B6860";
const BORDER = "#ECEAE5";
const SURFACE = "#FFFFFF";
const CANVAS = "#F7F5F1";

const PAGE_SIZE = 30;
const AUTO_LOAD_LIMIT = 3;

const ACCEPT = "image/png,image/jpeg,image/svg+xml,image/gif,image/webp,video/mp4,video/quicktime";

/* ------------------------------------------------------------------ */
/*  Signed-URL resolution                                              */
/* ------------------------------------------------------------------ */

const STORAGE_BUCKET = "social-assets";
const PUBLIC_MARKER = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
const SIGNED_MARKER = `/storage/v1/object/sign/${STORAGE_BUCKET}/`;

function extractStoragePath(url: string): string | null {
  if (!url) return null;
  const pIdx = url.indexOf(PUBLIC_MARKER);
  if (pIdx !== -1) return url.slice(pIdx + PUBLIC_MARKER.length).split("?")[0];
  const sIdx = url.indexOf(SIGNED_MARKER);
  if (sIdx !== -1) return url.slice(sIdx + SIGNED_MARKER.length).split("?")[0];
  return null;
}

const signedUrlCache = new Map<string, { url: string; expires: number }>();

async function resolveDisplayUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) return rawUrl;
  const path = extractStoragePath(rawUrl);
  if (!path) return rawUrl; // external (e.g. Pexels CDN)
  const cached = signedUrlCache.get(path);
  const now = Date.now();
  if (cached && cached.expires > now + 30_000) return cached.url;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    console.warn("[MediaLibrary] signed URL failed", { path, error });
    return rawUrl;
  }
  signedUrlCache.set(path, { url: data.signedUrl, expires: now + 3600 * 1000 });
  return data.signedUrl;
}

function AssetImage({
  rawUrl,
  alt,
  style,
}: {
  rawUrl: string;
  alt: string;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setSrc(null);
    resolveDisplayUrl(rawUrl).then((u) => {
      if (alive) setSrc(u);
    });
    return () => {
      alive = false;
    };
  }, [rawUrl]);

  if (failed || !src) {
    return (
      <div
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F0EFEC",
          color: MUTED,
        }}
        aria-label={alt}
      >
        <ImageIcon size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        console.warn("[MediaLibrary] image failed to load", { rawUrl, resolved: src });
        setFailed(true);
      }}
      style={style}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function classifyType(fileType: string | null | undefined, assetType?: string | null): "image" | "video" {
  if (assetType === "video") return "video";
  if (fileType && fileType.startsWith("video/")) return "video";
  return "image";
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function MediaLibrary({ userId, mode = "page", onSelect, headerless }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [autoLoadsUsed, setAutoLoadsUsed] = useState(0);
  const [renameFor, setRenameFor] = useState<MediaAsset | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tagFor, setTagFor] = useState<MediaAsset | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [deleteFor, setDeleteFor] = useState<MediaAsset | null>(null);
  const [pickerSelected, setPickerSelected] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ---------- Load assets ---------- */
  const loadAssets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Could not load your library");
      return;
    }
    setAssets((data ?? []) as unknown as MediaAsset[]);
  }, [userId]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  /* ---------- Filtering + sorting ---------- */
  const distinctTags = useMemo(() => {
    const s = new Set<string>();
    assets.forEach((a) => (a.tags ?? []).forEach((t) => t && s.add(t)));
    return Array.from(s).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    let list = [...assets];
    if (filter === "images") list = list.filter((a) => classifyType(a.file_type, a.asset_type) === "image");
    if (filter === "videos") list = list.filter((a) => classifyType(a.file_type, a.asset_type) === "video");
    if (filter === "stock") list = list.filter((a) => a.source === "pexels");
    if (activeTag) list = list.filter((a) => (a.tags ?? []).includes(activeTag));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => {
        const name = (a.display_name || a.filename || "").toLowerCase();
        if (name.includes(q)) return true;
        return (a.tags ?? []).some((t) => t.toLowerCase().includes(q));
      });
    }
    if (sort === "newest") {
      list.sort((a, b) => (b.uploaded_at ?? "").localeCompare(a.uploaded_at ?? ""));
    } else if (sort === "oldest") {
      list.sort((a, b) => (a.uploaded_at ?? "").localeCompare(b.uploaded_at ?? ""));
    } else if (sort === "name") {
      list.sort((a, b) =>
        (a.display_name || a.filename || "").localeCompare(b.display_name || b.filename || ""),
      );
    }
    return list;
  }, [assets, filter, activeTag, search, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const atSafetyGate = autoLoadsUsed >= AUTO_LOAD_LIMIT && hasMore;

  /* ---------- Infinite scroll ---------- */
  useEffect(() => {
    if (!hasMore || atSafetyGate) return;
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisibleCount((v) => v + PAGE_SIZE);
        setAutoLoadsUsed((n) => n + 1);
      }
    }, { rootMargin: "300px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, atSafetyGate, visible.length]);

  /* ---------- Upload ---------- */
  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !userId) return;
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File too large", { description: "Max size is 50MB" });
        return;
      }
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        toast.error("Unsupported file", { description: "Upload PNG, JPG, SVG, or MP4" });
        return;
      }
      setUploading(true);
      try {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("social-assets")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("social-assets").getPublicUrl(path);
        const { data: inserted, error: insErr } = await supabase
          .from("assets")
          .insert({
            user_id: userId,
            url: pub.publicUrl,
            filename: file.name,
            display_name: file.name.replace(/\.[^.]+$/, ""),
            file_type: file.type,
            file_size_kb: Math.round(file.size / 1024),
            asset_type: isVideo ? "video" : "image",
            source: "upload",
            tags: [],
            uploaded_at: new Date().toISOString(),
          } as any)
          .select()
          .single();
        if (insErr) throw insErr;
        setAssets((prev) => [inserted as unknown as MediaAsset, ...prev]);
        toast.success("Uploaded to library");
      } catch (err: any) {
        console.error("upload failed", err);
        toast.error(err?.message ?? "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [userId],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const f of files) {
        await handleFile(f);
      }
    },
    [handleFile],
  );

  /* ---------- Rename / tag / delete ---------- */
  async function commitRename() {
    if (!renameFor) return;
    const next = renameValue.trim() || renameFor.filename || "Untitled";
    const { error } = await supabase
      .from("assets")
      .update({ display_name: next } as any)
      .eq("id", renameFor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAssets((prev) =>
      prev.map((a) => (a.id === renameFor.id ? { ...a, display_name: next } : a)),
    );
    setRenameFor(null);
    toast.success("Renamed");
  }

  async function addTag() {
    if (!tagFor) return;
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    const current = tagFor.tags ?? [];
    if (current.includes(t)) {
      setTagInput("");
      return;
    }
    const next = [...current, t];
    const { error } = await supabase.from("assets").update({ tags: next } as any).eq("id", tagFor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const updated = { ...tagFor, tags: next };
    setTagFor(updated);
    setAssets((prev) => prev.map((a) => (a.id === tagFor.id ? updated : a)));
    setTagInput("");
  }

  async function removeTag(t: string) {
    if (!tagFor) return;
    const next = (tagFor.tags ?? []).filter((x) => x !== t);
    const { error } = await supabase.from("assets").update({ tags: next } as any).eq("id", tagFor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const updated = { ...tagFor, tags: next };
    setTagFor(updated);
    setAssets((prev) => prev.map((a) => (a.id === tagFor.id ? updated : a)));
  }

  async function confirmDelete() {
    if (!deleteFor) return;
    const { error } = await supabase.from("assets").delete().eq("id", deleteFor.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== deleteFor.id));
    setDeleteFor(null);
    toast.success("Deleted");
  }

  function editInCanva(url: string) {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "moxiemo-image.jpg";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
    window.open("https://www.canva.com/create/", "_blank", "noopener,noreferrer");
    toast.info("Image downloaded. Upload it in Canva to start designing.");
  }

  /* ---------- Render helpers ---------- */
  const rootStyle: React.CSSProperties =
    mode === "picker"
      ? { background: SURFACE, padding: 0 }
      : { background: CANVAS, minHeight: "100%", padding: "32px 40px" };

  return (
    <DropZone
      onFile={handleFile}
      accept={ACCEPT}
      style={rootStyle}
      activeStyle={{ outline: `2px dashed ${CORAL}`, outlineOffset: -6, background: "#FFF3EF" }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          void handleFiles(files);
          e.target.value = "";
        }}
      />

      {/* Header */}
      {!headerless && mode === "page" && (
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>
                Media Library
              </div>
              <h1
                style={{
                  fontFamily: '"Space Grotesk", system-ui, sans-serif',
                  fontSize: 34,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: "-0.02em",
                  marginTop: 6,
                }}
              >
                Your images, in one place.
              </h1>
              <p style={{ fontSize: 14, color: MUTED, marginTop: 6, maxWidth: 620 }}>
                Upload once, use anywhere. Social and Content both pull from here.
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ background: CORAL, color: "#fff", height: 40, padding: "0 18px", borderRadius: 10, fontWeight: 600 }}
            >
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </Button>
          </div>

          {/* Drop strip */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${BORDER}`,
              borderRadius: 12,
              padding: "22px 20px",
              textAlign: "center",
              fontSize: 13,
              color: MUTED,
              cursor: "pointer",
              background: SURFACE,
              marginBottom: 22,
            }}
          >
            Drag and drop images or videos anywhere on this page, or click to browse. PNG, JPG, SVG, MP4.
          </div>
        </div>
      )}

      {mode === "picker" && !headerless && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif', fontSize: 18, fontWeight: 700, color: INK }}>
            Media Library
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            style={{ background: CORAL, color: "#fff" }}
          >
            {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
            Upload
          </Button>
        </div>
      )}

      <div style={{ maxWidth: mode === "page" ? 1400 : undefined, margin: mode === "page" ? "0 auto" : undefined, padding: mode === "picker" ? "16px 20px" : undefined }}>
        {/* Filter bar */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-1">
            {(["all", "images", "videos", "stock"] as FilterTab[]).map((t) => {
              const labels: Record<FilterTab, string> = {
                all: "All",
                images: "Images",
                videos: "Videos",
                stock: "Stock Photos",
              };
              const active = filter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFilter(t);
                    setVisibleCount(PAGE_SIZE);
                    setAutoLoadsUsed(0);
                  }}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: `1px solid ${active ? CORAL : BORDER}`,
                    background: active ? CORAL : "transparent",
                    color: active ? "#fff" : MUTED,
                    cursor: "pointer",
                  }}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: MUTED }} />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                  setAutoLoadsUsed(0);
                }}
                placeholder="Search names and tags"
                className="h-9 pl-8 text-sm"
                style={{ width: 240, background: SURFACE }}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                height: 36,
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                padding: "0 10px",
                fontSize: 13,
                color: INK,
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A to Z</option>
            </select>
          </div>
        </div>

        {/* Tag row */}
        {distinctTags.length > 0 && (
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 18 }}>
            {distinctTags.map((t) => {
              const active = activeTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setActiveTag(active ? null : t);
                    setVisibleCount(PAGE_SIZE);
                    setAutoLoadsUsed(0);
                  }}
                  style={{
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 999,
                    background: active ? "#FFE7E1" : "#F2F0EB",
                    color: active ? CORAL : MUTED,
                    border: `1px solid ${active ? CORAL : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  #{t}
                </button>
              );
            })}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                style={{ fontSize: 12, color: MUTED, background: "transparent", border: "none", cursor: "pointer" }}
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Content: Stock tab shows recommendations; otherwise grid */}
        {filter === "stock" ? (
          <StockTab
            userId={userId}
            onSaved={(a) => setAssets((prev) => [a, ...prev])}
            existingPexelsIds={new Set(assets.map((a) => a.pexels_id).filter(Boolean) as number[])}
          />
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16" style={{ color: MUTED }}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onUpload={() => fileInputRef.current?.click()} />
            ) : (
              <>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
                >
                  {visible.map((a) => {
                    const kind = classifyType(a.file_type, a.asset_type);
                    const isPicker = mode === "picker";
                    const selected = pickerSelected === a.id;
                    return (
                      <div
                        key={a.id}
                        className="group relative overflow-hidden"
                        style={{
                          aspectRatio: "1",
                          borderRadius: 12,
                          background: "#F0EFEC",
                          border: `1px solid ${selected ? CORAL : BORDER}`,
                          cursor: isPicker ? "pointer" : "default",
                        }}
                        onClick={() => isPicker && setPickerSelected(a.id)}
                      >
                        {kind === "image" ? (
                          <img src={a.url} alt={a.display_name ?? ""} loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "#0E0F10", color: "#fff" }}>
                            <Play size={24} />
                          </div>
                        )}

                        {selected && (
                          <div style={{ position: "absolute", top: 8, right: 8, background: CORAL, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={14} color="#fff" />
                          </div>
                        )}

                        {/* Hover actions */}
                        {!isPicker && (
                          <div className="absolute inset-x-0 top-0 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: 8 }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.95)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                  title="More"
                                >
                                  <Pencil size={13} color={INK} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameFor(a);
                                    setRenameValue(a.display_name ?? a.filename ?? "");
                                  }}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTagFor(a)}>
                                  <TagIcon className="mr-2 h-3.5 w-3.5" /> Tag
                                </DropdownMenuItem>
                                {kind === "image" && (
                                  <DropdownMenuItem onClick={() => editInCanva(a.url)}>
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> Edit in Canva
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setDeleteFor(a)} style={{ color: "#B4321F" }}>
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}

                        {/* Bottom overlay */}
                        <div
                          className="absolute inset-x-0 bottom-0"
                          style={{
                            padding: "10px 12px",
                            background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
                            color: "#fff",
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {a.display_name || a.filename || "Untitled"}
                          </div>
                          <div style={{ fontSize: 10.5, opacity: 0.85, display: "flex", gap: 6 }}>
                            {(a.tags ?? [])[0] && <span>#{(a.tags ?? [])[0]}</span>}
                            <span>{fmtDate(a.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Auto-load / safety valve */}
                {hasMore && (
                  <div ref={sentinelRef} style={{ padding: 24, textAlign: "center" }}>
                    {atSafetyGate ? (
                      <Button
                        variant="outline"
                        onClick={() => setAutoLoadsUsed(0)}
                        style={{ borderColor: BORDER }}
                      >
                        Show more
                      </Button>
                    ) : (
                      <span style={{ fontSize: 12, color: MUTED }}>
                        <Loader2 className="mr-2 inline h-3 w-3 animate-spin" /> Loading more…
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Picker footer */}
        {mode === "picker" && (
          <div style={{ position: "sticky", bottom: 0, marginTop: 20, padding: "12px 0", background: SURFACE, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              onClick={() => {
                const picked = assets.find((a) => a.id === pickerSelected);
                if (picked && onSelect) onSelect(picked);
              }}
              disabled={!pickerSelected}
              style={{ background: CORAL, color: "#fff" }}
            >
              Attach to post
            </Button>
          </div>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renameFor} onOpenChange={(o) => !o && setRenameFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename asset</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter a name"
            onKeyDown={(e) => e.key === "Enter" && void commitRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFor(null)}>Cancel</Button>
            <Button onClick={() => void commitRename()} style={{ background: CORAL, color: "#fff" }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag dialog */}
      <Dialog open={!!tagFor} onOpenChange={(o) => !o && setTagFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2" style={{ minHeight: 30 }}>
            {(tagFor?.tags ?? []).length === 0 && (
              <span style={{ fontSize: 12, color: MUTED }}>No tags yet.</span>
            )}
            {(tagFor?.tags ?? []).map((t) => (
              <span key={t} style={{ background: "#F2F0EB", padding: "4px 10px", borderRadius: 999, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                #{t}
                <button onClick={() => void removeTag(t)} style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED }}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => e.key === "Enter" && void addTag()}
            />
            <Button onClick={() => void addTag()} style={{ background: CORAL, color: "#fff" }}>Add</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagFor(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this asset?</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 13, color: MUTED }}>
            This removes it from your Media Library. Posts that already use it will keep the image.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFor(null)}>Cancel</Button>
            <Button onClick={() => void confirmDelete()} style={{ background: "#B4321F", color: "#fff" }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropZone>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div
      style={{
        border: `1.5px dashed ${BORDER}`,
        borderRadius: 12,
        padding: "60px 20px",
        textAlign: "center",
        background: SURFACE,
      }}
    >
      <ImageIcon style={{ margin: "0 auto 10px", color: MUTED }} size={28} />
      <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>No media yet</div>
      <div style={{ fontSize: 13, color: MUTED, margin: "6px 0 16px" }}>
        Drag and drop images or videos anywhere, or upload from your computer.
      </div>
      <Button onClick={onUpload} style={{ background: CORAL, color: "#fff" }}>
        <Upload className="mr-2 h-4 w-4" /> Upload media
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stock tab                                                          */
/* ------------------------------------------------------------------ */

type StockPhoto = {
  id: number;
  thumbnailUrl: string;
  fullUrl: string;
  photographer: string;
  photographerUrl?: string;
};

function StockTab({
  userId,
  existingPexelsIds,
  onSaved,
}: {
  userId: string | null;
  existingPexelsIds: Set<number>;
  onSaved: (asset: MediaAsset) => void;
}) {
  const [recommended, setRecommended] = useState<StockPhoto[]>([]);
  const [recTerms, setRecTerms] = useState<string[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recAvailable, setRecAvailable] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StockPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeQ, setActiveQ] = useState("");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [autoLoads, setAutoLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* Load recommendations */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setRecLoading(true);
      try {
        const { data: strat } = await supabase
          .from("strategies")
          .select("enhanced_foundation")
          .eq("user_id", userId)
          .maybeSingle();
        const ef = (strat as any)?.enhanced_foundation;
        const hasStrategy = ef && typeof ef === "object" && Object.keys(ef).length > 0;
        if (cancelled) return;
        setRecAvailable(hasStrategy);
        if (!hasStrategy) return;

        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("generate-brand-images", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          body: {},
        });
        if (error) throw error;
        if (cancelled) return;
        const imgs = ((data as any)?.images ?? []) as StockPhoto[];
        setRecommended(imgs);
        setRecTerms((((data as any)?.searchTerms ?? []) as any[]).map((t) => String(t)));
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Could not load recommendations");
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  async function runSearch(reset = true) {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const nextPage = reset ? 1 : page + 1;
      const { data, error } = await supabase.functions.invoke("pexels-search", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { query: q, page: nextPage },
      });
      if (error) throw error;
      const res = ((data as any)?.results ?? []) as StockPhoto[];
      if (reset) {
        setResults(res);
        setActiveQ(q);
        setPage(1);
        setVisible(PAGE_SIZE);
        setAutoLoads(0);
      } else {
        setResults((prev) => [...prev, ...res]);
        setPage(nextPage);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const list = activeQ ? results : recommended;
    if (visible >= list.length && !activeQ) return;
    if (autoLoads >= AUTO_LOAD_LIMIT) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (activeQ && visible >= results.length) {
          void runSearch(false);
          setAutoLoads((n) => n + 1);
        } else {
          setVisible((v) => v + PAGE_SIZE);
          setAutoLoads((n) => n + 1);
        }
      }
    }, { rootMargin: "300px" });
    obs.observe(node);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQ, results, recommended, visible, autoLoads]);

  async function saveToLibrary(photo: StockPhoto) {
    if (!userId) return;
    if (existingPexelsIds.has(photo.id)) {
      toast.info("Already in your library");
      return;
    }
    setSavingId(photo.id);
    try {
      const { data, error } = await supabase
        .from("assets")
        .insert({
          user_id: userId,
          url: photo.fullUrl,
          filename: `pexels-${photo.id}.jpg`,
          display_name: `Stock photo by ${photo.photographer}`,
          file_type: "image/jpeg",
          asset_type: "image",
          source: "pexels",
          photographer: photo.photographer,
          pexels_url: photo.photographerUrl ?? null,
          pexels_id: photo.id,
          tags: ["stock"],
          uploaded_at: new Date().toISOString(),
        } as any)
        .select()
        .single();
      if (error) throw error;
      onSaved(data as unknown as MediaAsset);
      toast.success("Saved to library");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSavingId(null);
    }
  }

  const displayList = activeQ ? results.slice(0, visible) : recommended;
  const hasMore = activeQ ? results.length >= page * 12 : false;

  return (
    <div>
      {/* Search */}
      <div className="flex gap-2" style={{ marginBottom: 18 }}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: MUTED }} />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Refine with a Pexels search"
            className="h-10 pl-8"
            onKeyDown={(e) => e.key === "Enter" && void runSearch(true)}
            style={{ background: SURFACE }}
          />
        </div>
        <Button onClick={() => void runSearch(true)} disabled={!q.trim() || searching} style={{ background: CORAL, color: "#fff" }}>
          {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search
        </Button>
        {activeQ && (
          <Button variant="outline" onClick={() => { setActiveQ(""); setResults([]); setQ(""); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Recommended header */}
      {!activeQ && (
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <Sparkles size={14} color={CORAL} />
          <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>Curated for your brand</div>
          {recTerms.length > 0 && (
            <div style={{ fontSize: 12, color: MUTED }}>
              · {recTerms.join(" · ")}
            </div>
          )}
        </div>
      )}

      {recAvailable === false && !activeQ ? (
        <div style={{ padding: 40, textAlign: "center", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13 }}>
          Finish your strategy to unlock curated recommendations. In the meantime, search Pexels above.
        </div>
      ) : recLoading && !activeQ ? (
        <div style={{ padding: 40, textAlign: "center", color: MUTED }}>
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Curating for your brand…
        </div>
      ) : searching && activeQ && results.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: MUTED }}>
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Searching Pexels…
        </div>
      ) : displayList.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>
          {activeQ ? `No results for "${activeQ}".` : "No recommendations yet."}
        </div>
      ) : (
        <>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
          >
            {displayList.map((p) => {
              const saved = existingPexelsIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden"
                  style={{ aspectRatio: "1", borderRadius: 12, border: `1px solid ${BORDER}`, background: "#F0EFEC" }}
                >
                  <img src={p.thumbnailUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(15,17,20,0.45)", padding: 10 }}>
                    <Button
                      size="sm"
                      onClick={() => void saveToLibrary(p)}
                      disabled={savingId === p.id || saved}
                      style={{ background: saved ? "#6B6860" : CORAL, color: "#fff", fontSize: 11 }}
                    >
                      {saved ? (
                        <><Check className="mr-1 h-3 w-3" /> Saved</>
                      ) : savingId === p.id ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</>
                      ) : (
                        <><Plus className="mr-1 h-3 w-3" /> Save to library</>
                      )}
                    </Button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0" style={{ padding: "8px 10px", background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))", color: "#fff", fontSize: 10.5 }}>
                    Photo by {p.photographer}
                  </div>
                </div>
              );
            })}
          </div>

          {(hasMore || (!activeQ && recommended.length > visible)) && (
            <div ref={sentinelRef} style={{ padding: 24, textAlign: "center" }}>
              {autoLoads >= AUTO_LOAD_LIMIT ? (
                <Button variant="outline" onClick={() => { setAutoLoads(0); if (activeQ) void runSearch(false); else setVisible((v) => v + PAGE_SIZE); }}>
                  Show more
                </Button>
              ) : (
                <span style={{ fontSize: 12, color: MUTED }}>
                  <Loader2 className="mr-2 inline h-3 w-3 animate-spin" /> Loading more…
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}