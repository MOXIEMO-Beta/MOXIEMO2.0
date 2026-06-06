import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Linkedin, Facebook, Instagram, FileText, Loader2, X, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    setActiveId(id);
    setDate(s.date);
    setTime(s.time);
  };

  const handleConfirm = async (item: ContentItem) => {
    if (!userId || !date || !time) return;
    const iso = new Date(`${date}T${time}:00`).toISOString();
    setSaving(true);
    const plat = normPlat(item.platform);
    const targetPlatform = plat === "other" ? "linkedin" : plat;
    const matchedPillar = pillars.find((p) => pillarMatches(item, p)) ?? null;
    const { error } = await supabase.from("social_posts").insert({
      user_id: userId,
      platforms: [targetPlatform],
      content_by_platform: { [targetPlatform]: item.body ?? "" },
      pillar: matchedPillar,
      topic: item.topic,
      status: "scheduled",
      scheduled_for: iso,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't schedule", { description: error.message });
      return;
    }
    toast.success("Scheduled to calendar");
    onScheduled();
    onOpenChange(false);
    setActiveId(null);
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
                      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2.5">
                        <div className="flex gap-2">
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs" />
                          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-8 w-28 text-xs" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setActiveId(null)}>
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
    </Sheet>
  );
}