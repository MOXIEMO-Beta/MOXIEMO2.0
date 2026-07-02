import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";

// Strip simple markdown emphasis (**bold**, *italic*) from a string so task
// text renders cleanly without literal asterisks.
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1$2");
}

// Normalize a week into { title, tasks: [{ id, task, estimatedTime, section? }] }.
// Newer strategies store each week as a markdown string like:
//   "### Week 1: Foundation (The Seed)\n* **Task:** Do X. (Est: 1 hour)\n* **Task:** ..."
// Older strategies already store an object with a `tasks` array.
function normalizeWeek(raw: any, weekNumber: number): { title: string; tasks: any[] } {
  if (!raw) return { title: `Week ${weekNumber}`, tasks: [] };
  if (typeof raw === "object" && Array.isArray(raw.tasks)) {
    const t =
      raw.theme ?? raw.title ?? raw.weekTheme ?? raw.focus ?? raw.weekFocus ?? null;
    const title = typeof t === "string" && t.trim() ? t.trim() : `Week ${weekNumber} — theme not generated`;
    return { title, tasks: raw.tasks };
  }
  if (typeof raw === "string") {
    const lines = raw.split(/\r?\n/);
    let title: string | null = null;
    const tasks: any[] = [];
    let idx = 0;
    for (const lineRaw of lines) {
      const line = lineRaw.trim();
      if (!line) continue;
      // Match "### Week 1: Foundation ..." or "Task: Week 1: Foundation (Est. 10 hours)"
      const titleMatch =
        line.match(/^#+\s*Week\s*\d+\s*[:\-]?\s*(.*)$/i) ||
        line.match(/^(?:\*\*)?Task:(?:\*\*)?\s*Week\s*\d+\s*[:\-]?\s*(.*)$/i);
      if (titleMatch) {
        let t = titleMatch[1].trim();
        // Strip trailing "(Est. 10 hours)" or "(Est: ...)" annotations from the title
        t = t.replace(/\s*\(\s*Est(?:imated)?[:\.]?\s*[^)]+\)\s*$/i, "").trim();
        if (t) title = t;
        continue;
      }
      const taskMatch = line.match(/^[\*\-]\s*(?:\*\*Task:\*\*|Task:)?\s*(.+)$/i);
      if (taskMatch) {
        let text = taskMatch[1].trim();
        let estimatedTime: string | undefined;
        const estMatch = text.match(/\(\s*Est(?:imated)?[:\.]?\s*([^)]+)\)\s*$/i);
        if (estMatch) {
          estimatedTime = estMatch[1].trim();
          text = text.slice(0, estMatch.index).trim();
        }
        // Strip leading bold markers like "**Label:**"
        text = text.replace(/^\*\*([^*]+)\*\*\s*:?\s*/, "$1: ").trim();
        tasks.push({
          id: `week-${weekNumber}-task-${idx++}`,
          task: text,
          estimatedTime,
        });
      }
    }
    return { title: title || `Week ${weekNumber} — theme not generated`, tasks };
  }
  return { title: `Week ${weekNumber}`, tasks: [] };
}

