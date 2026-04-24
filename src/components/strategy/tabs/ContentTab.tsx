import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar as CalendarIcon, Download, FileText, Mail, Mic } from "lucide-react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";

function platformIcon(p: string) {
  const s = (p || "").toLowerCase();
  if (s.includes("email") || s.includes("newsletter")) return <Mail className="h-3.5 w-3.5" />;
  if (s.includes("podcast")) return <Mic className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function downloadCsv(rows: any[]) {
  const headers = ["date", "day", "platform", "contentType", "topic", "theme", "week", "status"];
  const csv = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `content-calendar-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function groupByWeek(items: any[]) {
  const map = new Map<number, any[]>();
  for (const it of items) {
    const w = it.week ?? 1;
    if (!map.has(w)) map.set(w, []);
    map.get(w)!.push(it);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([week, items]) => ({ week, items }));
}

export function ContentTab() {
  const { strategy } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const themes: any[] = ef.quarterlyThemes || [];
  const calendar: any[] = ef.contentCalendar || [];
  const [expanded, setExpanded] = useState<string | null>(themes[0]?.quarter || null);

  if (!themes.length && !calendar.length) {
    return (
      <Card className="p-10 border-dashed border-border bg-background text-center">
        <h3 className="font-display text-2xl mb-2">No content plan yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate your execution plan from the button at the top of this page to populate quarterly themes and a 30-day calendar.</p>
      </Card>
    );
  }

  const weeks = groupByWeek(calendar);

  return (
    <div className="space-y-6 report-page">
      {themes.length > 0 && (
        <Card className="p-7 border-border shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Quarterly content themes</div>
              <h3 className="font-display text-2xl tracking-[-0.02em]">A year of strategic content</h3>
            </div>
          </div>
          <div className="space-y-3">
            {themes.map((t: any) => {
              const isOpen = expanded === t.quarter;
              return (
                <Collapsible key={t.quarter} open={isOpen} onOpenChange={(o) => setExpanded(o ? t.quarter : null)}>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <Badge className="bg-foreground text-background hover:bg-foreground border-0 text-[10px] tracking-[0.2em]">{t.quarter}</Badge>
                          <h4 className="font-display text-xl tracking-[-0.01em] truncate">{t.theme}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{t.overview}</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-5 pt-1 border-t border-border bg-muted/20 space-y-5">
                        {t.strategicRationale && (
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Why this quarter</div>
                            <p className="text-sm leading-relaxed">{t.strategicRationale}</p>
                          </div>
                        )}
                        {Array.isArray(t.contentTopics) && t.contentTopics.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Content topics — 12 weeks</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {t.contentTopics.map((c: any) => (
                                <div key={c.week} className="flex gap-3 text-sm p-3 rounded-lg bg-background border border-border">
                                  <div className="font-display text-accent text-base leading-none w-7 shrink-0">{String(c.week).padStart(2, "0")}</div>
                                  <div className="min-w-0">
                                    <div className="font-medium leading-snug">{c.topic}</div>
                                    {c.angle && <div className="text-xs text-muted-foreground mt-0.5">{c.angle}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {t.contentMix && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(t.contentMix).filter(([_, v]) => v).map(([k, v]) => (
                              <div key={k} className="p-3 rounded-lg bg-accent-soft/40">
                                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1">{k}</div>
                                <div className="text-sm">{v as string}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                          {t.successMetric && (
                            <div><span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-2">Success metric</span><span className="text-sm">{t.successMetric}</span></div>
                          )}
                          {t.cta && (
                            <div><span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-2">CTA</span><span className="text-sm">{t.cta}</span></div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </Card>
      )}

      {calendar.length > 0 && (
        <Card className="p-7 border-border shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2 flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5" /> Next 30 days</div>
              <h3 className="font-display text-2xl tracking-[-0.02em]">Content calendar preview</h3>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => downloadCsv(calendar)}>
              <Download className="mr-2 h-3.5 w-3.5" /> CSV
            </Button>
          </div>
          <div className="space-y-5">
            {weeks.map(({ week, items }) => (
              <div key={week}>
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Week {week}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-background">
                      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                        <span className="font-medium">{item.day} · {item.date}</span>
                        <span className="inline-flex items-center gap-1.5 text-accent">{platformIcon(item.platform)} {item.platform}</span>
                      </div>
                      <div className="text-sm font-medium leading-snug mb-2">{item.topic}</div>
                      {item.theme && <div className="text-xs text-muted-foreground mb-2 truncate">{item.theme}</div>}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-[10px] tracking-wider ${item.status === "draft_ready" ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"} border-0`}>
                          {item.status === "draft_ready" ? "Draft ready" : "Needs generation"}
                        </Badge>
                        {item.estimatedLength && <span className="text-[10px] text-muted-foreground">{item.estimatedLength}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}