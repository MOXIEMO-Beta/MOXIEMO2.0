import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Area = { key: string; label: string; section: string; points: number; max: number; refineKey: string };

interface Props {
  score?: number | null;
  weakAreas?: Area[];
  strongAreas?: Area[];
  onRefine: (area: Area) => void;
  onDismiss?: () => void;
}

function rating(score: number) {
  if (score >= 90) return { label: "Excellent foundation", tone: "text-accent" };
  if (score >= 75) return { label: "Solid foundation", tone: "text-accent" };
  if (score >= 60) return { label: "Workable — could be sharper", tone: "text-foreground" };
  return { label: "Needs refinement", tone: "text-destructive" };
}

export function StrategyStrengthCard({ score, weakAreas = [], strongAreas = [], onRefine, onDismiss }: Props) {
  if (score == null) return null;
  const r = rating(score);

  return (
    <Card className="p-7 border-border shadow-soft mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Strategy strength
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl tracking-[-0.03em]">{score}</span>
            <span className="text-muted-foreground text-sm">/ 100</span>
            <span className={cn("text-sm font-medium ml-2", r.tone)}>{r.label}</span>
          </div>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground self-start">Dismiss</Button>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
        <div
          className={cn("h-full transition-all duration-700", score >= 75 ? "bg-accent" : score >= 60 ? "bg-foreground/60" : "bg-destructive")}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strongAreas.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Strong areas</div>
            <ul className="space-y-2">
              {strongAreas.map((a) => (
                <li key={a.key} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span>{a.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{a.points}/{a.max}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weakAreas.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Could be stronger</div>
            <ul className="space-y-2">
              {weakAreas.map((a) => (
                <li key={a.key} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-foreground/60 shrink-0" />
                  <span>{a.label}</span>
                  <span className="text-xs text-muted-foreground">({a.points}/{a.max})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-xs text-accent hover:text-accent hover:bg-accent-soft/50"
                    onClick={() => onRefine(a)}
                  >
                    Refine →
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {weakAreas.length > 0 && score < 75 && (
        <div className="mt-6 pt-5 border-t border-border text-sm text-muted-foreground">
          Your strategy will work as-is. Refining the {weakAreas.length === 1 ? "area" : `${weakAreas.length} areas`} above will sharpen positioning and make content more distinctive — usually 2-3 minutes each.
        </div>
      )}
    </Card>
  );
}