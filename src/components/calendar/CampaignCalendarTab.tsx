import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Copy, Save, Calendar as CalendarIcon, Send, RefreshCw } from "lucide-react";
import { startOfWeek, addDays, sameDay, ymd } from "./helpers";
import { cn } from "@/lib/utils";

// Day-of-week index: Sun=0, Mon=1, ..., Sat=6
const TASK_DAY_DOW: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function platformKey(p: string | undefined | null): string {
  const s = (p || "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("email") || s.includes("newsletter")) return "email";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("facebook")) return "facebook";
  if (s.includes("twitter") || s === "x" || s.startsWith("x/") || s.startsWith("x ")) return "x";
  return "default";
}

// Content category for action-set selection.
type ContentCategory = "social" | "email" | "doc";
function contentCategoryFor(platform: string | undefined | null): ContentCategory {
  const s = (platform || "").toLowerCase();
  if (/linkedin|instagram|facebook|twitter|^x$|x\/|x /.test(s)) return "social";
  if (/email|newsletter/.test(s)) return "email";
  if (/script|show notes|blog|article|podcast/.test(s)) return "doc";
  return "social";
}

const PLATFORM_STYLE: Record<string, { color: string; label: string }> = {
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  email:    { color: "#E85A46", label: "Email" },
  instagram:{ color: "#C13584", label: "Instagram" },
  facebook: { color: "#1877F2", label: "Facebook" },
  x:        { color: "#15171C", label: "X" },
  default:  { color: "#9A9896", label: "Content" },
};

/** Inline SVG platform icons. Sizes: 14 default, 12 for calendar chips. */
function PlatformIcon({ platform, size = 14 }: { platform: string | undefined | null; size?: number }) {
  const k = platformKey(platform);
  const w = size, h = size;
  if (k === "linkedin") {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0, display: "block" }}>
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }
  if (k === "instagram") {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="#C13584" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="#C13584" stroke="none" />
      </svg>
    );
  }
  if (k === "email") {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="#E85A46" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2,4 12,13 22,4" />
      </svg>
    );
  }
  if (k === "facebook") {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0, display: "block" }}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  if (k === "x") {
    return (
      <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="#15171C" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
        <path d="M4 4l16 16M4 20L20 4" />
      </svg>
    );
  }
  return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="#9A9896" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, display: "block" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

// Map platform key to the contentType / platform value the generate-content
// edge function expects.
const PLATFORM_TO_CT: Record<string, { platform: string; contentType: string }> = {
  linkedin:  { platform: "LinkedIn Post",       contentType: "LinkedIn Post" },
  email:     { platform: "Newsletter Section",  contentType: "Newsletter Section" },
  instagram: { platform: "Instagram Caption",   contentType: "Instagram Caption" },
  facebook:  { platform: "Facebook Post",       contentType: "Facebook Post" },
  default:   { platform: "LinkedIn Post",       contentType: "LinkedIn Post" },
};

const PLATFORM_LENGTH_HINT: Record<string, string> = {
  linkedin:  "Targeting 150–200 words — optimal for LinkedIn reach and saves",
  instagram: "Targeting 125 char hook + 300 char body — hook must land before 'more' cutoff",
  email:     "Targeting 200–350 words — one topic, one CTA, scannable",
  facebook:  "Targeting 40–80 words — concise posts get 3× the reach on Facebook",
  default:   "Targeting optimal length for this platform",
};

type TaskItem = {
  date: string;
  day: string;
  action: string;
  platform: string;
  contentNote: string;
  weekNumber: number;
  campaignId: string;
  campaignName: string;
  campaignColor: string;
  campaignGoal: string;
  campaignPillars: string[];
  savedContent: string | null;
  savedAt: string | null;
  scheduledAt: string | null;
  status: string | null;
};

