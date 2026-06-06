import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Linkedin, Facebook, Instagram, FileText, Loader2, X, Calendar as CalendarIcon, ImagePlus, FolderOpen, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import LibraryAssetsDrawer from "./LibraryAssetsDrawer";

type ContentItem = {
  id: string;
  user_id: string;
  platform: string | null;
  content_type: string | null;
  topic: string | null;
  body: string | null;
  status: string;
  created_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  pillars: string[];
  onScheduled: () => void;
};

const PLATFORM_OPTIONS = ["all", "linkedin", "facebook", "instagram"] as const;
type PlatformFilter = (typeof PLATFORM_OPTIONS)[number];

function platformIcon(p: string | null) {
  const s = (p ?? "").toLowerCase();
  if (s.includes("linkedin")) return <Linkedin size={14} color="#0A66C2" />;
  if (s.includes("facebook")) return <Facebook size={14} color="#1A2A6C" />;
  if (s.includes("instagram")) return <Instagram size={14} color="#A93AAF" />;
  return <FileText size={14} className="text-muted-foreground" />;
}

function normPlat(p: string | null): "linkedin" | "facebook" | "instagram" | "other" {
  const s = (p ?? "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("facebook")) return "facebook";
  if (s.includes("instagram")) return "instagram";
  return "other";
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultSlot(): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return { date: ymd(d), time: "09:00" };
}

function preview(s: string | null) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > 120 ? t.slice(0, 120) + "…" : t || "(empty)";
}

function pillarMatches(item: ContentItem, pillar: string): boolean {
  const hay = `${item.topic ?? ""} ${item.content_type ?? ""}`.toLowerCase();
  return hay.includes(pillar.toLowerCase());
}

export default function ImportFromContentDrawer({ open, onOpenChange, userId, pillars, onScheduled }: Props) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [pillar, setPillar] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(defaultSlot().date);
  const [time, setTime] = useState<string>(defaultSlot().time);
  const [saving, setSaving] = useState(false);
  const [editedBody, setEditedBody] = useState<string>("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    supabase
      .from("content_items")
      .select("id, user_id, platform, content_type, topic, body, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast.error("Couldn't load content");
          return;
        }
        setItems((data as ContentItem[]) ?? []);
      });
  }, [open, userId]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (platform !== "all" && normPlat(it.platform) !== platform) return false;
      if (pillar !== "all" && !pillarMatches(it, pillar)) return false;
      return true;
    });
  }, [items, platform, pillar]);

  const openSlotFor = (id: string) => {
    const s = defaultSlot();
    const it = items.find((x) => x.id === id);
    setActiveId(id);
    setDate(s.date);
    setTime(s.time);
    setEditedBody(it?.body ?? "");
    setAttachedImage(null);
    setLinkUrl("");
  };

  const resetEdit = () => {
    setActiveId(null);
    setEditedBody("");
    setAttachedImage(null);
    setLinkUrl("");
  };

  async function handleUpload(file: File | undefined) {
    if (!file || !userId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max 10MB" });
      return;
    }
    if (!/^image\/(jpe?g|png|gif|webp)$/.test(file.type)) {
      toast.error("Unsupported file", { description: "Use JPG, PNG, GIF, or WebP" });
      return;
    }
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("social-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("social-assets").getPublicUrl(path);
      await supabase.from("assets").insert({
        user_id: userId,
        url: pub.publicUrl,
        filename: file.name,
        file_type: file.type,
        file_size_kb: Math.round(file.size / 1024),
        uploaded_at: new Date().toISOString(),
      });
      setAttachedImage(pub.publicUrl);
      toast.success("Image attached");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't upload image");
    }
  }

  const handleConfirm = async (item: ContentItem) => {
    if (!userId || !date || !time) return;
    const iso = new Date(`${date}T${time}:00`).toISOString();
    setSaving(true);
    const plat = normPlat(item.platform);
    const targetPlatform = plat === "other" ? "linkedin" : plat;
    const matchedPillar = pillars.find((p) => pillarMatches(item, p)) ?? null;
    const trimmedUrl = linkUrl.trim();
    const finalBody = (editedBody || "") + (trimmedUrl ? `\n\n${trimmedUrl}` : "");
    const media = attachedImage ? [attachedImage] : [];
    const { error } = await supabase.from("social_posts").insert({
      user_id: userId,
      platforms: [targetPlatform],
      content_by_platform: { [targetPlatform]: finalBody },
      pillar: matchedPillar,
      topic: item.topic,
      status: "scheduled",
      scheduled_for: iso,
      media_urls: media,
      image_urls: media,
    });
    if (!error) {
      // Mark the draft as scheduled (don't delete it).
      await supabase
        .from("content_items")
        .update({ status: "scheduled", scheduled_for: iso, body: finalBody })
        .eq("id", item.id);
    }
    setSaving(false);
    if (error) {
      toast.error("Couldn't schedule", { description: error.message });
      return;
    }
    toast.success("Scheduled to calendar");
    onScheduled();
    onOpenChange(false);
    resetEdit();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="text-base">Import from drafts</SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="space-y-2 border-b border-border p-4">
          <div className="flex flex-wrap gap-1">
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs capitalize transition-colors",
                  platform === p ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setPillar("all")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                pillar === "all" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              All pillars
            </button>
            {pillars.map((p) => (
              <button
                key={p}
                onClick={() => setPillar(p)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs transition-colors",
                  pillar === p ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No content matches these filters.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((it) => {
                const matchedPillar = pillars.find((p) => pillarMatches(it, p));
                const isActive = activeId === it.id;
                return (
                  <li key={it.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center gap-2">
                      {platformIcon(it.platform)}
                      <span className="text-xs font-medium capitalize text-foreground">
                        {it.platform ?? "content"}
                      </span>
                      {matchedPillar && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">{matchedPillar}</Badge>
                      )}
                    </div>
                    <p className="mb-3 text-sm leading-snug text-foreground">{preview(it.body)}</p>
                    {!isActive ? (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => openSlotFor(it.id)}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> Schedule this
                      </Button>
                    ) : (
                      <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Edit content
                          </label>
                          <Textarea
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            rows={5}
                            className="text-xs"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Add image
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                void handleUpload(e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Upload
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => setLibraryOpen(true)}
                            >
                              <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> From library
                            </Button>
                            {attachedImage && (
                              <div className="ml-auto flex items-center gap-1.5 rounded border border-border bg-background px-1.5 py-1">
                                <img src={attachedImage} alt="" className="h-6 w-6 rounded object-cover" />
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={() => setAttachedImage(null)}
                                  aria-label="Remove image"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> Link to include</span>
                          </label>
                          <Input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://…"
                            className="h-8 text-xs"
                          />
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Paste any URL — MOXIEMO will append it to your post.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs" />
                          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-8 w-28 text-xs" />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={resetEdit}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                            disabled={saving}
                            onClick={() => handleConfirm(it)}
                          >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
      <LibraryAssetsDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        userId={userId}
        onSelect={(url) => setAttachedImage(url)}
      />
    </Sheet>
  );
}