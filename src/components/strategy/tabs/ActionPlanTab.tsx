import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock, Repeat } from "lucide-react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";

function WeekSection({ week, weekNumber, completion, onToggle, defaultOpen }: { week: any; weekNumber: number; completion: Record<string, boolean>; onToggle: (id: string, v: boolean) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!week?.tasks) return null;
  const tasks = week.tasks || [];
  const done = tasks.filter((t: any) => completion[t.id]).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border overflow-hidden bg-background">
        <CollapsibleTrigger className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/40 transition-colors">
          <div className="font-display text-3xl text-accent w-12 shrink-0">{String(weekNumber).padStart(2, "0")}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Week {weekNumber}</div>
            <h4 className="font-display text-xl tracking-[-0.01em] mb-2">{week.title}</h4>
            <div className="flex items-center gap-3">
              <Progress value={pct} className="h-1.5 flex-1 max-w-[200px]" />
              <span className="text-xs text-muted-foreground">{done} / {tasks.length} · {pct}%</span>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-1 border-t border-border bg-muted/20">
            <ul className="space-y-2 mt-3">
              {tasks.map((t: any) => {
                const checked = !!completion[t.id];
                return (
                  <li key={t.id} className={`flex items-start gap-3 p-3 rounded-lg bg-background border border-border transition-opacity ${checked ? "opacity-60" : ""}`}>
                    <Checkbox checked={checked} onCheckedChange={(v) => onToggle(t.id, !!v)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${checked ? "line-through text-muted-foreground" : ""}`}>{t.task}</p>
                      {t.estimatedTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-1"><Clock className="h-3 w-3" /> {t.estimatedTime}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ActionPlanTab() {
  const { strategy, setField } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const plan = ef.actionPlan;
  const completion = (strategy?.task_completion || {}) as Record<string, boolean>;

  const setCompletion = (id: string, v: boolean) => {
    const next = { ...completion, [id]: v };
    setField("task_completion", next);
  };

  const markAllWeek = (week: any) => {
    if (!week?.tasks) return;
    const next = { ...completion };
    for (const t of week.tasks) next[t.id] = true;
    setField("task_completion", next);
  };

  if (!plan?.week1) {
    return (
      <Card className="report-card p-10 border-dashed border-border bg-background text-center">
        <h3 className="font-display text-2xl mb-2">No action plan yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate your execution plan to get a 4-week quick start guide and weekly routine.</p>
      </Card>
    );
  }

  const weeks = [plan.week1, plan.week2, plan.week3, plan.week4];
  const totalTasks = weeks.reduce((n, w) => n + (w?.tasks?.length || 0), 0);
  const totalDone = weeks.reduce((n, w) => n + (w?.tasks?.filter((t: any) => completion[t.id]).length || 0), 0);
  const overallPct = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 report-page" style={{ pageBreakAfter: "always" }}>
      <Card className="report-card p-7 border-border shadow-soft bg-foreground text-background">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Quick start</div>
        <h3 className="font-display text-3xl tracking-[-0.02em] mb-4">Your 4-week action plan</h3>
        <div className="flex items-center gap-4">
          <Progress value={overallPct} className="h-2 flex-1" />
          <span className="font-display text-2xl">{overallPct}%</span>
        </div>
        <p className="text-sm text-background/70 mt-2">{totalDone} of {totalTasks} tasks complete</p>
      </Card>

      <div className="space-y-3">
        {weeks.map((w, i) => (
          <WeekSection key={i} week={w} weekNumber={i + 1} completion={completion} onToggle={setCompletion} defaultOpen={i === 0} />
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => markAllWeek(plan.week1)}>
          Mark all Week 1 done
        </Button>
      </div>

      {plan.ongoingRoutine && (
        <Card className="report-card p-7 border-border shadow-soft bg-accent-soft/30">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Repeat className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-1">Ongoing</div>
              <h3 className="font-display text-xl tracking-[-0.01em]">Your weekly routine</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["daily", "weekly", "biweekly", "monthly"] as const).map((k) => {
              const r = plan.ongoingRoutine?.[k];
              if (!r?.task) return null;
              return (
                <div key={k} className="p-4 rounded-lg bg-background border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-accent">{k}</span>
                    {r.time && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time}</span>}
                  </div>
                  <p className="text-sm">{r.task}</p>
                </div>
              );
            })}
          </div>
          {(plan.ongoingRoutine.totalTimePerWeek || plan.ongoingRoutine.comparison) && (
            <div className="mt-5 pt-5 border-t border-border flex items-baseline justify-between">
              {plan.ongoingRoutine.totalTimePerWeek && (
                <div><span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mr-2">Total</span><span className="font-display text-2xl">{plan.ongoingRoutine.totalTimePerWeek}</span></div>
              )}
              {plan.ongoingRoutine.comparison && <p className="text-xs text-muted-foreground italic">{plan.ongoingRoutine.comparison}</p>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}