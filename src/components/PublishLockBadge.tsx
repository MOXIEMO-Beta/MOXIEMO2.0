import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_LABEL, PlanId, requiredPlanForPlatform } from "@/lib/planConfig";

type Props = {
  /** Platform name like "facebook", or use `feature` for non-platform locks like email send. */
  platform?: string;
  /** For non-platform locks: provide the upgrade target plan + label. */
  feature?: { label: string; requiredPlan: PlanId };
  className?: string;
};

export function PublishLockBadge({ platform, feature, className }: Props) {
  let label: string;
  if (feature) {
    label = `Upgrade to ${PLAN_LABEL[feature.requiredPlan]} to ${feature.label}`;
  } else if (platform) {
    const req = requiredPlanForPlatform(platform) ?? "foundation";
    const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
    label = `Upgrade to ${PLAN_LABEL[req]} to publish on ${platformLabel}`;
  } else {
    label = "Upgrade your plan";
  }

  return (
    <Link
      to="/pricing"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-coral/30 bg-brand-coral-soft px-2.5 py-1 text-[11px] font-medium text-brand-coral hover:bg-brand-coral/15 transition",
        className,
      )}
    >
      <Lock className="h-3 w-3" />
      {label}
    </Link>
  );
}