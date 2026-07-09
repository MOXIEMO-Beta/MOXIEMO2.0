import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Rocket, Target, Megaphone, Radio } from "lucide-react";
import { toast } from "sonner";

// Lane 3 (Offer GTM) additive strategy sections. Renders on top of the
// standard Overview tab when strategy_lane === "offer_gtm".
// Reads additive keys the synthesizer writes into enhanced_foundation:
// offerPositioning, launchMessaging, channelPlan, firstMove.

function isNonEmpty(v: any): boolean {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v).some((x) => isNonEmpty(x));
  return String(v).trim().length > 0;
}

export function OfferSections({ strategy }: { strategy: any }) {
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const op = ef.offerPositioning || {};
  const lm = ef.launchMessaging || {};
  const cp = ef.channelPlan || {};
  const fm = ef.firstMove || {};

  const hasAny =
    isNonEmpty(op) || isNonEmpty(lm) || isNonEmpty(cp) || isNonEmpty(fm);
  if (!hasAny) return null;

  const copyFirstMove = async () => {
    try {
      await navigator.clipboard.writeText(String(fm.copy || ""));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* First move — the closing beat, rendered prominently at the top */}
      {isNonEmpty(fm) && (
        <Card className="report-card p-7 border-accent/40 shadow-soft" style={{ background: "linear-gradient(180deg, rgba(232,90,70,0.06) 0%, rgba(232,90,70,0.02) 100%)" }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-accent mb-2">
                <Rocket className="h-3 w-3" /> Your first move this week
              </div>
              <div className="flex items-center gap-2">
                {fm.type && (
                  <Badge className="bg-accent text-background border-0 hover:bg-accent capitalize">{String(fm.type)}</Badge>
                )}
                {fm.audience && (
                  <span className="text-sm text-muted-foreground">To: {fm.audience}</span>
                )}
              </div>
            </div>
            {fm.copy && (
              <Button size="sm" variant="outline" onClick={copyFirstMove}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
              </Button>
            )}
          </div>
          {fm.copy && (
            <div className="rounded-xl border border-border bg-background p-5 whitespace-pre-wrap text-sm leading-relaxed font-mono">
              {fm.copy}
            </div>
          )}
          {fm.why && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              <span className="uppercase tracking-[0.2em] mr-2">Why now:</span>{fm.why}
            </p>
          )}
        </Card>
      )}

      {/* Offer positioning */}
      {isNonEmpty(op) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            <Target className="h-3.5 w-3.5" /> Offer positioning
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {op.offer && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">The offer</div>
                <p className="text-sm leading-relaxed">{op.offer}</p>
              </div>
            )}
            {op.transformation && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">Transformation</div>
                <p className="text-sm leading-relaxed">{op.transformation}</p>
              </div>
            )}
            {op.priceFraming && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">Price framing</div>
                <p className="text-sm leading-relaxed">{op.priceFraming}</p>
              </div>
            )}
            {op.againstAlternatives && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">Against the alternatives</div>
                <p className="text-sm leading-relaxed">{op.againstAlternatives}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Launch messaging */}
      {isNonEmpty(lm) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            <Megaphone className="h-3.5 w-3.5" /> Launch messaging
          </div>
          {lm.coreMessage && (
            <p className="font-display text-xl tracking-[-0.01em] mb-5">{lm.coreMessage}</p>
          )}
          {Array.isArray(lm.angles) && lm.angles.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Angles</div>
              <div className="space-y-3">
                {lm.angles.map((a: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-medium mb-1">{a.angle}</p>
                    {a.buyerLanguage && (
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{a.buyerLanguage}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(lm.objectionCounters) && lm.objectionCounters.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Objection counters</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lm.objectionCounters.map((o: any, i: number) => (
                  <div key={i} className="rounded-lg bg-muted/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Objection</p>
                    <p className="text-sm mb-2">{o.objection}</p>
                    <p className="text-xs uppercase tracking-wider text-accent mb-1">Counter</p>
                    <p className="text-sm">{o.counter}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Channel plan */}
      {isNonEmpty(cp) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            <Radio className="h-3.5 w-3.5" /> Channel plan
          </div>
          {cp.primaryChannel && (
            <div className="rounded-xl bg-accent-soft/40 p-5 mb-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Primary channel</div>
              <p className="font-display text-xl tracking-[-0.01em] mb-1">{cp.primaryChannel}</p>
              {cp.rationale && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{cp.rationale}</p>
              )}
              {cp.cadence && (
                <p className="text-xs text-foreground"><span className="uppercase tracking-[0.2em] text-muted-foreground mr-2">Cadence:</span>{cp.cadence}</p>
              )}
            </div>
          )}
          {Array.isArray(cp.channels) && cp.channels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cp.channels.map((c: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-background">
                  <p className="font-medium text-sm mb-1">{c.name}</p>
                  {c.why && <p className="text-xs text-muted-foreground leading-relaxed mb-2">{c.why}</p>}
                  {c.cadence && (
                    <p className="text-[11px] text-muted-foreground"><span className="uppercase tracking-wider mr-1">Cadence:</span>{c.cadence}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}