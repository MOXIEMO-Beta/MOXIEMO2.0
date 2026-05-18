export type PlanId = "founding_member" | "foundation" | "growth" | "scale";

export const PLAN_LABEL: Record<PlanId, string> = {
  founding_member: "Founding Member",
  foundation: "Foundation",
  growth: "Growth",
  scale: "Scale",
};

/** null = unlimited */
export const GENERATION_LIMIT: Record<PlanId, number | null> = {
  founding_member: 25,
  foundation: 100,
  growth: null,
  scale: null,
};

export const PUBLISH_PLATFORMS: Record<PlanId, string[]> = {
  founding_member: ["linkedin"],
  foundation: ["linkedin", "facebook", "instagram"],
  growth: ["linkedin", "facebook", "instagram", "pinterest", "threads"],
  scale: ["linkedin", "facebook", "instagram", "pinterest", "threads", "x"],
};

export const EMAIL_SEND_ENABLED: Record<PlanId, boolean> = {
  founding_member: false,
  foundation: true,
  growth: true,
  scale: true,
};

/** Which plan unlocks a given platform — used for "Upgrade to X" badge copy. */
export function requiredPlanForPlatform(platform: string): PlanId | null {
  const p = platform.toLowerCase();
  if (["linkedin"].includes(p)) return "founding_member";
  if (["facebook", "instagram"].includes(p)) return "foundation";
  if (["pinterest", "threads"].includes(p)) return "growth";
  if (["x", "twitter"].includes(p)) return "scale";
  return null;
}

export function canPublishOn(plan: PlanId, platform: string): boolean {
  return PUBLISH_PLATFORMS[plan]?.includes(platform.toLowerCase()) ?? false;
}

export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}