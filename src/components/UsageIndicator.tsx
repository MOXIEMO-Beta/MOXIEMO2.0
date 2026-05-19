import { Link } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { GENERATION_LIMIT, PLAN_LABEL } from "@/lib/planConfig";
import { cn } from "@/lib/utils";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function nextResetLabel(resetDate?: string | null): string {
  const d = resetDate ? new Date(resetDate) : null;
  if (!d || isNaN(d.getTime())) {
    // Fallback: 30 days from today
    const fb = new Date();
    fb.setDate(fb.getDate() + 30);
    return `Resets ${fb.toLocaleString(undefined, { month: "long" })} ${ordinal(fb.getDate())}`;
  }
  const month = d.toLocaleString(undefined, { month: "long" });
  return `Resets ${month} ${ordinal(d.getDate())}`;
}

export function UsageIndicator({ compact = false }: { compact?: boolean }) {
  const { plan, usage, loading } = usePlan();
  if (loading) return null;

  const limit = GENERATION_LIMIT[plan];
  const used = usage?.generations_used ?? 0;
  const unlimited = limit === null;
  const remaining = unlimited ? null : Math.max(0, (limit ?? 0) - used);
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / (limit || 1)) * 100));

  const overEighty = !unlimited && pct >= 80 && pct < 100;
  const atLimit = !unlimited && used >= (limit ?? 0);

  const barColor = unlimited
    ? "bg-[#C9A96E]" // gold for unlimited
    : atLimit
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
        <>
          <div className="mt-1.5 text-xs text-foreground font-medium">Unlimited generations</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className={cn("h-full", barColor)} style={{ width: "100%" }} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{remaining}</span> generation{remaining === 1 ? "" : "s"} remaining this month
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className={cn("h-full transition-all", barColor)} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[10.5px] text-muted-foreground">{nextResetLabel(usage?.reset_date)}</div>
          <Link
            to="/pricing"
            className="mt-1.5 inline-block text-[11px] font-medium text-brand-coral hover:underline"
          >
            Upgrade your plan →
          </Link>
        </>
      )}
    </div>
  );
}