export default function CampaignCalendarTab({ ctx }: { ctx: any }) {
  const { setTab, strategy, socialConnections } = ctx;
  const { user } = useAuth();
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openTask, setOpenTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, color, start_date, status, plan, goals, pillars")
        .eq("user_id", user.id)
        .in("status", ["active", "paused"]);
      if (!cancel) {
        setCampaigns(data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [user]);

  const allTasks = useMemo<TaskItem[]>(() => {
    const out: TaskItem[] = [];
    for (const c of campaigns) {
      if (!c.start_date || !c.plan) continue;
      const weeks = Array.isArray(c.plan?.weeks) ? c.plan.weeks : [];
      const startDate = new Date(c.start_date + "T00:00:00");
      weeks.forEach((wk: any, wIdx: number) => {
        const weekBase = addDays(startDate, wIdx * 7);
        const baseDow = weekBase.getDay(); // 0=Sun..6=Sat
        const tasks = Array.isArray(wk?.tasks) ? wk.tasks : [];
        tasks.forEach((t: any) => {
          const taskDow = TASK_DAY_DOW[(t?.day || "").toLowerCase()] ?? baseDow;
          let off = taskDow - baseDow;
          if (off < 0) off += 7;
          const d = addDays(weekBase, off);
          out.push({
            date: ymd(d),
            day: t?.day ?? "",
            action: t?.action ?? "",
            platform: t?.platform ?? "",
            contentNote: t?.contentNote ?? "",
            weekNumber: wk?.weekNumber ?? wIdx + 1,
            campaignId: c.id,
            campaignName: c.name,
            campaignColor: c.color || "#E85A46",
            campaignGoal: c.goals ?? "",
            campaignPillars: Array.isArray(c.pillars) ? c.pillars : [],
            savedContent: t?.savedContent ?? null,
            savedAt: t?.savedAt ?? null,
            scheduledAt: t?.scheduledAt ?? null,
            status: t?.status ?? null,
          });
        });
      });
    }
    return out;
  }, [campaigns]);

  const visibleTasks = useMemo(
    () => allTasks.filter((t) => !hiddenIds.has(t.campaignId)),
    [allTasks, hiddenIds]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of visibleTasks) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return map;
  }, [visibleTasks]);

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = startOfWeek(monthStart);
  const cellCount = Math.ceil(((monthEnd.getTime() - gridStart.getTime()) / 86400000 + 1) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, i) => addDays(gridStart, i));

  const hasAnyTasks = allTasks.length > 0;

  function toggleCampaign(id: string) {
    setHiddenIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  // Apply a task update (returned by the modal) back into local campaign state
  // so the chip re-renders immediately without refetch.
  function applyTaskUpdate(updated: TaskItem) {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== updated.campaignId) return c;
        const plan = c.plan ?? {};
        const weeks = Array.isArray(plan.weeks) ? plan.weeks : [];
        const newWeeks = weeks.map((wk: any) => {
          const wkNum = wk?.weekNumber ?? 0;
          if (wkNum !== updated.weekNumber) return wk;
          const tasks = Array.isArray(wk.tasks) ? wk.tasks : [];
          return {
            ...wk,
            tasks: tasks.map((t: any) =>
              (t?.day || "").toLowerCase() === updated.day.toLowerCase()
                ? { ...t, savedContent: updated.savedContent, savedAt: updated.savedAt, scheduledAt: updated.scheduledAt, status: updated.status }
                : t
            ),
          };
        });
        return { ...c, plan: { ...plan, weeks: newWeeks } };
      })
    );
    setOpenTask((cur) => (cur && cur.campaignId === updated.campaignId && cur.weekNumber === updated.weekNumber && cur.day === updated.day ? updated : cur));
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium px-2 min-w-[160px] text-center">
            {anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <button
            type="button"
            onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Today
          </button>
        </div>
      </div>

      {/* Campaign filter badges */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {campaigns.map((c) => {
            const hidden = hiddenIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCampaign(c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 transition-colors",
                  hidden && "opacity-40"
                )}
                style={{
                  border: "1px solid #ECEAE5",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: "#fff",
                }}
                title={hidden ? "Show campaign" : "Hide campaign"}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || "#E85A46" }}
                />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-md border border-border bg-card overflow-hidden relative">
        <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: "#E5E7EB" }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className="bg-muted px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{d}</div>
          ))}
          {cells.map((d, idx) => {
            const inMonth = d.getMonth() === anchor.getMonth();
            const isToday = sameDay(d, new Date());
            const dayTasks = tasksByDate.get(ymd(d)) ?? [];
            const shown = dayTasks.slice(0, 2);
            const overflow = dayTasks.length - shown.length;
            return (
              <div
                key={`cell-${idx}`}
                className={cn(
                  "bg-card min-h-[120px] px-1.5 py-2 text-left flex flex-col",
                  !inMonth && "opacity-40",
                  isToday && "bg-accent-soft/40"
                )}
              >
                <div className="mb-1">
                  <span className={cn("text-[10px]", isToday ? "font-bold text-foreground" : "text-muted-foreground")}>
                    {d.getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  {shown.map((t, i) => {
                    const hasSaved = !!t.savedContent;
                    const isScheduled = !!t.scheduledAt;
                    const bg = isScheduled ? "#EFF6FF" : hasSaved ? "#F0FDF4" : "#F7F5F1";
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setOpenTask(t)}
                        title={t.action}
                        style={{
                          background: bg,
                          border: "none",
                          borderRadius: 4,
                          padding: "2px 6px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#15171C",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                          cursor: "pointer",
                          marginBottom: 2,
                          width: "100%",
                        }}
                      >
                        <PlatformIcon platform={t.platform} size={12} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
                          {t.action}
                        </span>
                        {isScheduled ? (
                          <CalendarIcon style={{ width: 11, height: 11, color: "#2563EB", flexShrink: 0 }} />
                        ) : hasSaved ? (
                          <span style={{ color: "#16A34A", fontSize: 11, flexShrink: 0 }}>✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <div style={{ fontSize: 11, color: "#9A9896", marginTop: 2 }}>
                      + {overflow} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state overlay */}
        {!loading && !hasAnyTasks && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-card/90 backdrop-blur-sm rounded-lg px-6 py-5 pointer-events-auto">
              <div style={{ fontSize: 14, color: "#0E0F10", fontWeight: 600, marginBottom: 4 }}>
                No campaigns scheduled yet.
              </div>
              <div style={{ fontSize: 13, color: "#9A9896", marginBottom: 8 }}>
                Start a campaign to populate your calendar.
              </div>
              <button
                type="button"
                onClick={() => setTab("start")}
                style={{ color: "#E85A46", fontSize: 13, fontWeight: 600 }}
              >
                → Start a Campaign
              </button>
            </div>
          </div>
        )}
      </div>

      {openTask && (
        <TaskGenerationModal
          task={openTask}
          strategy={strategy}
          socialConnections={socialConnections ?? []}
          onClose={() => setOpenTask(null)}
          onUpdate={applyTaskUpdate}
        />
      )}
    </div>
  );
}

function formatSavedAt(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

function wordCount(s: string) {
  return (s.trim().match(/\S+/g) ?? []).length;
}

function TaskGenerationModal({
  task, strategy, socialConnections, onClose, onUpdate,
}: {
  task: TaskItem;
  strategy: any;
  socialConnections: any[];
  onClose: () => void;
  onUpdate: (t: TaskItem) => void;
}) {
  const pKey = platformKey(task.platform);
  const style = PLATFORM_STYLE[pKey];
  const lengthHint = PLATFORM_LENGTH_HINT[pKey];
  const ct = PLATFORM_TO_CT[pKey];
  const category = contentCategoryFor(task.platform);
  const navigate = useNavigate();

  // Cross-post detection: parse "Cross-post your <SOURCE> content..." style actions.
  const crossPostInfo = (() => {
    const action = task.action ?? "";
    if (!/cross[- ]?post|repurpose|adapt/i.test(action)) return null;
    const platforms = ["LinkedIn", "Instagram", "Facebook", "Email", "Newsletter", "Twitter", "X"];
    const found: string[] = [];
    for (const p of platforms) {
      const re = new RegExp(`\\b${p}\\b`, "i");
      if (re.test(action)) found.push(p);
    }
    // Source = first mentioned platform that isn't the current target platform.
    const targetKey = platformKey(task.platform);
    const source = found.find((p) => platformKey(p) !== targetKey);
    if (!source) return null;
    return { sourcePlatform: source };
  })();

  // Look up saved content for the source platform within the same campaign.
  function findSourceContent(sourcePlatform: string): string | null {
    // The parent passes the entire campaign via task.campaignId; we don't have the
    // full plan here, but savedContent lives on sibling tasks. Best-effort: return
    // null and let Claude write fresh — the prompt still enforces platform-specific
    // rewrite even without the exact source text.
    return null;
  }

  const isPlatformConnected = (() => {
    if (category !== "social") return true;
    const want = pKey;
    return (socialConnections ?? []).some((c: any) => {
      const p = (c?.platform || c?.provider || "").toLowerCase();
      return p === want || p.includes(want);
    });
  })();

  const [content, setContent] = useState<string>(task.savedContent ?? "");
  const [originalContent, setOriginalContent] = useState<string>(task.savedContent ?? "");
  const [hasFocused, setHasFocused] = useState<boolean>(false);
  const [pulseSave, setPulseSave] = useState<boolean>(false);
  const [regenConfirm, setRegenConfirm] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<string | null>(task.savedAt);
  const [scheduledAt, setScheduledAt] = useState<string | null>(task.scheduledAt);
  const [generating, setGenerating] = useState<boolean>(!task.savedContent);
  const [regenerating, setRegenerating] = useState(false);

  const [copyLabel, setCopyLabel] = useState("Copy");
  const [saveLabel, setSaveLabel] = useState("Save");
  const [saveErr, setSaveErr] = useState(false);
  const [publishLabel, setPublishLabel] = useState("Publish now");
  const [publishNote, setPublishNote] = useState<string | null>(null);

  const [schedOpen, setSchedOpen] = useState(false);
  const [schedDate, setSchedDate] = useState<string>(task.date);
  const [schedTime, setSchedTime] = useState<string>("09:00");
  const [schedConfirmed, setSchedConfirmed] = useState<string | null>(null);

  const taskDateLabel = (() => {
    try { return new Date(task.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
    catch { return task.date; }
  })();

  async function callGenerate(): Promise<string | null> {
    let crossPost: { sourcePlatform: string; sourceContent: string } | null = null;
    if (crossPostInfo) {
      // Fetch fresh plan to find the sibling task's saved content.
      try {
        const { data } = await supabase
          .from("campaigns").select("plan").eq("id", task.campaignId).maybeSingle();
        const weeks = Array.isArray((data as any)?.plan?.weeks) ? (data as any).plan.weeks : [];
        const wantKey = platformKey(crossPostInfo.sourcePlatform);
        let src: string | null = null;
        for (const wk of weeks) {
          const tasks = Array.isArray(wk?.tasks) ? wk.tasks : [];
          for (const t of tasks) {
            if (platformKey(t?.platform) === wantKey && typeof t?.savedContent === "string" && t.savedContent.trim()) {
              src = t.savedContent;
              break;
            }
          }
          if (src) break;
        }
        if (src) crossPost = { sourcePlatform: crossPostInfo.sourcePlatform, sourceContent: src };
      } catch { /* best-effort */ }
    }
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: {
        topic: task.action,
        platform: ct.platform,
        contentType: ct.contentType,
        strategy: strategy ?? {},
        campaign: {
          name: task.campaignName,
          goals: task.campaignGoal,
        },
        slot: { scheduled_date: task.date, pillar: task.campaignPillars?.[0] ?? null },
        calendarContext: {
          title: task.action,
          pillar: task.campaignPillars?.[0] ?? null,
          date: task.date,
        },
        crossPost,
      },
    });
    if (error || (data as any)?.error) {
      console.error("generate-content error", error, data);
      return null;
    }
    return (data as any)?.body ?? null;
  }

  // Initial auto-generate when no saved content.
  useEffect(() => {
    if (task.savedContent) return;
    let cancel = false;
    (async () => {
      const body = await callGenerate();
      if (cancel) return;
      const out = body ?? "Generation failed. Click Regenerate to try again.";
      setContent(out);
      setOriginalContent(out);
      setGenerating(false);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persistPlan(updates: { savedContent?: string | null; savedAt?: string | null; scheduledAt?: string | null; status?: string | null }) {
    // Read current plan, patch the right task, write back.
    const { data: row, error: e1 } = await supabase
      .from("campaigns").select("plan").eq("id", task.campaignId).maybeSingle();
    if (e1 || !row) throw e1 ?? new Error("Campaign not found");
    const plan = (row as any).plan ?? {};
    const weeks = Array.isArray(plan.weeks) ? plan.weeks : [];
    const newWeeks = weeks.map((wk: any) => {
      if ((wk?.weekNumber ?? 0) !== task.weekNumber) return wk;
      const tasks = Array.isArray(wk.tasks) ? wk.tasks : [];
      return {
        ...wk,
        tasks: tasks.map((t: any) =>
          (t?.day || "").toLowerCase() === task.day.toLowerCase()
            ? { ...t, ...updates }
            : t
        ),
      };
    });
    const { error: e2 } = await supabase
      .from("campaigns").update({ plan: { ...plan, weeks: newWeeks } })
      .eq("id", task.campaignId);
    if (e2) throw e2;
  }

  async function handleSave() {
    setSaveErr(false);
    const now = new Date().toISOString();
    try {
      await persistPlan({ savedContent: content, savedAt: now, status: "draft" });
      setSavedAt(now);
      setSaveLabel("Saved ✓");
      setOriginalContent(content);
      onUpdate({ ...task, savedContent: content, savedAt: now, status: "draft" });
      setTimeout(() => setSaveLabel("Save"), 1500);
    } catch {
      setSaveErr(true);
      setSaveLabel("Failed — retry");
      setTimeout(() => { setSaveLabel("Save"); setSaveErr(false); }, 2000);
    }
  }

  async function handleConfirmSchedule() {
    const iso = new Date(`${schedDate}T${schedTime}:00`).toISOString();
    try {
      await persistPlan({ savedContent: content, savedAt: savedAt ?? new Date().toISOString(), scheduledAt: iso, status: "scheduled" });
      setScheduledAt(iso);
      setSchedConfirmed(new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
      onUpdate({ ...task, savedContent: content, savedAt: savedAt ?? new Date().toISOString(), scheduledAt: iso, status: "scheduled" });
      setTimeout(() => { setSchedConfirmed(null); setSchedOpen(false); }, 2000);
    } catch {
      setSchedConfirmed("Failed — try again");
      setTimeout(() => setSchedConfirmed(null), 2000);
    }
  }

  async function handlePublish() {
    if (category === "social" && !isPlatformConnected) {
      setPublishNote(`Connect your ${style.label} account first →`);
      return;
    }
    try {
      await persistPlan({ savedContent: content, savedAt: new Date().toISOString(), status: "published" });
      onUpdate({ ...task, savedContent: content, savedAt: new Date().toISOString(), status: "published" });
    } catch { /* visual-only confirmation per spec */ }
    setPublishLabel("Published!");
    setTimeout(() => { setPublishLabel("Publish now"); onClose(); }, 2000);
  }

  async function handleRegenerate() {
    setRegenConfirm(false);
    setRegenerating(true);
    setContent("");
    const body = await callGenerate();
    const out = body ?? "Generation failed. Click Regenerate to try again.";
    setContent(out);
    setOriginalContent(out);
    setHasFocused(false);
    setRegenerating(false);
  }

  function onRegenerateClick() {
    if (content !== originalContent) {
      setRegenConfirm(true);
    } else {
      void handleRegenerate();
    }
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(content); } catch { /* ignore */ }
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 1500);
  }

  const showSpinner = generating || regenerating;
  const isDirty = !showSpinner && content !== originalContent;

  // Pulse the save button once when edits first appear.
  useEffect(() => {
    if (isDirty) {
      setPulseSave(true);
      const t = setTimeout(() => setPulseSave(false), 220);
      return () => clearTimeout(t);
    }
  }, [isDirty]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(14,15,16,0.48)",
        zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <style>{`@keyframes mox-spin { to { transform: rotate(360deg); } }`}</style>
      <style>{`@keyframes mox-pulse { 0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)} }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14, width: 520, maxWidth: "94vw",
          border: "0.5px solid #ECEAE5", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #ECEAE5", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, color: style.color, fontSize: 11, fontWeight: 500 }}>
              <PlatformIcon platform={task.platform} size={14} />
              {style.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#15171C", lineHeight: 1.4, marginBottom: 2 }}>
              {task.action}
            </div>
            <div style={{ fontSize: 11, color: "#9A9896" }}>
              {task.campaignName} · {taskDateLabel}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9A9896", cursor: "pointer", padding: 0, marginLeft: 12 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content area */}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #ECEAE5", maxHeight: 220, overflowY: "auto" }}>
          {showSpinner ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "44px 20px" }}>
              <div style={{ width: 32, height: 32, border: "2.5px solid #ECEAE5", borderTopColor: "#E85A46", borderRadius: "50%", animation: "mox-spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 13, color: "#9A9896" }}>
                {regenerating ? "Generating new version…" : "Generating with your strategy and voice…"}
              </div>
              <div style={{ fontSize: 11, color: "#9A9896", textAlign: "center" }}>{lengthHint}</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: isDirty ? "#D97706" : "#9A9896" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isDirty ? "#D97706" : "#22C55E", display: "inline-block" }} />
                  {isDirty ? "Unsaved" : "Generated"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <div style={{ fontSize: 11, color: "#9A9896" }}>{wordCount(content)} words</div>
                  {!hasFocused && content && (
                    <div style={{ fontSize: 11, color: "#9A9896", fontStyle: "italic" }}>Click to edit</div>
                  )}
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setHasFocused(true)}
                style={{
                  width: "100%",
                  minHeight: 120,
                  maxHeight: 200,
                  overflowY: "auto",
                  fontSize: 13,
                  color: "#15171C",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  border: "1.5px solid transparent",
                  borderRadius: 8,
                  padding: "8px 10px",
                  outline: "none",
                  background: "transparent",
                  resize: "none",
                  fontFamily: '"Space Grotesk", system-ui, sans-serif',
                  cursor: "text",
                  display: "block",
                  boxSizing: "border-box",
                }}
                onFocusCapture={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#E85A46";
                  (e.currentTarget as HTMLTextAreaElement).style.background = "#FAFAF8";
                }}
                onBlurCapture={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "transparent";
                  (e.currentTarget as HTMLTextAreaElement).style.background = "transparent";
                }}
              />
              {task.savedContent && savedAt && (
                <div style={{ fontSize: 11, color: "#9A9896", fontStyle: "italic", marginTop: 8 }}>
                  Saved {formatSavedAt(savedAt)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Context strip */}
        <div style={{ padding: "8px 20px", background: "#F7F5F1", borderBottom: "0.5px solid #ECEAE5", fontSize: 11, color: "#9A9896", display: "flex", alignItems: "center", gap: 6 }}>
          <PlatformIcon platform={task.platform} size={14} />
          <span>
            {task.campaignName} · {style.label}
            {task.campaignPillars?.length ? ` · ${task.campaignPillars.join(", ")}` : ""}
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <OutlinePill onClick={handleCopy} icon={<Copy size={12} />} label={copyLabel} />
            <div style={{ flex: 1, display: "flex", animation: pulseSave ? "mox-pulse 0.22s ease-out" : undefined }}>
              <OutlinePill onClick={handleSave} icon={<Save size={12} />} label={saveLabel} danger={saveErr} disabled={showSpinner || !content} />
            </div>
            {category === "social" && (
              <OutlinePill onClick={() => setSchedOpen((v) => !v)} icon={<CalendarIcon size={12} />} label="Schedule" disabled={showSpinner || !content} />
            )}
          </div>

          {category === "social" && schedOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: 10, background: "#F7F5F1", borderRadius: 8 }}>
              {schedConfirmed ? (
                <div style={{ fontSize: 12, color: "#15171C" }}>Scheduled for {schedConfirmed}</div>
              ) : (
                <>
                  <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                    style={{ fontSize: 12, padding: "6px 8px", border: "1px solid #ECEAE5", borderRadius: 6, background: "#fff" }} />
                  <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                    style={{ fontSize: 12, padding: "6px 8px", border: "1px solid #ECEAE5", borderRadius: 6, background: "#fff" }} />
                  <button type="button" onClick={handleConfirmSchedule}
                    style={{ background: "#E85A46", color: "#fff", borderRadius: 20, fontSize: 12, fontWeight: 500, padding: "8px 16px", border: "none", cursor: "pointer" }}>
                    Confirm schedule
                  </button>
                  <button type="button" onClick={() => setSchedOpen(false)}
                    style={{ background: "none", border: "none", fontSize: 12, color: "#9A9896", cursor: "pointer" }}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {category === "social" && !schedOpen && (
            <>
              <button type="button" onClick={handlePublish} disabled={showSpinner || !content}
                style={{ background: "#E85A46", color: "#fff", borderRadius: 20, fontSize: 13, fontWeight: 500, padding: 11, border: "none", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (showSpinner || !content) ? 0.6 : 1 }}>
                <Send size={14} />
                {publishLabel}
              </button>
              {!isPlatformConnected && !publishNote && (
                <div style={{ fontSize: 11, color: "#9A9896", textAlign: "center", marginTop: -4 }}>
                  Connect {style.label} in Social settings to publish directly.
                </div>
              )}
              {publishNote && (
                <button type="button" onClick={() => navigate("/app/social")}
                  style={{ background: "none", border: "none", fontSize: 11, color: "#E85A46", cursor: "pointer", textAlign: "center", marginTop: -4 }}>
                  {publishNote}
                </button>
              )}
            </>
          )}

          {category === "email" && (
            <>
              <button type="button" onClick={handleCopy} disabled={showSpinner || !content}
                style={{ background: "#E85A46", color: "#fff", borderRadius: 20, fontSize: 13, fontWeight: 500, padding: 11, border: "none", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (showSpinner || !content) ? 0.6 : 1 }}>
                <Copy size={14} />
                {copyLabel}
              </button>
              <div style={{ fontSize: 11, color: "#9A9896", textAlign: "center", marginTop: 2 }}>
                Copy this and paste it into your email platform.
              </div>
            </>
          )}

          {category === "doc" && (
            <div style={{ background: "#F7F5F1", borderRadius: 8, padding: "10px 14px", marginTop: 0, fontSize: 11, color: "#9A9896", lineHeight: 1.5, textAlign: "center" }}>
              This content type is a script or document. Copy it or save it here — use it in your recording, design tool, or wherever it's needed.
            </div>
          )}

          {regenConfirm ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }}>
              <span style={{ fontSize: 11, color: "#9A9896" }}>Regenerate and lose edits?</span>
              <button type="button" onClick={handleRegenerate}
                style={{ background: "none", border: "none", fontSize: 11, color: "#E85A46", cursor: "pointer", padding: 0 }}>
                Yes, regenerate
              </button>
              <button type="button" onClick={() => setRegenConfirm(false)}
                style={{ background: "none", border: "none", fontSize: 11, color: "#9A9896", cursor: "pointer", padding: 0 }}>
                Keep editing
              </button>
            </div>
          ) : (
            <button type="button" onClick={onRegenerateClick} disabled={showSpinner}
              style={{ background: "none", border: "none", fontSize: 11, color: "#9A9896", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" }}>
              <RefreshCw size={12} /> Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OutlinePill({ onClick, icon, label, danger, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        border: `1px solid ${danger ? "#DC2626" : "#E85A46"}`,
        borderRadius: 20,
        background: "transparent",
        color: danger ? "#DC2626" : "#15171C",
        fontSize: 12,
        fontWeight: 500,
        padding: "8px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}