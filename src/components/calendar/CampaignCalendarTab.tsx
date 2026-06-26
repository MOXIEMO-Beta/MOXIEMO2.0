import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfWeek, addDays, sameDay, ymd } from "./helpers";
import { cn } from "@/lib/utils";

const DAY_OFFSETS: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

function platformKey(p: string | undefined | null): string {
  const s = (p || "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("email") || s.includes("newsletter")) return "email";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("facebook")) return "facebook";
  return "default";
}

const PLATFORM_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  linkedin: { bg: "#E8F0FB", color: "#0A66C2", label: "LinkedIn" },
  email:    { bg: "#FEF1EE", color: "#E85A46", label: "Email" },
  instagram:{ bg: "#FCE7F3", color: "#C13584", label: "Instagram" },
  facebook: { bg: "#EFF6FF", color: "#1877F2", label: "Facebook" },
  default:  { bg: "#F0EFEC", color: "#6B6860", label: "Content" },
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
};

export default function CampaignCalendarTab({ ctx }: { ctx: any }) {
  const { setTab, navigate } = ctx;
  const { user } = useAuth();
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, color, start_date, status, plan")
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
      const startWeekMonday = startOfWeek(new Date(c.start_date));
      weeks.forEach((wk: any, wIdx: number) => {
        const weekMonday = addDays(startWeekMonday, wIdx * 7);
        const tasks = Array.isArray(wk?.tasks) ? wk.tasks : [];
        tasks.forEach((t: any) => {
          const off = DAY_OFFSETS[(t?.day || "").toLowerCase()] ?? 0;
          const d = addDays(weekMonday, off);
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
                    const style = PLATFORM_STYLE[platformKey(t.platform)];
                    const txt = t.action.length > 40 ? t.action.slice(0, 40) + "…" : t.action;
                    return (
                      <Popover key={i}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            style={{
                              backgroundColor: style.bg,
                              color: style.color,
                              marginBottom: 2,
                              borderRadius: 4,
                              padding: "2px 6px",
                              fontSize: 11,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                              width: "100%",
                              textAlign: "left",
                              display: "block",
                            }}
                            title={t.action}
                          >
                            {txt}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="start">
                          <TaskDetail task={t} date={d} navigate={navigate} />
                        </PopoverContent>
                      </Popover>
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
    </div>
  );
}

function TaskDetail({ task, date, navigate }: { task: TaskItem; date: Date; navigate: any }) {
  const style = PLATFORM_STYLE[platformKey(task.platform)];
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="space-y-2">
      <div style={{ fontSize: 11, color: "#9A9896" }}>
        {task.day} · {dateLabel}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
        <span style={{ fontSize: 12, color: style.color, fontWeight: 600 }}>{style.label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0E0F10", lineHeight: 1.35 }}>
        {task.action}
      </div>
      {task.contentNote && (
        <div style={{ fontSize: 13, color: "#9A9896", fontStyle: "italic" }}>
          {task.contentNote}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#9A9896" }}>{task.campaignName}</div>
      <button
        type="button"
        onClick={() => {
          const params = new URLSearchParams();
          params.set("tab", "generate");
          params.set("prompt", task.action);
          navigate(`/app/content?${params.toString()}`);
        }}
        style={{ color: "#E85A46", fontSize: 13, fontWeight: 600 }}
      >
        Generate content →
      </button>
    </div>
  );
}
