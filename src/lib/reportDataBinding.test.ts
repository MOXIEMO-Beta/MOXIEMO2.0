import { describe, it, expect } from "vitest";
import { buildReportData } from "./reportDataBinding";

// ─── Helpers ─────────────────────────────────────────────────────
function makeStrategy(overrides: Record<string, any> = {}) {
  return {
    positioning_statement: "I help founders build authority.",
    ideal_client: "B2B founders",
    pain_point: "unclear messaging",
    transformation: "clear, revenue-driving brand",
    methodology: "The Clarity Framework",
    business_goal: "Reach $50K/month",
    primary_channel: "LinkedIn",
    posting_frequency: "7 posts/week",
    voice_attributes: ["Confident", "Direct", "Empathetic"],
    content_pillars: ["Authority", "Mindset", "Revenue"],
    core_values: [
      { name: "Integrity", decisionFilter: "Does this align?", description: "We act with integrity." },
    ],
    calendar_entries: [],
    enhanced_foundation: {},
    ...overrides,
  };
}

function makeProfile(overrides: Record<string, any> = {}) {
  return {
    full_name: "Jane Doe",
    business_name: "Jane Doe Consulting",
    email: "jane@example.com",
    ...overrides,
  };
}

// ─── Positive Cases ───────────────────────────────────────────────
describe("buildReportData — positive", () => {
  it("1. full strategy with all fields returns all sections populated", () => {
    const result = buildReportData(makeStrategy(), makeProfile());
    expect(result).toHaveProperty("meta");
    expect(result).toHaveProperty("positioning");
    expect(result).toHaveProperty("archetype");
    expect(result).toHaveProperty("coreValues");
    expect(result).toHaveProperty("voice");
    expect(result).toHaveProperty("contentStrategy");
    expect(result).toHaveProperty("calendar");
    expect(result).toHaveProperty("channels");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("actionPlan");
    expect(result).toHaveProperty("competitive");
    expect(result).toHaveProperty("messagingFormats");
  });

  it("2. positioning statement uses positioning_statement column when present", () => {
    const s = makeStrategy({ positioning_statement: "Direct positioning statement." });
    const result = buildReportData(s, makeProfile());
    expect(result.positioning.statement).toBe("Direct positioning statement.");
  });

  it("3. falls back to enhanced_foundation.positioningStatement when column missing", () => {
    const s = makeStrategy({
      positioning_statement: undefined,
      enhanced_foundation: { positioningStatement: "EF positioning statement." },
    });
    const result = buildReportData(s, makeProfile());
    expect(result.positioning.statement).toBe("EF positioning statement.");
  });

  it("4. falls back to template 'I help X overcome Y through Z' when nothing present", () => {
    const s = makeStrategy({
      positioning_statement: undefined,
      enhanced_foundation: {},
      ideal_client: "small business owners",
      pain_point: "burnout",
      methodology: "The 90-Day Method",
    });
    const result = buildReportData(s, makeProfile());
    expect(result.positioning.statement).toContain("I help");
    expect(result.positioning.statement).toContain("small business owners");
    expect(result.positioning.statement).toContain("burnout");
    expect(result.positioning.statement).toContain("The 90-Day Method");
  });

  it("5. buildMeta uses profile.business_name for reportTitle", () => {
    const result = buildReportData(makeStrategy(), makeProfile({ business_name: "Acme Co" }));
    expect(result.meta.reportTitle).toContain("Acme Co");
    expect(result.meta.businessName).toBe("Acme Co");
  });

  it("6. buildMeta falls back to profile.full_name when no business_name", () => {
    const result = buildReportData(
      makeStrategy(),
      makeProfile({ business_name: undefined, full_name: "John Smith" })
    );
    expect(result.meta.businessName).toBe("John Smith");
    expect(result.meta.reportTitle).toContain("John Smith");
  });

  it("7. archetype primary defaults to 'The Sage' when no archetype data", () => {
    const s = makeStrategy({ enhanced_foundation: {}, archetype: undefined });
    const result = buildReportData(s, makeProfile());
    expect(result.archetype.primary).toBe("The Sage");
  });

  it("8. buildCoreValues returns empty array when no core_values", () => {
    const s = makeStrategy({ core_values: undefined, enhanced_foundation: {} });
    const result = buildReportData(s, makeProfile());
    expect(result.coreValues).toEqual([]);
  });

  it("9. buildCoreValues maps array of objects to { name, decisionFilter, description }", () => {
    const s = makeStrategy({
      core_values: [
        { name: "Courage", decisionFilter: "Am I being brave?", description: "Lead with courage." },
        { name: "Trust", decisionFilter: "Is this trustworthy?", description: "Build trust first." },
      ],
    });
    const result = buildReportData(s, makeProfile());
    expect(result.coreValues).toHaveLength(2);
    expect(result.coreValues[0]).toMatchObject({
      name: "Courage",
      decisionFilter: "Am I being brave?",
      description: "Lead with courage.",
    });
    expect(result.coreValues[1]).toMatchObject({
      name: "Trust",
      decisionFilter: "Is this trustworthy?",
      description: "Build trust first.",
    });
  });

  it("10. buildCalendar prefers enhanced_foundation.contentCalendar when longer than calendar_entries", () => {
    const efCalendar = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-11-${String(i + 1).padStart(2, "0")}`,
      dayName: "Mon",
      channel: "LinkedIn",
      contentType: "Text Post",
      title: `EF Post ${i + 1}`,
    }));
    const ceCalendar = Array.from({ length: 3 }, (_, i) => ({
      date: `2026-11-${String(i + 1).padStart(2, "0")}`,
      dayName: "Mon",
      channel: "LinkedIn",
      type: "Text Post",
      title: `CE Post ${i + 1}`,
    }));
    const s = makeStrategy({
      calendar_entries: ceCalendar,
      enhanced_foundation: { contentCalendar: efCalendar },
    });
    const result = buildReportData(s, makeProfile());
    expect(result.calendar).toHaveLength(10);
    expect(result.calendar[0].title).toContain("EF Post");
  });

  it("11. buildCalendar falls back to scaffold (18 entries, skips Sundays) when no calendar data", () => {
    const s = makeStrategy({ calendar_entries: [], enhanced_foundation: {} });
    const result = buildReportData(s, makeProfile());
    expect(result.calendar).toHaveLength(18);
    // No Sunday entries in scaffold
    const sundays = result.calendar.filter((e: any) => e.dayName === "Sun");
    expect(sundays).toHaveLength(0);
  });

  it("12. buildChannels uses primary_channel from strategy", () => {
    const s = makeStrategy({ primary_channel: "Instagram" });
    const result = buildReportData(s, makeProfile());
    expect(result.channels.primary.name).toBe("Instagram");
  });

  it("13. buildMetrics extracts revenue target '$50K' from business_goal string", () => {
    const s = makeStrategy({ business_goal: "Reach $50K per month" });
    const result = buildReportData(s, makeProfile());
    const revGoal = result.metrics.businessGoals.find((g: any) =>
      g.label === "Monthly Revenue" || g.label === "Annual Revenue"
    );
    expect(revGoal).toBeDefined();
    expect(revGoal?.value).toContain("$50K");
  });

  it("14. buildMetrics correctly identifies annual revenue vs monthly", () => {
    const annual = makeStrategy({ business_goal: "Hit $600K annually" });
    const monthly = makeStrategy({ business_goal: "Hit $50K per month" });

    const rAnnual = buildReportData(annual, makeProfile());
    const rMonthly = buildReportData(monthly, makeProfile());

    const annualGoal = rAnnual.metrics.businessGoals.find((g: any) => g.label === "Annual Revenue");
    const monthlyGoal = rMonthly.metrics.businessGoals.find((g: any) => g.label === "Monthly Revenue");

    expect(annualGoal).toBeDefined();
    expect(monthlyGoal).toBeDefined();
  });
});

// ─── Negative / Malformed Data Cases ─────────────────────────────
describe("buildReportData — negative/malformed data", () => {
  it("15. empty strategy {} returns all sections with fallback/default values without throwing", () => {
    expect(() => buildReportData({}, {})).not.toThrow();
    const result = buildReportData({}, {});
    expect(result).toHaveProperty("meta");
    expect(result).toHaveProperty("positioning");
    expect(result).toHaveProperty("archetype");
    expect(result).toHaveProperty("calendar");
    expect(result).toHaveProperty("channels");
    expect(result).toHaveProperty("metrics");
  });

  it("16. null profile returns fallback 'Your Business' in meta", () => {
    const result = buildReportData(makeStrategy(), null);
    expect(result.meta.businessName).toBe("Your Business");
    expect(result.meta.reportTitle).toContain("Your Business");
  });

  it("17. content_pillars as a string (comma-separated) is coerced to array", () => {
    const s = makeStrategy({ content_pillars: "Authority, Mindset, Revenue" });
    const result = buildReportData(s, makeProfile());
    expect(Array.isArray(result.contentStrategy.pillars)).toBe(true);
    expect(result.contentStrategy.pillars).toHaveLength(3);
    expect(result.contentStrategy.pillars[0]).toBe("Authority");
  });

  it("18. voice_attributes as a string is coerced to array", () => {
    const s = makeStrategy({ voice_attributes: "Confident, Direct, Warm" });
    const result = buildReportData(s, makeProfile());
    expect(Array.isArray(result.voice.attributes)).toBe(true);
    expect(result.voice.attributes).toContain("Confident");
  });

  it("19. enhanced_foundation as a non-object is handled gracefully", () => {
    const s = makeStrategy({ enhanced_foundation: null });
    expect(() => buildReportData(s, makeProfile())).not.toThrow();
  });

  it("20. content_pillars with mixed types (strings and objects) normalizes correctly", () => {
    const s = makeStrategy({
      content_pillars: [
        "Authority",
        { name: "Mindset" },
        { title: "Revenue" },
        { text: "Storytelling" },
      ],
    });
    // Should not throw
    expect(() => buildReportData(s, makeProfile())).not.toThrow();
    const result = buildReportData(s, makeProfile());
    expect(Array.isArray(result.contentStrategy.pillars)).toBe(true);
  });

  it("21. calendar_entries with dates that include time zones parses getDayName without crash", () => {
    const s = makeStrategy({
      calendar_entries: [
        { date: "2026-11-08T00:00:00+05:30", channel: "LinkedIn", contentType: "Text Post", title: "Post 1" },
        { date: "2026-11-09T12:00:00Z", channel: "LinkedIn", contentType: "Carousel", title: "Post 2" },
      ],
    });
    expect(() => buildReportData(s, makeProfile())).not.toThrow();
    const result = buildReportData(s, makeProfile());
    expect(result.calendar).toHaveLength(2);
    expect(typeof result.calendar[0].dayName).toBe("string");
  });

  it("22. business goal with '$300,000/year' detected as annual revenue", () => {
    const s = makeStrategy({ business_goal: "Generate $300,000/year in revenue" });
    const result = buildReportData(s, makeProfile());
    const annualGoal = result.metrics.businessGoals.find((g: any) => g.label === "Annual Revenue");
    expect(annualGoal).toBeDefined();
  });

  it("23. buildChannels with no primary_channel defaults to 'LinkedIn'", () => {
    const s = makeStrategy({ primary_channel: undefined, enhanced_foundation: {} });
    const result = buildReportData(s, makeProfile());
    expect(result.channels.primary.name).toBe("LinkedIn");
  });

  it("24. buildActionPlan with no ef.week1-4 uses default 4-week scaffold", () => {
    const s = makeStrategy({ enhanced_foundation: {} });
    const result = buildReportData(s, makeProfile());
    expect(result.actionPlan.weeks).toHaveLength(4);
    expect(result.actionPlan.weeks[0].week).toBe("Week 1");
    expect(result.actionPlan.weeks[1].week).toBe("Week 2");
    expect(result.actionPlan.weeks[2].week).toBe("Week 3");
    expect(result.actionPlan.weeks[3].week).toBe("Week 4");
  });

  it("meta.preparedFor uses full_name or falls back to email", () => {
    const noName = makeProfile({ full_name: undefined, email: "test@example.com", business_name: "Biz" });
    const result = buildReportData(makeStrategy(), noName);
    expect(result.meta.preparedFor).toBe("test@example.com");
  });

  it("meta.preparedFor falls back to 'Founder' when no name or email", () => {
    const bare = { business_name: "Bare Biz" };
    const result = buildReportData(makeStrategy(), bare);
    expect(result.meta.preparedFor).toBe("Founder");
  });

  it("buildCoreValues title fallback uses v.title when v.name is absent", () => {
    const s = makeStrategy({
      core_values: [{ title: "Transparency", decisionFilter: "Is this open?", description: "Be open." }],
    });
    const result = buildReportData(s, makeProfile());
    expect(result.coreValues[0].name).toBe("Transparency");
  });

  it("archetype from enhanced_foundation.brandArchetype is preferred over strategy.archetype", () => {
    const s = makeStrategy({
      archetype: { name: "The Hero" },
      enhanced_foundation: { brandArchetype: { name: "The Ruler", description: "Commands authority." } },
    });
    const result = buildReportData(s, makeProfile());
    expect(result.archetype.primary).toContain("Ruler");
  });

  it("buildCalendar returns calendar entries with required fields", () => {
    const s = makeStrategy({
      calendar_entries: [
        { date: "2026-11-10", channel: "LinkedIn", contentType: "Text Post", title: "My Post", pillar: "Authority" },
      ],
    });
    const result = buildReportData(s, makeProfile());
    expect(result.calendar[0]).toHaveProperty("date");
    expect(result.calendar[0]).toHaveProperty("dayName");
    expect(result.calendar[0]).toHaveProperty("channel");
    expect(result.calendar[0]).toHaveProperty("type");
    expect(result.calendar[0]).toHaveProperty("title");
    expect(result.calendar[0]).toHaveProperty("status");
  });

  it("metrics businessGoals always has 4 entries", () => {
    const result = buildReportData(makeStrategy(), makeProfile());
    expect(result.metrics.businessGoals).toHaveLength(4);
  });

  it("buildActionPlan with ef.week1-4 uses ef action plan data", () => {
    const s = makeStrategy({
      enhanced_foundation: {
        actionPlan: {
          week1: "Optimize profile",
          week2: "Post 7x",
          week3: "Engage daily",
          week4: "Review metrics",
        },
      },
    });
    const result = buildReportData(s, makeProfile());
    expect(result.actionPlan.weeks[0].tasks).toContain("Optimize profile");
    expect(result.actionPlan.weeks[1].tasks).toContain("Post 7x");
  });

  it("buildMetrics extracts revenue from $300K format", () => {
    const s = makeStrategy({ business_goal: "Reach $300K per year" });
    const result = buildReportData(s, makeProfile());
    const goal = result.metrics.businessGoals[0];
    expect(goal.value).toContain("$300K");
  });

  it("completely missing enhanced_foundation does not crash any section", () => {
    const s: any = {
      primary_channel: "LinkedIn",
      business_goal: "$50K/month",
      methodology: "The Method",
    };
    expect(() => buildReportData(s, makeProfile())).not.toThrow();
  });
});
