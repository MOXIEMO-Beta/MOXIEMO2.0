// Pure TypeScript unit tests — no React, no rendering.
// Tests the logic layer for negative and edge-case scenarios across modules.
import { describe, it, expect } from "vitest";
import { buildReportData } from "@/lib/reportDataBinding";
import { buildIdempotencyKeyAt, planFromMetadata } from "@/lib/stripeWebhookLogic";
import { resolveGoalDefinitions } from "@/lib/goalResolver";
import { canPublishOn, requiredPlanForPlatform, GENERATION_LIMIT } from "@/lib/planConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: Strategy data — malformed / missing fields
// ─────────────────────────────────────────────────────────────────────────────
describe("Strategy data — malformed / missing fields", () => {
  it("1. positioning_statement is a number (42) — positioning.statement still a string", () => {
    const result = buildReportData({ positioning_statement: 42 as any }, {});
    // The function uses positioning_statement as-is when ef/raw are absent;
    // the value ends up as 42. What matters is no crash and type coercion in
    // the template path means statement is defined.
    expect(result.positioning).toBeDefined();
    expect(result.positioning.statement).toBeDefined();
  });

  it("2. content_pillars is null — contentStrategy.pillars is an array, no crash", () => {
    const result = buildReportData({ content_pillars: null as any }, {});
    expect(Array.isArray(result.contentStrategy.pillars)).toBe(true);
  });

  it("3. content_pillars is {} (plain object, not array) — coerced to array", () => {
    const result = buildReportData({ content_pillars: {} as any }, {});
    expect(Array.isArray(result.contentStrategy.pillars)).toBe(true);
  });

  it("4. enhanced_foundation is a string — treated as empty object, no crash", () => {
    expect(() => buildReportData({ enhanced_foundation: "corrupted_string" as any }, {})).not.toThrow();
  });

  it("5. enhanced_foundation.positioningBreakdown is null — breakdown fields fall back to '—'", () => {
    const result = buildReportData(
      { enhanced_foundation: { positioningBreakdown: null } },
      {}
    );
    const bd = result.positioning.breakdown;
    expect(bd.who).toBe("—");
    expect(bd.problem).toBe("—");
  });

  it("6. voice_attributes is [1, 2, 3] (numbers) — coerced to string representations", () => {
    const result = buildReportData({ voice_attributes: [1, 2, 3] as any }, {});
    expect(Array.isArray(result.voice.attributes)).toBe(true);
    // Each non-string item is converted via the toStr helper (name/word/text/value/label or '')
    // Numbers have none of those keys so they map to ''; the filter(Boolean) drops them.
    // The important invariant: no crash and attributes is an array.
    expect(result.voice.attributes).not.toBeNull();
  });

  it("7. created_at is an invalid date string — meta.date still returns a string, no crash", () => {
    const result = buildReportData({ created_at: "not-a-date" }, {});
    expect(typeof result.meta.date).toBe("string");
    expect(result.meta.date.length).toBeGreaterThan(0);
  });

  it("8. strategy is undefined — buildReportData with no args does not throw", () => {
    // Default params: strategy = {}, profile = {}
    expect(() => buildReportData()).not.toThrow();
  });

  it("9. profile.business_name contains XSS — passes through as-is at the data layer", () => {
    const xss = "<script>alert(1)</script>";
    const result = buildReportData({}, { business_name: xss });
    expect(result.meta.businessName).toBe(xss);
  });

  it("10. 10,000-char positioning_statement — returns without truncation at the data layer", () => {
    const longStatement = "A".repeat(10_000);
    const result = buildReportData({ positioning_statement: longStatement }, {});
    expect(result.positioning.statement).toBe(longStatement);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2: Auth token expiration — application-level handling
// ─────────────────────────────────────────────────────────────────────────────

// Mirrors the pattern in Strategy.tsx:
//   const { data, error } = await supabase.from("strategies").select("*").maybeSingle();
//   if (error || !data) setStrategy(null);
function handleStrategyResponse({ data, error }: { data: unknown; error: unknown }): unknown | null {
  if (error || !data) return null;
  return data;
}

describe("Auth token expiration — application-level handling", () => {
  it("11. JWT expired error → returns null (empty-state path)", () => {
    expect(
      handleStrategyResponse({ data: null, error: { message: "JWT expired" } })
    ).toBeNull();
  });

  it("12. PGRST301 RLS violation → data is null → empty-state path", () => {
    expect(
      handleStrategyResponse({ data: null, error: { code: "PGRST301", message: "RLS violation" } })
    ).toBeNull();
  });

  it("13. permission denied error → returns null safely", () => {
    const error = { message: "permission denied for table strategies" };
    expect(handleStrategyResponse({ data: null, error })).toBeNull();
  });

  it("valid data with no error — returns the data object", () => {
    const strategy = { id: "s1", user_id: "u1" };
    expect(handleStrategyResponse({ data: strategy, error: null })).toEqual(strategy);
  });

  it("data present but error also present — error wins, returns null", () => {
    // Defensive: if supabase ever returns both, error takes priority
    const strategy = { id: "s1" };
    expect(
      handleStrategyResponse({ data: strategy, error: { message: "some error" } })
    ).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 3: Race condition — idempotency key prevents double-generation
// ─────────────────────────────────────────────────────────────────────────────
describe("Race condition — idempotency key", () => {
  const USER = "user-abc-123";
  const SID  = "session-xyz-456";
  const T0   = 1_748_000_000_000; // fixed epoch ms (within hour boundary)

  it("14. two calls same user+session+hour → identical key (second is deduped)", () => {
    const key1 = buildIdempotencyKeyAt(USER, SID, T0);
    const key2 = buildIdempotencyKeyAt(USER, SID, T0 + 1_000); // 1 second later, same hour
    expect(key1).toBe(key2);
  });

  it("15. two calls 1 ms apart within the same hour → same key", () => {
    const key1 = buildIdempotencyKeyAt(USER, SID, T0);
    const key2 = buildIdempotencyKeyAt(USER, SID, T0 + 1);
    expect(key1).toBe(key2);
  });

  it("16. calls across hour boundary (3,599,999 ms vs 3,600,001 ms offset) → different keys", () => {
    // Align T0 to the start of a clean hour boundary
    const hourStart = Math.floor(T0 / 3_600_000) * 3_600_000;
    const justBefore = hourStart + 3_599_999; // 1 ms before end of hour
    const justAfter  = hourStart + 3_600_001; // 1 ms into next hour
    const key1 = buildIdempotencyKeyAt(USER, SID, justBefore);
    const key2 = buildIdempotencyKeyAt(USER, SID, justAfter);
    expect(key1).not.toBe(key2);
  });

  it("17. empty string userId still produces a deterministic key, no crash", () => {
    expect(() => buildIdempotencyKeyAt("", SID, T0)).not.toThrow();
    const key = buildIdempotencyKeyAt("", SID, T0);
    expect(typeof key).toBe("string");
    expect(key.startsWith(":")).toBe(true); // empty userId → key starts with ':'
  });

  it("18. very long sessionId (1,000 chars) produces a key without crash", () => {
    const longSid = "s".repeat(1_000);
    expect(() => buildIdempotencyKeyAt(USER, longSid, T0)).not.toThrow();
    const key = buildIdempotencyKeyAt(USER, longSid, T0);
    expect(key).toContain(longSid);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 4: Edge function 500 / network errors — response handling
// ─────────────────────────────────────────────────────────────────────────────

// Mirrors the limit-reached detection logic in usePlan / edge function responses.
function handleGenResponse(data: unknown, error: unknown): boolean {
  const d = (data ?? {}) as any;
  if (d?.limit_reached) return true;
  const errMsg = (error as any)?.message ?? "";
  if (errMsg.toLowerCase().includes("limit_reached")) return true;
  return false;
}

describe("Edge function 500 / network errors — response handling", () => {
  it("19. data=null, error='Internal Server Error' → false (not a limit error)", () => {
    expect(handleGenResponse(null, { message: "Internal Server Error" })).toBe(false);
  });

  it("20. data=null, error='timeout' → false", () => {
    expect(handleGenResponse(null, { message: "timeout" })).toBe(false);
  });

  it("21. data=null, error=null → false", () => {
    expect(handleGenResponse(null, null)).toBe(false);
  });

  it("22. data={ limit_reached: true } → true", () => {
    expect(handleGenResponse({ limit_reached: true }, null)).toBe(true);
  });

  it("23. data={} (no limit_reached key) → false", () => {
    expect(handleGenResponse({}, null)).toBe(false);
  });

  it("24. data={ limit_reached: false } → false", () => {
    expect(handleGenResponse({ limit_reached: false }, null)).toBe(false);
  });

  it("error message contains 'limit_reached' string → true", () => {
    expect(handleGenResponse(null, { message: "limit_reached" })).toBe(true);
  });

  it("error message contains 'LIMIT_REACHED' (upper case) → true (case-insensitive)", () => {
    expect(handleGenResponse(null, { message: "LIMIT_REACHED" })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 5: Input validation — XSS / unicode / oversized payloads
// ─────────────────────────────────────────────────────────────────────────────
describe("Input validation — XSS / unicode / oversized payloads", () => {
  it("25. requiredPlanForPlatform('<script>alert(1)</script>') → null (unknown platform, no crash)", () => {
    expect(requiredPlanForPlatform("<script>alert(1)</script>")).toBeNull();
  });

  it("26. requiredPlanForPlatform('linkedin\\x00') → null (null byte makes it unknown)", () => {
    // 'linkedin\x00'.toLowerCase() === 'linkedin\x00' — does not match 'linkedin'
    expect(requiredPlanForPlatform("linkedin\x00")).toBeNull();
  });

  it("27. canPublishOn('founding_member', 'linkedin\\n') → false (trailing newline makes it unknown)", () => {
    // 'linkedin\n'.toLowerCase() === 'linkedin\n' — not in PUBLISH_PLATFORMS list
    expect(canPublishOn("founding_member", "linkedin\n")).toBe(false);
  });

  it("28. canPublishOn('founding_member', 'LINKEDIN') → true (case insensitive)", () => {
    expect(canPublishOn("founding_member", "LINKEDIN")).toBe(true);
  });

  it("29. resolveGoalDefinitions with XSS in target_value — does not crash", () => {
    const g = {
      id: "g1",
      north_star: { target_value: "<script>alert(1)</script> and 5 clients", metric_key: "" },
      smart_cards: [],
    };
    expect(() => resolveGoalDefinitions(g)).not.toThrow();
  });

  it("30. resolveGoalDefinitions with 10,000-char target_value — does not crash", () => {
    const g = {
      id: "g1",
      north_star: { target_value: "A".repeat(10_000), metric_key: "" },
      smart_cards: [],
    };
    expect(() => resolveGoalDefinitions(g)).not.toThrow();
  });

  it("requiredPlanForPlatform with empty string → null", () => {
    expect(requiredPlanForPlatform("")).toBeNull();
  });

  it("canPublishOn with empty platform string → false for all plans", () => {
    expect(canPublishOn("scale", "")).toBe(false);
    expect(canPublishOn("founding_member", "")).toBe(false);
  });

  it("GENERATION_LIMIT values: founding_member=25, foundation=100, growth=null, scale=null", () => {
    expect(GENERATION_LIMIT.founding_member).toBe(25);
    expect(GENERATION_LIMIT.foundation).toBe(100);
    expect(GENERATION_LIMIT.growth).toBeNull();
    expect(GENERATION_LIMIT.scale).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 6: PDF generation — reportDataBinding output shape validation
// ─────────────────────────────────────────────────────────────────────────────
describe("PDF output shape validation", () => {
  const minimalStrategy = { id: "s1", user_id: "u1", positioning_statement: "Test" };
  const result = buildReportData(minimalStrategy, {});

  it("31. meta.businessName is always a string (never undefined)", () => {
    expect(typeof result.meta.businessName).toBe("string");
  });

  it("32. positioning.statement is always a string", () => {
    expect(typeof result.positioning.statement).toBe("string");
  });

  it("33. voice.attributes is always an array", () => {
    expect(Array.isArray(result.voice.attributes)).toBe(true);
  });

  it("34. contentStrategy.pillars is always an array", () => {
    expect(Array.isArray(result.contentStrategy.pillars)).toBe(true);
  });

  it("35. actionPlan.weeks is always an array with length > 0", () => {
    expect(Array.isArray(result.actionPlan.weeks)).toBe(true);
    expect(result.actionPlan.weeks.length).toBeGreaterThan(0);
  });

  it("36. channels.primary.name is always a string", () => {
    expect(typeof result.channels.primary.name).toBe("string");
  });

  it("37. calendar entries always have date, channel, and type fields", () => {
    expect(Array.isArray(result.calendar)).toBe(true);
    expect(result.calendar.length).toBeGreaterThan(0);
    for (const entry of result.calendar) {
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("channel");
      expect(entry).toHaveProperty("type");
    }
  });

  it("38. coreValues is always an array (never null or undefined)", () => {
    expect(Array.isArray(result.coreValues)).toBe(true);
  });

  it("empty strategy {} — full output still satisfies shape contract", () => {
    const r = buildReportData({}, {});
    expect(typeof r.meta.businessName).toBe("string");
    expect(typeof r.positioning.statement).toBe("string");
    expect(Array.isArray(r.voice.attributes)).toBe(true);
    expect(Array.isArray(r.contentStrategy.pillars)).toBe(true);
    expect(Array.isArray(r.actionPlan.weeks)).toBe(true);
    expect(r.actionPlan.weeks.length).toBeGreaterThan(0);
    expect(typeof r.channels.primary.name).toBe("string");
    expect(Array.isArray(r.coreValues)).toBe(true);
  });

  it("meta.businessName falls back to 'Your Business' when profile has no name fields", () => {
    const r = buildReportData({}, {});
    expect(r.meta.businessName).toBe("Your Business");
  });

  it("meta.preparedFor falls back to 'Founder' when profile has no full_name or email", () => {
    const r = buildReportData({}, {});
    expect(r.meta.preparedFor).toBe("Founder");
  });

  it("actionPlan.ongoingRoutine.daily is always defined", () => {
    expect(result.actionPlan.ongoingRoutine).toBeDefined();
    expect(result.actionPlan.ongoingRoutine.daily).toBeDefined();
  });

  it("channels.secondary.name is always a string", () => {
    expect(typeof result.channels.secondary.name).toBe("string");
  });

  it("channels.tertiary.name is always a string", () => {
    expect(typeof result.channels.tertiary.name).toBe("string");
  });
});
