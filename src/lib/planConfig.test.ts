import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GENERATION_LIMIT,
  PUBLISH_PLATFORMS,
  EMAIL_SEND_ENABLED,
  PLAN_LABEL,
  requiredPlanForPlatform,
  canPublishOn,
  currentMonthKey,
  type PlanId,
} from "./planConfig";

// ─── GENERATION_LIMIT ───────────────────────────────────────────
describe("GENERATION_LIMIT", () => {
  it("founding_member has a limit of 25", () => {
    expect(GENERATION_LIMIT.founding_member).toBe(25);
  });

  it("foundation has a limit of 100", () => {
    expect(GENERATION_LIMIT.foundation).toBe(100);
  });

  it("growth is null (unlimited)", () => {
    expect(GENERATION_LIMIT.growth).toBeNull();
  });

  it("scale is null (unlimited)", () => {
    expect(GENERATION_LIMIT.scale).toBeNull();
  });
});

// ─── PUBLISH_PLATFORMS ──────────────────────────────────────────
describe("PUBLISH_PLATFORMS", () => {
  it("founding_member has only linkedin", () => {
    expect(PUBLISH_PLATFORMS.founding_member).toEqual(["linkedin"]);
  });

  it("foundation has linkedin, facebook, and instagram", () => {
    expect(PUBLISH_PLATFORMS.foundation).toContain("linkedin");
    expect(PUBLISH_PLATFORMS.foundation).toContain("facebook");
    expect(PUBLISH_PLATFORMS.foundation).toContain("instagram");
    expect(PUBLISH_PLATFORMS.foundation).toHaveLength(3);
  });

  it("foundation does NOT have pinterest or threads", () => {
    expect(PUBLISH_PLATFORMS.foundation).not.toContain("pinterest");
    expect(PUBLISH_PLATFORMS.foundation).not.toContain("threads");
  });

  it("growth adds pinterest and threads on top of foundation platforms", () => {
    expect(PUBLISH_PLATFORMS.growth).toContain("linkedin");
    expect(PUBLISH_PLATFORMS.growth).toContain("facebook");
    expect(PUBLISH_PLATFORMS.growth).toContain("instagram");
    expect(PUBLISH_PLATFORMS.growth).toContain("pinterest");
    expect(PUBLISH_PLATFORMS.growth).toContain("threads");
    expect(PUBLISH_PLATFORMS.growth).toHaveLength(5);
  });

  it("growth does NOT have x", () => {
    expect(PUBLISH_PLATFORMS.growth).not.toContain("x");
  });

  it("scale adds x on top of all growth platforms", () => {
    expect(PUBLISH_PLATFORMS.scale).toContain("linkedin");
    expect(PUBLISH_PLATFORMS.scale).toContain("facebook");
    expect(PUBLISH_PLATFORMS.scale).toContain("instagram");
    expect(PUBLISH_PLATFORMS.scale).toContain("pinterest");
    expect(PUBLISH_PLATFORMS.scale).toContain("threads");
    expect(PUBLISH_PLATFORMS.scale).toContain("x");
    expect(PUBLISH_PLATFORMS.scale).toHaveLength(6);
  });
});

// ─── EMAIL_SEND_ENABLED ─────────────────────────────────────────
describe("EMAIL_SEND_ENABLED", () => {
  it("founding_member has email sending disabled", () => {
    expect(EMAIL_SEND_ENABLED.founding_member).toBe(false);
  });

  it("foundation has email sending enabled", () => {
    expect(EMAIL_SEND_ENABLED.foundation).toBe(true);
  });

  it("growth has email sending enabled", () => {
    expect(EMAIL_SEND_ENABLED.growth).toBe(true);
  });

  it("scale has email sending enabled", () => {
    expect(EMAIL_SEND_ENABLED.scale).toBe(true);
  });
});

// ─── PLAN_LABEL ─────────────────────────────────────────────────
describe("PLAN_LABEL", () => {
  it("founding_member label is 'Founding Member'", () => {
    expect(PLAN_LABEL.founding_member).toBe("Founding Member");
  });

  it("foundation label is 'Foundation'", () => {
    expect(PLAN_LABEL.foundation).toBe("Foundation");
  });

  it("growth label is 'Growth'", () => {
    expect(PLAN_LABEL.growth).toBe("Growth");
  });

  it("scale label is 'Scale'", () => {
    expect(PLAN_LABEL.scale).toBe("Scale");
  });

  it("all four plans have string labels", () => {
    const plans: PlanId[] = ["founding_member", "foundation", "growth", "scale"];
    for (const plan of plans) {
      expect(typeof PLAN_LABEL[plan]).toBe("string");
      expect(PLAN_LABEL[plan].length).toBeGreaterThan(0);
    }
  });
});

