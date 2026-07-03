import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Linkedin,
  Facebook,
  Instagram,
  X,
  Clock,
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  Send,
  Pencil,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { usePlan } from "@/hooks/usePlan";
import { canPublishOn } from "@/lib/planConfig";
import { PublishLockBadge } from "@/components/PublishLockBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ImportFromContentDrawer from "./ImportFromContentDrawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Platform = "linkedin" | "facebook" | "instagram";
type Status = "draft" | "queued" | "scheduled" | "published";

type SocialPost = {
  id: string;
  user_id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  pillar: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
};

type ViewMode = "month" | "week" | "list";

type Props = {
  userId: string | null;
  onEditPost: (postId: string) => void;
  onCreateAtDate: (dateIso: string, pillar?: string) => void;
  onImportFromContent: () => void;
  onCreateForPillar?: (args: {
    pillar: string;
    platform: Platform;
    monthLabel: string;
  }) => void;
};

const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: "#0A66C2",
  facebook: "#1A2A6C",
  instagram: "#A93AAF",
};

const STATUSES: { key: Status; label: string }[] = [
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "queued", label: "Queued" },
];

const PILLAR_COLORS = ["#ff6b6b", "#4f9df7", "#7c5cff", "#22c55e", "#f59e0b", "#ec4899"];

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const obj = x as Record<string, unknown>;
        return (obj.name as string) || (obj.title as string) || (obj.label as string) || "";
      }
      return "";
    })
    .filter(Boolean);
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function sameDay(a: Date, b: Date): boolean {
  return ymd(a) === ymd(b);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfWeekSun(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function buildMonthGrid(monthDate: Date): Date[] {
  const start = startOfMonth(monthDate);
  const gridStart = startOfWeekSun(start);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function fmtDateLong(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function postDate(p: SocialPost): Date | null {
  const iso = p.scheduled_for ?? p.published_at ?? null;
  return iso ? new Date(iso) : null;
}
function firstCopy(p: SocialPost, max = 30): string {
  const c = p.content_by_platform || {};
  const txt = Object.values(c).find((v) => typeof v === "string" && v.trim().length > 0) ?? "";
  const flat = String(txt).replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max) + "…" : flat || "(empty)";
}
function statusOf(p: SocialPost): Status {
  const s = (p.status || "draft").toLowerCase();
  if (s === "scheduled" || s === "published" || s === "queued" || s === "draft") return s;
  return "draft";
}

function PlatformIcon({ p, size = 12 }: { p: Platform; size?: number }) {
  const cls = "shrink-0";
  if (p === "linkedin") return <Linkedin className={cls} size={size} color={PLATFORM_COLORS.linkedin} />;
  if (p === "facebook") return <Facebook className={cls} size={size} color={PLATFORM_COLORS.facebook} />;
  return <Instagram className={cls} size={size} color={PLATFORM_COLORS.instagram} />;
}
function PlatformDot({ p }: { p: Platform }) {
  return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] }} />;
}

function StatusBadge({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    draft: "bg-muted text-muted-foreground",
    queued: "bg-blue-100 text-blue-700",
    scheduled: "bg-[#fff0f0] text-[#c43d3d]",
    published: "bg-emerald-100 text-emerald-700",
  };
  return <Badge className={cn("border-transparent capitalize", map[s])}>{s}</Badge>;
}

function bestTimeFor(date: Date): string | null {
  const dow = date.getDay(); // 0=Sun
  // LinkedIn Mon-Thu, Instagram Tue-Fri — show generic best slot
  if (dow >= 1 && dow <= 4) return "8:30 AM"; // LinkedIn window
  if (dow >= 2 && dow <= 5) return "11:00 AM"; // IG window (also covers Fri)
  return null;
}