function WeekCard({ week, weekNumber, completion, onToggle, isFirst }: { week: any; weekNumber: number; completion: Record<string, boolean>; onToggle: (id: string, v: boolean) => void; isFirst?: boolean }) {
  const tasks = Array.isArray(week?.tasks) ? week.tasks : [];
  const done = tasks.filter((t: any) => completion[t.id]).length;
  return (
    <div
      className="rounded-[14px] bg-white p-5"
      style={{ border: isFirst ? "1px solid #E85A46" : "1px solid #ECEAE5" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-[0.05em]"
          style={{
            background: isFirst ? "#E85A46" : "#F0EFEC",
            color: isFirst ? "#FFFFFF" : "#0E0F10",
          }}
        >
          Week {weekNumber}
        </span>
        <h4 className="text-[15px] font-semibold text-foreground flex-1">{week?.title || `Week ${weekNumber}`}</h4>
        {tasks.length > 0 && <span className="text-[12px] text-[#6B6860]">{done} / {tasks.length}</span>}
      </div>
      {tasks.length === 0 ? (
        <p className="text-[13px] text-[#6B6860] italic px-1 py-2">Tasks will appear after your strategy generates.</p>
      ) : (
      <ul className="space-y-2">
        {tasks.map((t: any) => {
          const checked = !!completion[t.id];
          return (
            <li
              key={t.id}
              className={`flex items-start gap-3 p-3 rounded-[10px] transition-opacity ${checked ? "opacity-60" : ""}`}
              style={{ background: "#F7F5F1" }}
            >
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(t.id, !!v)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] leading-[1.5] text-foreground ${checked ? "line-through" : ""}`}>{stripMarkdown(String(t.task ?? ""))}</p>
                {(t.section || t.estimatedTime) && (
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B6860]">
                    {t.section && <span>{t.section}</span>}
                    {t.estimatedTime && (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.estimatedTime}</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}

export function ActionPlanTab() {
  const { strategy, setField } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const plan = ef.actionPlan || ef.weeklyActionPlan || ef.actionItems || null;
  const completion = (strategy?.task_completion || {}) as Record<string, boolean>;

  const setCompletion = (id: string, v: boolean) => {
    const next = { ...completion, [id]: v };
    setField("task_completion", next);
  };

  const rawWeeks = plan
    ? [plan.week1, plan.week2, plan.week3, plan.week4]
    : [null, null, null, null];
  const weeks = rawWeeks.map((w, i) => normalizeWeek(w, i + 1));
  const hasAnyTasks = weeks.some((w) => w.tasks.length > 0);

  if (!plan || !hasAnyTasks) {
    return (
      <Card className="p-10 text-center" style={{ border: "1px dashed #ECEAE5", borderRadius: 14, background: "#FFFFFF" }}>
        <h3 className="text-[15px] font-semibold text-foreground mb-2">No action plan yet</h3>
        <p className="text-[13px] text-[#6B6860] max-w-md mx-auto">Generate your execution plan to get a 4-week quick start guide and weekly routine.</p>
      </Card>
    );
  }

  const totalTasks = weeks.reduce((n, w) => n + w.tasks.length, 0);
  const totalDone = weeks.reduce((n, w) => n + w.tasks.filter((t: any) => completion[t.id]).length, 0);
  const overallPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-7 report-page" style={{ pageBreakAfter: "always" }}>
      {/* Dark header card */}
      <div className="rounded-[14px] p-6" style={{ background: "#0E0F10", color: "#FFFFFF" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#E85A46] mb-2">Quick start</div>
            <h3 className="text-[20px] font-bold tracking-[-0.3px]">Your 4-week action plan</h3>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-bold leading-none" style={{ color: "#E85A46" }}>{overallPct}%</div>
            <div className="text-[11px] uppercase tracking-[0.1em] opacity-60 mt-1">{totalDone} of {totalTasks} tasks complete</div>
          </div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, overallPct)}%`, height: "100%", background: "#E85A46" }} />
        </div>
      </div>

      {/* 2x2 week grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weeks.map((w, i) => (
          <WeekCard key={i} week={w} weekNumber={i + 1} completion={completion} onToggle={setCompletion} isFirst={i === 0} />
        ))}
      </div>

      {/* Weekly routine */}
      {plan.ongoingRoutine && (
        <div className="rounded-[14px] bg-white p-6" style={{ border: "1px solid #ECEAE5" }}>
          <h3 className="text-[15px] font-semibold text-foreground mb-4">Your ongoing weekly routine</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["daily", "weekly", "monthly"] as const).map((k) => {
              const r = plan.ongoingRoutine?.[k];
              if (!r?.task) return null;
              const labelMap: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
              return (
                <div key={k} className="p-4 rounded-[10px]" style={{ background: "#F7F5F1" }}>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "#E85A46" }}>
                    {labelMap[k]}{r.time ? ` · ${r.time}` : ""}
                  </div>
                  <p className="text-[13px] leading-[1.6] text-foreground">{r.task}</p>
                </div>
              );
            })}
          </div>
          {(plan.ongoingRoutine.totalTimePerWeek || plan.ongoingRoutine.comparison) && (
            <div className="mt-5 rounded-[10px] p-4 flex items-center justify-between" style={{ background: "#0E0F10", color: "#FFFFFF" }}>
              {plan.ongoingRoutine.totalTimePerWeek && (
                <div className="text-[13px]"><span className="font-bold" style={{ color: "#E85A46" }}>Total:</span> Approx. {plan.ongoingRoutine.totalTimePerWeek}</div>
              )}
              {plan.ongoingRoutine.comparison && <p className="text-[12px] opacity-70">{plan.ongoingRoutine.comparison}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}