// ─── requiredPlanForPlatform ─────────────────────────────────────
describe("requiredPlanForPlatform", () => {
  it("linkedin requires founding_member", () => {
    expect(requiredPlanForPlatform("linkedin")).toBe("founding_member");
  });

  it("facebook requires foundation", () => {
    expect(requiredPlanForPlatform("facebook")).toBe("foundation");
  });

  it("instagram requires foundation", () => {
    expect(requiredPlanForPlatform("instagram")).toBe("foundation");
  });

  it("pinterest requires growth", () => {
    expect(requiredPlanForPlatform("pinterest")).toBe("growth");
  });

  it("threads requires growth", () => {
    expect(requiredPlanForPlatform("threads")).toBe("growth");
  });

  it("x requires scale", () => {
    expect(requiredPlanForPlatform("x")).toBe("scale");
  });

  it("twitter requires scale", () => {
    expect(requiredPlanForPlatform("twitter")).toBe("scale");
  });

  it("unknown platform returns null", () => {
    expect(requiredPlanForPlatform("tiktok")).toBeNull();
    expect(requiredPlanForPlatform("youtube")).toBeNull();
    expect(requiredPlanForPlatform("")).toBeNull();
    expect(requiredPlanForPlatform("snapchat")).toBeNull();
  });

  it("is case-insensitive: 'LinkedIn' returns founding_member", () => {
    expect(requiredPlanForPlatform("LinkedIn")).toBe("founding_member");
  });

  it("is case-insensitive: 'FACEBOOK' returns foundation", () => {
    expect(requiredPlanForPlatform("FACEBOOK")).toBe("foundation");
  });

  it("is case-insensitive: 'Pinterest' returns growth", () => {
    expect(requiredPlanForPlatform("Pinterest")).toBe("growth");
  });

  it("is case-insensitive: 'X' returns scale", () => {
    expect(requiredPlanForPlatform("X")).toBe("scale");
  });

  it("is case-insensitive: 'Twitter' returns scale", () => {
    expect(requiredPlanForPlatform("Twitter")).toBe("scale");
  });
});

// ─── canPublishOn ────────────────────────────────────────────────
describe("canPublishOn", () => {
  it("founding_member can publish on linkedin", () => {
    expect(canPublishOn("founding_member", "linkedin")).toBe(true);
  });

  it("founding_member cannot publish on facebook", () => {
    expect(canPublishOn("founding_member", "facebook")).toBe(false);
  });

  it("founding_member cannot publish on instagram", () => {
    expect(canPublishOn("founding_member", "instagram")).toBe(false);
  });

  it("founding_member cannot publish on pinterest", () => {
    expect(canPublishOn("founding_member", "pinterest")).toBe(false);
  });

  it("founding_member cannot publish on x", () => {
    expect(canPublishOn("founding_member", "x")).toBe(false);
  });

  it("foundation can publish on linkedin", () => {
    expect(canPublishOn("foundation", "linkedin")).toBe(true);
  });

  it("foundation can publish on facebook", () => {
    expect(canPublishOn("foundation", "facebook")).toBe(true);
  });

  it("foundation can publish on instagram", () => {
    expect(canPublishOn("foundation", "instagram")).toBe(true);
  });

  it("foundation cannot publish on pinterest", () => {
    expect(canPublishOn("foundation", "pinterest")).toBe(false);
  });

  it("foundation cannot publish on threads", () => {
    expect(canPublishOn("foundation", "threads")).toBe(false);
  });

  it("growth can publish on linkedin", () => {
    expect(canPublishOn("growth", "linkedin")).toBe(true);
  });

  it("growth can publish on facebook", () => {
    expect(canPublishOn("growth", "facebook")).toBe(true);
  });

  it("growth can publish on instagram", () => {
    expect(canPublishOn("growth", "instagram")).toBe(true);
  });

  it("growth can publish on pinterest", () => {
    expect(canPublishOn("growth", "pinterest")).toBe(true);
  });

  it("growth can publish on threads", () => {
    expect(canPublishOn("growth", "threads")).toBe(true);
  });

  it("growth cannot publish on x", () => {
    expect(canPublishOn("growth", "x")).toBe(false);
  });

  it("scale can publish on all platforms", () => {
    const all = ["linkedin", "facebook", "instagram", "pinterest", "threads", "x"];
    for (const p of all) {
      expect(canPublishOn("scale", p)).toBe(true);
    }
  });

  it("unknown platform returns false for any plan", () => {
    expect(canPublishOn("scale", "tiktok")).toBe(false);
    expect(canPublishOn("growth", "youtube")).toBe(false);
    expect(canPublishOn("founding_member", "snapchat")).toBe(false);
  });

  it("is case-insensitive: 'LINKEDIN' works for founding_member", () => {
    expect(canPublishOn("founding_member", "LINKEDIN")).toBe(true);
  });

  it("is case-insensitive: 'Facebook' works for foundation", () => {
    expect(canPublishOn("foundation", "Facebook")).toBe(true);
  });

  it("is case-insensitive: mixed case unknown still returns false", () => {
    expect(canPublishOn("scale", "TikTok")).toBe(false);
  });
});

// ─── currentMonthKey ─────────────────────────────────────────────
describe("currentMonthKey", () => {
  it("returns a string in YYYY-MM format", () => {
    const key = currentMonthKey();
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });

  it("month is zero-padded for single-digit months", () => {
    const jan = new Date(2026, 0, 15);  // January
    expect(currentMonthKey(jan)).toBe("2026-01");
  });

  it("month is zero-padded: February is '02'", () => {
    const feb = new Date(2026, 1, 1);
    expect(currentMonthKey(feb)).toBe("2026-02");
  });

  it("double-digit months are not padded incorrectly", () => {
    const nov = new Date(2026, 10, 8);  // November
    expect(currentMonthKey(nov)).toBe("2026-11");
  });

  it("December returns '12'", () => {
    const dec = new Date(2026, 11, 1);
    expect(currentMonthKey(dec)).toBe("2026-12");
  });

  it("accepts a custom date and returns the correct key", () => {
    const custom = new Date(2024, 2, 20);  // March 2024
    expect(currentMonthKey(custom)).toBe("2024-03");
  });

  it("custom date in 2026 November matches expected key", () => {
    const d = new Date(2026, 10, 8);  // Nov 2026
    expect(currentMonthKey(d)).toBe("2026-11");
  });

  it("year component is always 4 digits", () => {
    const key = currentMonthKey(new Date(2026, 5, 1));
    const [year] = key.split("-");
    expect(year).toHaveLength(4);
  });
});