/* ============================================================ */
export default function CalendarTab({ userId, onEditPost, onCreateAtDate, onImportFromContent, onCreateForPillar }: Props) {
  const { plan } = usePlan();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const openImport = () => {
    setImportOpen(true);
    // keep parent callback firing in case it wants to track usage
    try { onImportFromContent?.(); } catch { /* noop */ }
  };

  const [view, setView] = useState<ViewMode>(() => {
    const v = localStorage.getItem("social_calendar_view");
    return v === "week" || v === "list" ? (v as ViewMode) : "month";
  });
  useEffect(() => localStorage.setItem("social_calendar_view", view), [view]);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [weekCursor, setWeekCursor] = useState<Date>(() => startOfWeekSun(new Date()));

  // filters
  const [platformFilter, setPlatformFilter] = useState<Record<Platform, boolean>>({
    linkedin: true,
    facebook: true,
    instagram: true,
  });
  const [statusFilter, setStatusFilter] = useState<Record<Status, boolean>>({
    scheduled: true,
    published: true,
    draft: true,
    queued: true,
  });
  const [pillarFilter, setPillarFilter] = useState<Record<string, boolean>>({});

  // day side panel
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [rescheduleForId, setRescheduleForId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // drag and drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const undoRef = useRef<{ id: string; prev: string | null } | null>(null);

  // scroll to specific date in main calendar
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* fetch */
  const fetchPosts = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("social_posts")
      .select("id, user_id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, created_at")
      .eq("user_id", userId);
    if (error) {
      console.error(error);
      return;
    }
    setPosts((data as unknown as SocialPost[]) ?? []);
  };

  const fetchStrategy = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("strategies")
      .select("content_pillars")
      .eq("user_id", userId)
      .maybeSingle();
    const list = asArray((data as { content_pillars?: unknown } | null)?.content_pillars);
    setPillars(list);
    setPillarFilter((prev) => {
      const next: Record<string, boolean> = { ...prev };
      list.forEach((p) => {
        if (!(p in next)) next[p] = true;
      });
      return next;
    });
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchPosts(), fetchStrategy()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* realtime */
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("social_posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_posts", filter: `user_id=eq.${userId}` },
        () => fetchPosts(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* filtered posts */
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const s = statusOf(p);
      if (!statusFilter[s]) return false;
      const plats = (p.platforms ?? []).map((x) => x as Platform);
      if (plats.length > 0 && !plats.some((pl) => platformFilter[pl])) return false;
      if (p.pillar && pillars.length > 0 && pillarFilter[p.pillar] === false) return false;
      return true;
    });
  }, [posts, statusFilter, platformFilter, pillarFilter, pillars]);

  /* posts by day-key for the month grid */
  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    filteredPosts.forEach((p) => {
      const d = postDate(p);
      if (!d) return;
      const key = ymd(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    map.forEach((arr) =>
      arr.sort((a, b) => (postDate(a)?.getTime() ?? 0) - (postDate(b)?.getTime() ?? 0)),
    );
    return map;
  }, [filteredPosts]);

  const monthGrid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  /* stats */
  const monthStats = useMemo(() => {
    const inMonth = (d: Date) => d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
    let scheduled = 0;
    let published = 0;
    const weeksWithContent = new Set<number>();
    filteredPosts.forEach((p) => {
      const d = postDate(p);
      if (!d || !inMonth(d)) return;
      if (statusOf(p) === "scheduled" || statusOf(p) === "queued") scheduled += 1;
      if (statusOf(p) === "published") published += 1;
      const week = Math.floor((d.getDate() - 1) / 7);
      weeksWithContent.add(week);
    });
    return { scheduled, published, coverage: weeksWithContent.size };
  }, [filteredPosts, cursor]);

  /* pillar coverage for current month */
  const pillarCoverage = useMemo(() => {
    const inMonth = (d: Date) => d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
    const counts = new Map<string, number>();
    pillars.forEach((p) => counts.set(p, 0));
    filteredPosts.forEach((p) => {
      const d = postDate(p);
      if (!d || !inMonth(d) || !p.pillar) return;
      counts.set(p.pillar, (counts.get(p.pillar) ?? 0) + 1);
    });
    const max = Math.max(1, ...Array.from(counts.values()));
    return Array.from(counts.entries()).map(([name, count], i) => ({
      name,
      count,
      pct: Math.round((count / max) * 100),
      color: PILLAR_COLORS[i % PILLAR_COLORS.length],
    }));
  }, [pillars, filteredPosts, cursor]);

  /* drag-drop */
  const onDragStart = (e: DragEvent<HTMLDivElement>, p: SocialPost) => {
    setDraggingId(p.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", p.id);
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverDay(null);
  };
  const onDragOverDay = (e: DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    setDragOverDay(dayKey);
  };
  const handleDropOnDay = async (e: DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const prevIso = post.scheduled_for;
    const prev = prevIso ? new Date(prevIso) : new Date();
    const next = new Date(day);
    next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
    const nextIso = next.toISOString();
    if (prevIso === nextIso) return;
    undoRef.current = { id, prev: prevIso };
    // optimistic
    setPosts((arr) => arr.map((p) => (p.id === id ? { ...p, scheduled_for: nextIso, status: "scheduled" } : p)));
    const { error } = await supabase
      .from("social_posts")
      .update({ scheduled_for: nextIso, status: "scheduled" })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't reschedule");
      setPosts((arr) => arr.map((p) => (p.id === id ? { ...p, scheduled_for: prevIso } : p)));
      return;
    }
    toast.success(`Rescheduled to ${fmtDateLong(next)}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const u = undoRef.current;
          if (!u || u.id !== id) return;
          await supabase.from("social_posts").update({ scheduled_for: u.prev }).eq("id", id);
          setPosts((arr) => arr.map((p) => (p.id === id ? { ...p, scheduled_for: u.prev } : p)));
        },
      },
    });
  };

  /* side panel actions */
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSidePanelOpen(true);
    setRescheduleForId(null);
  };
  const closePanel = () => {
    setSidePanelOpen(false);
    setRescheduleForId(null);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setActionLoading("delete");
    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    setActionLoading(null);
    if (error) {
      toast.error("Couldn't delete");
      return;
    }
    toast.success("Post deleted");
    setPosts((arr) => arr.filter((p) => p.id !== id));
  };
  const handlePublishNow = async (post: SocialPost) => {
    if (!userId) return;
    const platform = (post.platforms ?? [])[0];
    const content = (post.content_by_platform ?? {})[platform ?? ""];
    if (!platform || !content) {
      toast.error("No content/platform to publish");
      return;
    }
    setActionLoading("publish");
    const { data, error } = await supabase.functions.invoke("publish-social-post", {
      body: { user_id: userId, post_id: post.id, platform, content },
    });
    setActionLoading(null);
    const errCode = (data as { error?: string })?.error;
    if (errCode === "multiple_destinations_available") {
      toast.error("Multiple LinkedIn destinations", {
        description: "Publish from the Social Queue to pick a destination.",
      });
      return;
    }
    if (error || errCode) {
      toast.error("Publish failed", { description: error?.message ?? errCode });
      return;
    }
    toast.success("Published");
    fetchPosts();
  };
  const handleReschedule = async () => {
    if (!rescheduleForId || !rescheduleDate || !rescheduleTime) return;
    const iso = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
    setActionLoading("reschedule");
    const { error } = await supabase
      .from("social_posts")
      .update({ scheduled_for: iso, status: "scheduled" })
      .eq("id", rescheduleForId);
    setActionLoading(null);
    if (error) {
      toast.error("Couldn't reschedule");
      return;
    }
    toast.success("Rescheduled");
    setRescheduleForId(null);
    fetchPosts();
  };

  const openReschedule = (p: SocialPost) => {
    setRescheduleForId(p.id);
    const d = postDate(p) ?? new Date();
    setRescheduleDate(ymd(d));
    setRescheduleTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  };
  // Clicking a post chip opens the same day panel as clicking the day cell.
  const handleSelectPost = (p: SocialPost) => {
    const d = postDate(p) ?? new Date();
    handleDayClick(d);
  };

  const dayPosts = useMemo(() => {
    if (!selectedDate) return [] as SocialPost[];
    const key = ymd(selectedDate);
    return posts
      .filter((p) => {
        const sk = p.scheduled_for ? ymd(new Date(p.scheduled_for)) : null;
        const pk = p.published_at ? ymd(new Date(p.published_at)) : null;
        return sk === key || pk === key;
      })
      .sort((a, b) => (postDate(a)?.getTime() ?? 0) - (postDate(b)?.getTime() ?? 0));
  }, [selectedDate, posts]);

  /* mini calendar nav */
  const scrollToDay = (key: string) => {
    const el = dayRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* render */
  const totalAll = posts.length;
  const noContent = !loading && totalAll === 0;

  const activeFilterCount = useMemo(() => {
    let n = 0;
    (["linkedin","facebook","instagram"] as Platform[]).forEach((p) => { if (!platformFilter[p]) n++; });
    STATUSES.forEach((s) => { if (!statusFilter[s.key]) n++; });
    pillars.forEach((p) => { if (pillarFilter[p] === false) n++; });
    return n;
  }, [platformFilter, statusFilter, pillarFilter, pillars]);

  // Coverage state — threshold-based (calm early month, escalate later)
  const coverage = useMemo(() => {
    const now = new Date();
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() === m;
    const daysElapsed = isCurrentMonth ? now.getDate() : (now > new Date(y, m + 1, 0) ? daysInMonth : 1);
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    const progress = daysElapsed / daysInMonth;
    const inMonth = (d: Date) => d.getMonth() === m && d.getFullYear() === y;
    const counts = new Map<string, number>();
    pillars.forEach((p) => counts.set(p, 0));
    filteredPosts.forEach((p) => {
      const d = postDate(p);
      if (!d || !inMonth(d) || !p.pillar) return;
      counts.set(p.pillar, (counts.get(p.pillar) ?? 0) + 1);
    });
    const chips = pillars.map((name, i) => {
      const postCount = counts.get(name) ?? 0;
      let state: "active" | "calm" | "amber" | "coral" = "calm";
      if (postCount > 0) state = "active";
      else if (progress < 0.35) state = "calm";
      else if (progress < 0.7) state = "amber";
      else state = "coral";
      return { name, postCount, state, color: PILLAR_COLORS[i % PILLAR_COLORS.length] };
    });
    return { chips, daysElapsed, daysRemaining, isCurrentMonth };
  }, [pillars, filteredPosts, cursor]);

  return (
    <div className="flex flex-col gap-6">
      {/* MAIN */}
      <div className="flex-1 space-y-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (view === "week" ? setWeekCursor((d) => addDays(d, -7)) : setCursor((d) => addMonths(d, -1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[160px] text-center text-base font-semibold text-foreground">
              {view === "week"
                ? `${fmtDateLong(weekCursor)} – ${fmtDateLong(addDays(weekCursor, 6))}`
                : fmtMonth(cursor)}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (view === "week" ? setWeekCursor((d) => addDays(d, 7)) : setCursor((d) => addMonths(d, 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontSize: 12, fontWeight: 500, padding: "6px 12px",
                    borderRadius: 20, border: "0.5px solid #ECEAE5",
                    color: "#6B6860", background: "#F7F5F1", cursor: "pointer",
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{
                      background: "#E85A46", color: "#fff", fontSize: 10, fontWeight: 700,
                      borderRadius: 10, width: 16, height: 16,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      marginLeft: 2,
                    }}>{activeFilterCount}</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Platforms</p>
                  {(["linkedin", "facebook", "instagram"] as Platform[]).map((p) => (
                    <label key={p} className="flex cursor-pointer items-center gap-2 text-xs">
                      <Checkbox checked={platformFilter[p]}
                        onCheckedChange={(v) => setPlatformFilter((s) => ({ ...s, [p]: !!v }))} />
                      <PlatformIcon p={p} size={13} />
                      <span className="capitalize">{p}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Status</p>
                  {STATUSES.map((s) => (
                    <label key={s.key} className="flex cursor-pointer items-center gap-2 text-xs">
                      <Checkbox checked={statusFilter[s.key]}
                        onCheckedChange={(v) => setStatusFilter((x) => ({ ...x, [s.key]: !!v }))} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
                {pillars.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Pillars</p>
                    {pillars.map((p, i) => (
                      <label key={p} className="flex cursor-pointer items-center gap-2 text-xs">
                        <Checkbox checked={pillarFilter[p] ?? true}
                          onCheckedChange={(v) => setPillarFilter((s) => ({ ...s, [p]: !!v }))} />
                        <span className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: PILLAR_COLORS[i % PILLAR_COLORS.length] }} />
                        <span className="truncate">{p}</span>
                      </label>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <div className="flex rounded-md border border-border p-0.5">
              {(["month", "week", "list"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded px-3 py-1 text-xs capitalize transition-colors",
                    view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={openImport}>
              Import from drafts
            </Button>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onCreateAtDate(new Date().toISOString())}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New Post
            </Button>
          </div>
        </div>

        {noContent && view === "month" && pillarCoverage.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">
              Your strategy has identified these content pillars. Start scheduling to build consistent coverage.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90"
                onClick={() => onCreateAtDate(new Date().toISOString())}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Create new post
              </Button>
              <Button size="sm" variant="outline" onClick={openImport}>
                Import from drafts
              </Button>
            </div>
            <Card className="space-y-3 p-4">
              <p className="text-sm font-semibold text-foreground">Content Pillar Coverage — {fmtMonth(cursor)}</p>
              <div className="space-y-2">
                {pillarCoverage.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 text-xs">
                    <span className="w-56 shrink-0 truncate text-foreground">{c.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-muted-foreground">{c.count} posts</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {view === "month" ? (
          <MonthGrid
            cursor={cursor}
            grid={monthGrid}
            postsByDay={postsByDay}
            dayRefs={dayRefs}
            onSelectPost={handleSelectPost}
            onDayClick={handleDayClick}
            onAddAtDate={(d) => onCreateAtDate(d.toISOString())}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverDay={onDragOverDay}
            handleDropOnDay={handleDropOnDay}
            dragOverDay={dragOverDay}
          />
        ) : view === "week" ? (
          <WeekView
            weekCursor={weekCursor}
            posts={filteredPosts}
            onSelectPost={handleSelectPost}
            onAddAtDate={(d) => onCreateAtDate(d.toISOString())}
          />
        ) : (
          <ListView posts={filteredPosts} onSelectPost={handleSelectPost} />
        )}

        {/* Strategy coverage panel */}
        {!noContent && view === "month" && pillarCoverage.length > 0 && (
          <Card className="space-y-3 p-4">
            <p className="text-sm font-semibold text-foreground">Content Pillar Coverage — {fmtMonth(cursor)}</p>
            <div className="space-y-2">
              {pillarCoverage.map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-xs">
                  <span className="w-56 shrink-0 truncate text-foreground">{c.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-muted-foreground">{c.count} posts</span>
                </div>
              ))}
            </div>
            {pillarCoverage.some((c) => c.count < 2) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1 space-y-1">
                  {pillarCoverage
                    .filter((c) => c.count < 2)
                    .map((c) => (
                      <div key={c.name} className="flex items-center justify-between gap-2">
                        <span>"{c.name}" is underrepresented this month.</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-[#ff6b6b]/40 px-2.5 py-1 text-[11px] font-medium text-[#c43d3d] transition-colors hover:bg-[#ff6b6b]/10"
                          onClick={() => {
                            // Count this-month posts per platform for this pillar
                            const inMonth = (d: Date) =>
                              d.getMonth() === cursor.getMonth() &&
                              d.getFullYear() === cursor.getFullYear();
                            const counts: Record<Platform, number> = {
                              linkedin: 0,
                              facebook: 0,
                              instagram: 0,
                            };
                            posts.forEach((p) => {
                              if (p.pillar !== c.name) return;
                              const d = postDate(p);
                              if (!d || !inMonth(d)) return;
                              (p.platforms ?? []).forEach((pl) => {
                                if (pl === "linkedin" || pl === "facebook" || pl === "instagram") {
                                  counts[pl] += 1;
                                }
                              });
                            });
                            const order: Platform[] = ["linkedin", "facebook", "instagram"];
                            let lowest: Platform = "linkedin";
                            let min = Infinity;
                            for (const pl of order) {
                              if (counts[pl] < min) {
                                min = counts[pl];
                                lowest = pl;
                              }
                            }
                            const monthLabel = cursor.toLocaleDateString(undefined, { month: "long" });
                            if (onCreateForPillar) {
                              onCreateForPillar({ pillar: c.name, platform: lowest, monthLabel });
                            } else {
                              onCreateAtDate(new Date().toISOString(), c.name);
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" /> Create a post for this pillar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* SIDE PANEL — day view */}
      {sidePanelOpen && selectedDate && (
        <div className="fixed inset-0 z-40" onClick={closePanel}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute right-0 top-0 flex h-full w-[320px] flex-col border-l border-border bg-background shadow-xl transition-transform duration-[250ms] ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <button onClick={closePanel} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-b border-border p-3">
              <Button
                size="sm"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => onCreateAtDate(selectedDate.toISOString())}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add post for this day
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
              {dayPosts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">No posts scheduled for this day</p>
                  <p>Click + Add post to create one</p>
                </div>
              ) : (
                dayPosts.map((p) => {
                  const d = postDate(p);
                  const s = statusOf(p);
                  return (
                    <div
                      key={p.id}
                      className="space-y-2 rounded-md border border-border p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {(p.platforms ?? []).slice(0, 1).map((pl) => (
                            <PlatformDot key={pl} p={pl as Platform} />
                          ))}
                          <span className="text-xs capitalize text-foreground">
                            {(p.platforms ?? [])[0] ?? "—"}
                          </span>
                        </div>
                        <StatusBadge s={s} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        {d && <span>{fmtTime(d)}</span>}
                        {p.pillar && (
                          <Badge className="bg-[#fff0f0] text-[#c43d3d] hover:bg-[#fff0f0]">{p.pillar}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground">{firstCopy(p, 80)}</p>

                      {rescheduleForId === p.id && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
                          <p className="text-[11px] font-medium">New date & time</p>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                            />
                            <Input
                              type="time"
                              value={rescheduleTime}
                              onChange={(e) => setRescheduleTime(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setRescheduleForId(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleReschedule}
                              disabled={actionLoading === "reschedule"}
                            >
                              {actionLoading === "reschedule" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => onEditPost(p.id)}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openReschedule(p)}>
                          <CalendarIcon className="mr-1 h-3 w-3" /> Reschedule
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}>
                          {actionLoading === "delete" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </>
                          )}
                        </Button>
                      </div>
                      {(s === "scheduled" || s === "queued") && (
                        (() => {
                          const platform = (p.platforms ?? [])[0];
                          const locked = platform && !canPublishOn(plan, platform);
                          if (locked) {
                            return <PublishLockBadge platform={platform} className="w-full justify-center" />;
                          }
                          return (
                            <Button
                              size="sm"
                              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={() => handlePublishNow(p)}
                              disabled={actionLoading === "publish"}
                            >
                              {actionLoading === "publish" ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3 w-3" />
                              )}
                              Publish now
                            </Button>
                          );
                        })()
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      <ImportFromContentDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
        userId={userId}
        pillars={pillars}
        onScheduled={fetchPosts}
      />
    </div>
  );
}

/* ---------------- Mini month ---------------- */
function MiniMonth({
  cursor,
  setCursor,
  postsByDay,
  onPickDay,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  postsByDay: Map<string, SocialPost[]>;
  onPickDay: (d: Date) => void;
}) {
  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const today = new Date();
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setCursor(addMonths(cursor, -1))} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-semibold">{fmtMonth(cursor)}</p>
        <button onClick={() => setCursor(addMonths(cursor, 1))} className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {grid.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const has = (postsByDay.get(ymd(d))?.length ?? 0) > 0;
          const isToday = sameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className={cn(
                "relative aspect-square rounded text-[10px] transition-colors",
                !inMonth && "text-muted-foreground/40",
                inMonth && !has && "hover:bg-muted",
                has && "bg-[#fff0f0] text-[#c43d3d] font-medium hover:bg-[#ffe0e0]",
              )}
            >
              {d.getDate()}
              {isToday && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#ff6b6b]" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- Month grid ---------------- */
function MonthGrid({
  cursor,
  grid,
  postsByDay,
  dayRefs,
  onSelectPost,
  onDayClick,
  onAddAtDate,
  onDragStart,
  onDragEnd,
  onDragOverDay,
  handleDropOnDay,
  dragOverDay,
}: {
  cursor: Date;
  grid: Date[];
  postsByDay: Map<string, SocialPost[]>;
  dayRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onSelectPost: (p: SocialPost) => void;
  onDayClick: (d: Date) => void;
  onAddAtDate: (d: Date) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, p: SocialPost) => void;
  onDragEnd: () => void;
  onDragOverDay: (e: DragEvent<HTMLDivElement>, key: string) => void;
  handleDropOnDay: (e: DragEvent<HTMLDivElement>, day: Date) => void;
  dragOverDay: string | null;
}) {
  const today = new Date();
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-[10px] font-medium uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((d) => {
          const key = ymd(d);
          const dayPosts = postsByDay.get(key) ?? [];
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameDay(d, today);
          const best = bestTimeFor(d);
          const isDragOver = dragOverDay === key;
          const visible = dayPosts.slice(0, dayPosts.length > 3 ? 2 : 3);
          const overflow = dayPosts.length - visible.length;
          return (
            <div
              key={key}
              ref={(el) => (dayRefs.current[key] = el)}
              onClick={() => onDayClick(d)}
              onDragOver={(e) => onDragOverDay(e, key)}
              onDragLeave={() => null}
              onDrop={(e) => handleDropOnDay(e, d)}
              className={cn(
                "group relative min-h-[110px] cursor-pointer border-b border-r border-border p-1.5 text-xs hover:bg-muted/30",
                !inMonth && "bg-muted/20 text-muted-foreground/50",
                isDragOver && "ring-2 ring-inset ring-[#ff6b6b]",
              )}
            >
              <div className="mb-1 flex items-start justify-between">
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px]",
                    isToday && "bg-[#ff6b6b] text-white font-semibold",
                  )}
                >
                  {d.getDate()}
                </span>
                {best && inMonth && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const m = best.match(/(\d+):(\d+)\s*(AM|PM)/i);
                            const next = new Date(d);
                            if (m) {
                              let h = parseInt(m[1], 10);
                              const min = parseInt(m[2], 10);
                              const isPm = m[3].toUpperCase() === "PM";
                              if (isPm && h !== 12) h += 12;
                              if (!isPm && h === 12) h = 0;
                              next.setHours(h, min, 0, 0);
                            } else {
                              next.setHours(9, 0, 0, 0);
                            }
                            onAddAtDate(next);
                          }}
                          className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-[#ff6b6b]/10 hover:text-[#c43d3d]"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          {best}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Click to schedule content at this time.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="space-y-1">
                {visible.map((p) => (
                  <PostChip
                    key={p.id}
                    post={p}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPost(p);
                    }}
                    onDragStart={(e) => onDragStart(e, p)}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    className="block w-full text-left text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPost(dayPosts[2]);
                    }}
                  >
                    + {overflow} more
                  </button>
                )}
              </div>
              {inMonth && dayPosts.length === 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAtDate(d);
                  }}
                  className="absolute bottom-1 right-1 hidden items-center gap-0.5 rounded border border-dashed border-border px-1.5 py-0.5 text-[9px] text-muted-foreground hover:border-[#ff6b6b] hover:text-[#ff6b6b] group-hover:flex"
                >
                  <Plus className="h-2.5 w-2.5" /> Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PostChip({
  post,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  post: SocialPost;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const s = statusOf(post);
  const styles: Record<Status, string> = {
    draft: "bg-white border border-dashed border-border text-foreground",
    queued: "bg-blue-50 border border-blue-200 text-blue-900",
    scheduled: "bg-[#fff0f0] border border-[#ffb8b8] text-[#7a2424]",
    published: "bg-emerald-50 border border-emerald-200 text-emerald-900",
  };
  const plats = (post.platforms ?? []).filter((p) =>
    ["linkedin", "facebook", "instagram"].includes(p),
  ) as Platform[];
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "flex h-[22px] w-full cursor-pointer items-center gap-1 truncate rounded-full px-1.5 text-[10px]",
        styles[s],
      )}
      title={firstCopy(post, 200)}
    >
      <div className="flex shrink-0 items-center gap-0.5">
        {plats.length > 0 ? plats.map((p) => <PlatformDot key={p} p={p} />) : <PlatformDot p="linkedin" />}
      </div>
      <span className="truncate">{firstCopy(post, 30)}</span>
    </div>
  );
}

/* ---------------- Week view ---------------- */
function WeekView({
  weekCursor,
  posts,
  onSelectPost,
  onAddAtDate,
}: {
  weekCursor: Date;
  posts: SocialPost[];
  onSelectPost: (p: SocialPost) => void;
  onAddAtDate: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekCursor, i));
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
  const inDay = (p: SocialPost, d: Date) => {
    const pd = postDate(p);
    return pd ? sameDay(pd, d) : false;
  };
  const unscheduled = posts.filter(
    (p) => !p.scheduled_for && !p.published_at && (statusOf(p) === "draft" || statusOf(p) === "queued"),
  );

  return (
    <Card className="overflow-hidden">
      {unscheduled.length > 0 && (
        <div className="border-b border-border bg-muted/30 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Unscheduled</p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPost(p)}
                className="rounded-full border border-dashed border-border bg-white px-2 py-0.5 text-[10px] hover:border-[#ff6b6b]"
              >
                {firstCopy(p, 30)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className="border-b border-l border-border px-2 py-1.5 text-xs">
            <p className="font-medium">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
            <p className="text-muted-foreground">{d.getDate()}</p>
          </div>
        ))}
        {hours.map((h) => (
          <Fragment key={h}>
            <div className="border-b border-border p-1 text-right text-[10px] text-muted-foreground">
              {h % 12 || 12} {h < 12 ? "am" : "pm"}
            </div>
            {days.map((d) => {
              const slotPosts = posts.filter((p) => {
                if (!inDay(p, d)) return false;
                const pd = postDate(p)!;
                return pd.getHours() === h;
              });
              const slotDate = new Date(d);
              slotDate.setHours(h, 0, 0, 0);
              return (
                <div
                  key={`${h}-${d.toISOString()}`}
                  className="group relative min-h-[60px] border-b border-l border-border p-1"
                >
                  {slotPosts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPost(p)}
                      className="mb-1 block w-full rounded border border-[#ffb8b8] bg-[#fff0f0] p-1 text-left text-[10px]"
                    >
                      <div className="flex items-center gap-1">
                        {(p.platforms ?? []).map((pl) => (
                          <PlatformDot key={pl} p={pl as Platform} />
                        ))}
                        <StatusBadge s={statusOf(p)} />
                      </div>
                      <p className="mt-0.5 truncate">{firstCopy(p, 60)}</p>
                      <p className="text-muted-foreground">{fmtTime(postDate(p)!)}</p>
                    </button>
                  ))}
                  {slotPosts.length === 0 && (
                    <button
                      type="button"
                      onClick={() => onAddAtDate(slotDate)}
                      className="hidden h-full w-full items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground hover:border-[#ff6b6b] hover:text-[#ff6b6b] group-hover:flex"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- List view ---------------- */
function ListView({ posts, onSelectPost }: { posts: SocialPost[]; onSelectPost: (p: SocialPost) => void }) {
  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const ad = postDate(a)?.getTime() ?? new Date(a.created_at).getTime();
        const bd = postDate(b)?.getTime() ?? new Date(b.created_at).getTime();
        return bd - ad;
      }),
    [posts],
  );
  const groups = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    sorted.forEach((p) => {
      const d = postDate(p) ?? new Date(p.created_at);
      const ws = startOfWeekSun(d);
      const key = ymd(ws);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">No posts match the current filters.</Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([weekKey, weekPosts]) => (
        <div key={weekKey} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Week of {fmtDateLong(new Date(weekKey))}
          </p>
          <Card className="divide-y divide-border">
            {weekPosts.map((p) => {
              const d = postDate(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPost(p)}
                  className="flex w-full items-start gap-3 p-3 text-left text-sm hover:bg-muted/40"
                >
                  <div className="w-28 shrink-0 text-xs text-muted-foreground">
                    {d ? `${fmtDateLong(d)} · ${fmtTime(d)}` : "Unscheduled"}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {(p.platforms ?? []).map((pl) => (
                      <PlatformIcon key={pl} p={pl as Platform} size={13} />
                    ))}
                  </div>
                  {p.pillar && (
                    <Badge className="shrink-0 bg-[#fff0f0] text-[#c43d3d] hover:bg-[#fff0f0]">{p.pillar}</Badge>
                  )}
                  <p className="flex-1 truncate text-foreground">{firstCopy(p, 100)}</p>
                  <StatusBadge s={statusOf(p)} />
                </button>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Empty ---------------- */
function EmptyCalendar({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <CalendarIcon className="h-10 w-10 text-[#ff6b6b]" />
      <h3 className="text-lg font-semibold text-foreground">Your content calendar is empty</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Schedule your first post to start building a consistent presence.
      </p>
      <div className="mt-2 flex gap-2">
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onCreate}>
          <Plus className="mr-1 h-4 w-4" /> Create your first post
        </Button>
        <Button variant="outline" onClick={onImport}>
          Import from drafts
        </Button>
      </div>
    </Card>
  );
}

/* ---- Tiny Fragment shim to avoid extra import ---- */
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}