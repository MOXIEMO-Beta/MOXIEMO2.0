import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Heart, Sparkles } from "lucide-react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";

function NoDataNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground italic mt-2">{children}</p>;
}

export function MetricsTab() {
  const { strategy } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const sm = ef.successMetrics;

  if (!sm?.primary) {
    return (
      <Card className="report-card p-10 border-dashed border-border bg-background text-center">
        <h3 className="font-display text-2xl mb-2">No metrics dashboard yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate your execution plan to set targets, lead source projections, and brand health baselines.</p>
      </Card>
    );
  }

  const primary = sm.primary;
  const cp = sm.contentPerformance || {};
  const bg = sm.businessGoals || {};
  const bh = sm.brandHealth || {};
  const isLaunch = strategy?.strategy_lane === "offer_gtm";
  const sellTarget: string = (ef as any)?.successTarget || strategy?.success_definition || "";

  return (
    <div className="space-y-6 report-page">
      {/* Primary goal */}
      <Card className="report-card p-7 border-border shadow-soft bg-foreground text-background">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-10 w-10 rounded-lg bg-accent-soft/20 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-1">Primary goal</div>
            <h3 className="font-display text-3xl tracking-[-0.02em]">{primary.name}</h3>
          </div>
        </div>
        {isLaunch ? (
          <div className="mb-5">
            <div className="p-4 rounded-lg bg-background/5 border border-background/10">
              <div className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-1">Sell target</div>
              <div className="font-display text-2xl leading-tight">
                {primary.target?.total || sellTarget || primary.name || ""}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {primary.target?.weekly && (
              <div className="p-4 rounded-lg bg-background/5 border border-background/10">
                <div className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-1">Weekly target</div>
                <div className="font-display text-3xl">{primary.target.weekly}</div>
              </div>
            )}
            {primary.target?.monthly && (
              <div className="p-4 rounded-lg bg-background/5 border border-background/10">
                <div className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-1">Monthly target</div>
                <div className="font-display text-3xl">{primary.target.monthly}</div>
              </div>
            )}
          </div>
        )}
        <p className="text-sm text-background/70 italic">Starting baseline, connect analytics to track real performance.</p>
      </Card>

      {/* Lead sources + qualification */}
      {(Array.isArray(primary.leadSources) || primary.qualification) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.isArray(primary.leadSources) && primary.leadSources.length > 0 && (
            <Card className="report-card p-6 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Projected lead sources</div>
              <div className="space-y-3" style={{ width: '100%', overflow: 'hidden' }}>
                {primary.leadSources.map((s: any, i: number) => (
                  <div key={i} style={{ width: '100%', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minWidth: 0 }}>
                      <span style={{ flexShrink: 0, minWidth: '120px', fontSize: '12px' }} className="font-medium truncate">{s.source}</span>
                      <div style={{ flex: 1, minWidth: 0, height: '8px', background: 'hsl(var(--muted))', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Number(s.percentage) || 0)}%`, height: '100%', background: 'hsl(var(--accent))', borderRadius: '4px', maxWidth: '100%' }} />
                      </div>
                      <span style={{ flexShrink: 0, fontSize: '12px', minWidth: '32px', textAlign: 'right' }} className="text-muted-foreground">
                        {s.percentage}%{s.perWeek ? ` · ${s.perWeek}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {primary.qualification && (
            <Card className="report-card p-6 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Lead qualification mix</div>
              <div className="space-y-3">
                {(["highFit", "mediumFit", "lowFit"] as const).map((k) => {
                  const q = primary.qualification[k];
                  if (!q) return null;
                  const tone = k === "highFit" ? "text-accent" : k === "lowFit" ? "text-muted-foreground" : "";
                  return (
                    <div key={k} className="text-sm">
                      <div className="flex justify-between mb-0.5">
                        <span className={`font-medium ${tone}`}>{k.replace("Fit", " fit")}</span>
                        <span className="text-muted-foreground">{q.percentage}%</span>
                      </div>
                      {q.definition && <p className="text-xs text-muted-foreground">{q.definition}</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Content performance */}
      <Card className="report-card p-7 border-border shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4"><TrendingUp className="h-3.5 w-3.5" /> Content performance targets</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cp.linkedin && (
            <div className="p-4 rounded-lg border border-border">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">{strategy?.primary_channel ?? 'LinkedIn'}</div>
              <ul className="text-sm space-y-1">
                {cp.linkedin.engagementTarget && <li className="flex justify-between"><span className="text-muted-foreground">Engagement</span><span>{cp.linkedin.engagementTarget}</span></li>}
                {cp.linkedin.profileViewsTarget && <li className="flex justify-between"><span className="text-muted-foreground">Profile views</span><span>{cp.linkedin.profileViewsTarget}</span></li>}
                {cp.linkedin.postsPerWeek && <li className="flex justify-between"><span className="text-muted-foreground">Posts / wk</span><span>{cp.linkedin.postsPerWeek}</span></li>}
              </ul>
              <NoDataNote>Will populate after first posts.</NoDataNote>
            </div>
          )}
          {cp.email && (
            <div className="p-4 rounded-lg border border-border">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Email</div>
              <ul className="text-sm space-y-1">
                {cp.email.openRateTarget && <li className="flex justify-between"><span className="text-muted-foreground">Open rate</span><span>{cp.email.openRateTarget}</span></li>}
                {cp.email.clickRateTarget && <li className="flex justify-between"><span className="text-muted-foreground">Click rate</span><span>{cp.email.clickRateTarget}</span></li>}
                {cp.email.sendsPerMonth && <li className="flex justify-between"><span className="text-muted-foreground">Sends / mo</span><span>{cp.email.sendsPerMonth}</span></li>}
              </ul>
              <NoDataNote>Will populate after first sends.</NoDataNote>
            </div>
          )}
        </div>
      </Card>

      {/* Business goals */}
      {(bg.revenueGrowth || bg.scalingPlan) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4"><Sparkles className="h-3.5 w-3.5" /> Business goals</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bg.revenueGrowth && (
              <div className="p-4 rounded-lg bg-accent-soft/40">
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1">Revenue growth</div>
                <p className="text-sm">{bg.revenueGrowth}</p>
              </div>
            )}
            {bg.scalingPlan && (
              <div className="p-4 rounded-lg bg-muted/60">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Scaling plan</div>
                <p className="text-sm">{bg.scalingPlan}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Brand health */}
      <Card className="report-card p-7 border-border shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5"><Heart className="h-3.5 w-3.5" /> Brand health</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <div className="flex items-baseline justify-between mb-2" style={{ minWidth: 0 }}>
              <span className="text-sm font-medium truncate" style={{ flexShrink: 1, minWidth: 0 }}>Voice consistency</span>
              <span className="font-display text-3xl text-accent" style={{ flexShrink: 0 }}>
                {(() => {
                  const v = bh.voiceConsistencyScore ?? 100;
                  return v > 10 ? `${(v / 10).toFixed(1)} / 10` : `${v} / 10`;
                })()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, height: '6px', background: 'hsl(var(--muted))', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
              <div style={{ width: `${Math.min(100, bh.voiceConsistencyScore ?? 100)}%`, height: '100%', background: 'hsl(var(--accent))', borderRadius: '3px' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Perfect baseline — no content deviations yet.</p>
          </div>
          <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <div className="flex items-baseline justify-between mb-2" style={{ minWidth: 0 }}>
              <span className="text-sm font-medium truncate" style={{ flexShrink: 1, minWidth: 0 }}>Archetype alignment</span>
              <span className="font-display text-3xl text-accent" style={{ flexShrink: 0 }}>
                {(() => {
                  const v = bh.archetypeAlignment ?? 100;
                  return v > 10 ? `${(v / 10).toFixed(1)} / 10` : `${v} / 10`;
                })()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, height: '6px', background: 'hsl(var(--muted))', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
              <div style={{ width: `${Math.min(100, bh.archetypeAlignment ?? 100)}%`, height: '100%', background: 'hsl(var(--accent))', borderRadius: '3px' }} />
            </div>
            {bh.notes && <p className="text-xs text-muted-foreground mt-2">{bh.notes}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}