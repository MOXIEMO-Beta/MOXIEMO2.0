import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, Sparkles, AlertTriangle, Loader2, Zap } from "lucide-react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function ChannelSection({ channel, level, defaultOpen }: { channel: any; level: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  if (!channel?.platform) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-xl border ${level === "PRIMARY" ? "border-foreground/20 bg-foreground text-background" : "border-border"} overflow-hidden`}>
        <CollapsibleTrigger className={`w-full flex items-start justify-between gap-4 p-6 text-left transition-colors ${level === "PRIMARY" ? "hover:bg-foreground/95" : "hover:bg-muted/40"}`}>
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] uppercase tracking-[0.25em] mb-2 ${level === "PRIMARY" ? "text-accent" : "text-muted-foreground"}`}>{level} channel</div>
            <h3 className="font-display text-3xl tracking-[-0.02em] mb-3">{channel.platform}</h3>
            {Array.isArray(channel.rationale) && (
              <ul className="space-y-1">
                {channel.rationale.slice(0, 3).map((r: string, i: number) => (
                  <li key={i} className={`text-sm flex gap-2 ${level === "PRIMARY" ? "text-background/80" : "text-muted-foreground"}`}>
                    <span className="text-accent mt-1">•</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""} ${level === "PRIMARY" ? "text-background/60" : "text-muted-foreground"}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={`px-6 pb-6 pt-1 border-t space-y-5 ${level === "PRIMARY" ? "border-background/10 bg-foreground/95" : "border-border bg-muted/20"}`}>
            {channel.contentStrategy && (
              <div>
                <div className={`text-[10px] uppercase tracking-[0.25em] mb-2 ${level === "PRIMARY" ? "text-accent" : "text-accent"}`}>Content strategy</div>
                {channel.contentStrategy.frequency && <p className={`text-sm mb-1 ${level === "PRIMARY" ? "text-background/90" : ""}`}>{channel.contentStrategy.frequency}</p>}
                {Array.isArray(channel.contentStrategy.types) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {channel.contentStrategy.types.map((t: string, i: number) => (
                      <Badge key={i} variant="secondary" className={`border-0 text-[11px] ${level === "PRIMARY" ? "bg-background/10 text-background hover:bg-background/10" : "bg-accent-soft text-accent"}`}>{t}</Badge>
                    ))}
                  </div>
                )}
                {channel.contentStrategy.tone && <p className={`text-xs mt-2 italic ${level === "PRIMARY" ? "text-background/60" : "text-muted-foreground"}`}>Tone: {channel.contentStrategy.tone}</p>}
              </div>
            )}
            {Array.isArray(channel.postingSchedule) && channel.postingSchedule.length > 0 && (
              <div>
                <div className={`text-[10px] uppercase tracking-[0.25em] mb-3 ${level === "PRIMARY" ? "text-accent" : "text-accent"}`}>Posting schedule</div>
                <div className="space-y-2">
                  {channel.postingSchedule.map((s: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 text-sm p-3 rounded-lg ${level === "PRIMARY" ? "bg-background/5" : "bg-background border border-border"}`}>
                      <div className={`font-medium w-24 shrink-0 ${level === "PRIMARY" ? "text-background" : ""}`}>{s.day}{s.time ? ` · ${s.time}` : ""}</div>
                      <div className="flex-1">
                        <div className={level === "PRIMARY" ? "text-background/90" : ""}>{s.type}</div>
                        {s.example && <div className={`text-xs italic mt-0.5 ${level === "PRIMARY" ? "text-background/60" : "text-muted-foreground"}`}>{s.example}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channel.successMetrics && Object.values(channel.successMetrics).some(Boolean) && (
                <div className={`p-4 rounded-lg ${level === "PRIMARY" ? "bg-background/5" : "bg-background border border-border"}`}>
                  <div className={`text-[10px] uppercase tracking-[0.25em] mb-2 ${level === "PRIMARY" ? "text-accent" : "text-accent"}`}>Target metrics</div>
                  <ul className={`text-sm space-y-1 ${level === "PRIMARY" ? "text-background/90" : ""}`}>
                    {Object.entries(channel.successMetrics).filter(([_, v]) => v).map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-3"><span className={level === "PRIMARY" ? "text-background/60" : "text-muted-foreground"}>{k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</span><span>{v as string}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {channel.timeAllocation && (
                <div className={`p-4 rounded-lg ${level === "PRIMARY" ? "bg-background/5" : "bg-background border border-border"}`}>
                  <div className={`text-[10px] uppercase tracking-[0.25em] mb-2 flex items-center gap-1.5 ${level === "PRIMARY" ? "text-accent" : "text-accent"}`}><Clock className="h-3 w-3" /> Time</div>
                  {channel.timeAllocation.total && <div className={`font-display text-xl mb-2 ${level === "PRIMARY" ? "text-background" : ""}`}>{channel.timeAllocation.total}</div>}
                  {channel.timeAllocation.breakdown && (
                    <ul className={`text-xs space-y-1 ${level === "PRIMARY" ? "text-background/70" : "text-muted-foreground"}`}>
                      {Object.entries(channel.timeAllocation.breakdown).filter(([_, v]) => v).map(([k, v]) => (
                        <li key={k}>• {k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}: {v as string}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ChannelsTab() {
  const { strategy, setEnhanced, saveNow } = useStrategyEditor();
  const [regenerating, setRegenerating] = useState(false);
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const cs = ef.channelStrategy;

  if (!cs?.primary?.platform) {
    return (
      <Card className="p-10 border-dashed border-border bg-background text-center">
        <h3 className="font-display text-2xl mb-2">No channel strategy yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Generate your execution plan to map your primary, secondary and tertiary channels with rationale, schedule and time allocation.</p>
      </Card>
    );
  }

  const time = cs.totalTimeWithMOXIE;

  // Validation: detect malformed channel data (strings instead of structured objects).
  const validateChannel = (ch: any, level: string): string[] => {
    const issues: string[] = [];
    if (!ch) return issues;
    if (typeof ch === "string") { issues.push(`${level} channel is a plain string instead of a structured object`); return issues; }
    if (ch.contentStrategy && typeof ch.contentStrategy === "string") issues.push(`${level} contentStrategy is a string (expected object with frequency/types/tone)`);
    if (ch.postingSchedule && typeof ch.postingSchedule === "string") issues.push(`${level} postingSchedule is a string (expected array of schedule entries)`);
    if (ch.successMetrics && typeof ch.successMetrics === "string") issues.push(`${level} successMetrics is a string (expected object)`);
    if (ch.timeAllocation && typeof ch.timeAllocation === "string") issues.push(`${level} timeAllocation is a string (expected object)`);
    if (ch.rationale && typeof ch.rationale === "string") issues.push(`${level} rationale is a string (expected array)`);
    return issues;
  };
  const issues = [
    ...validateChannel(cs.primary, "Primary"),
    ...validateChannel(cs.secondary, "Secondary"),
    ...validateChannel(cs.tertiary, "Tertiary"),
  ];

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-execution-plan", { body: { strategy } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const merged = {
        ...ef,
        quarterlyThemes: data.quarterlyThemes,
        contentCalendar: data.contentCalendar,
        channelStrategy: data.channelStrategy,
        successMetrics: data.successMetrics,
        actionPlan: data.actionPlan,
      };
      setEnhanced([], merged);
      await saveNow();
      toast.success("Channels regenerated", { description: "Channel strategy has been rebuilt with structured data." });
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't regenerate channels", { description: e?.message || "Try again in a moment." });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {issues.length > 0 && (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-display tracking-[-0.01em]">Channel data needs a refresh</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">Some channel fields came back unstructured from the last generation and won't render correctly:</p>
            <ul className="text-xs space-y-1 list-disc pl-4">
              {issues.map((iss, i) => <li key={i}>{iss}</li>)}
            </ul>
            <Button onClick={handleRegenerate} disabled={regenerating} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg mt-1">
              {regenerating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
              Regenerate Channels
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ChannelSection channel={cs.primary} level="PRIMARY" defaultOpen />
      <ChannelSection channel={cs.secondary} level="SECONDARY" />
      <ChannelSection channel={cs.tertiary} level="TERTIARY" />

      {time && (time.before || time.after || time.freed) && (
        <Card className="p-7 border-border shadow-soft bg-accent-soft/30">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-1">Time savings with MOXIE</div>
              <h3 className="font-display text-xl tracking-[-0.01em]">Reclaim your week</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Before</div>
              <div className="font-display text-2xl">{time.before || "—"}</div>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">After</div>
              <div className="font-display text-2xl">{time.after || "—"}</div>
            </div>
            <div className="p-4 rounded-lg bg-foreground text-background">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1">Freed up</div>
              <div className="font-display text-2xl">{time.freed || "—"}</div>
            </div>
          </div>
          {time.useFreedTimeFor && <p className="text-sm text-muted-foreground mt-4 italic">Use it for: {time.useFreedTimeFor}</p>}
        </Card>
      )}
    </div>
  );
}