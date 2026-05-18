import { Link } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { GENERATION_LIMIT, PLAN_LABEL } from "@/lib/planConfig";
import { cn } from "@/lib/utils";

export function UsageIndicator({ compact = false }: { compact?: boolean }) {
  const { plan, usage, loading } = usePlan();
  if (loading) return null;

  const limit = GENERATION_LIMIT[plan];
  const used = usage?.generations_used ?? 0;
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit!) * 100));

  const overEighty = !unlimited && pct >= 80 && pct < 100;
  const atLimit = !unlimited && used >= (limit ?? 0);

  const barColor = atLimit
    ? "bg-brand-coral"
    : overEighty
    ? "bg-[#C9A96E]"
    : "bg-foreground/70";

  return (
    <div className={cn("rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3", compact && "p-2.5")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</span>
        <span className="text-xs font-semibold text-foreground">{PLAN_LABEL[plan]}</span>
      </div>
      {unlimited ? (
        <div className="mt-1.5 text-xs text-muted-foreground">Unlimited generations</div>
      ) : (
        <>
          <div className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{used}</span> of {limit} generations used this month
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className={cn("h-full transition-all", barColor)} style={{ width: `${pct}%` }} />
          </div>
          <Link
            to="/pricing"
            className="mt-2 inline-block text-[11px] font-medium text-brand-coral hover:underline"
          >
            Upgrade your plan →
          </Link>
        </>
      )}
    </div>
  );
}