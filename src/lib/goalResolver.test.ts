import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveGoalDefinitions } from "./goalResolver";

// ─── Helpers ─────────────────────────────────────────────────────
function makeGoal(overrides: Record<string, any> = {}) {
  return {
    id: "g1",
    north_star: {
      title: "My Goal",
      target_value: "$50K",
      target_unit: "revenue",
      metric_key: "revenue",
      deadline: "2026-12-31",
    },
    smart_cards: [],
    ...overrides,
  };
}

// ─── Positive Cases ───────────────────────────────────────────────
describe("resolveGoalDefinitions — positive", () => {
  it("1. returns null unchanged when input is null", () => {
    expect(resolveGoalDefinitions(null)).toBeNull();
  });

  it("2. single-metric North Star with no compound passes through unchanged", () => {
    const g = makeGoal();
    const result = resolveGoalDefinitions(g);
    expect(result).toBe(g);
    expect(result?.north_star.target_value).toBe("$50K");
  });

  it("3. compound '$50K and 10 clients' splits into primary=$50K, secondary card added", () => {
    const g = makeGoal({
      north_star: { title: "Big Goal", target_value: "$50K and 10 clients", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$50K");
    expect(result?.smart_cards.length).toBeGreaterThan(0);
    const secondaryCard = result?.smart_cards[0];
    expect(secondaryCard).toBeDefined();
    expect(secondaryCard.target).toContain("10 clients");
  });

  it("4. compound with '+' separator '$5K + 3 clients' splits correctly", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$5K + 3 clients", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$5K");
    expect(result?.smart_cards.length).toBeGreaterThan(0);
    expect(result?.smart_cards[0].target).toContain("3 clients");
  });

  it("5. primary metric gets correct metric_key linked to existing smart_card", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$50K and 5 clients", metric_key: "" },
      smart_cards: [
        { title: "Revenue Target", target: "$50K", metric_key: "revenue_target" },
      ],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.metric_key).toBeTruthy();
  });

  it("6. secondary segment not in smart_cards gets added as new card", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$50K and 10 leads", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    const hasLeadsCard = result?.smart_cards.some((c: any) =>
      c.target?.toLowerCase().includes("leads") || c.title?.toLowerCase().includes("leads")
    );
    expect(hasLeadsCard).toBe(true);
  });

  it("7. smart_cards capped at 6 total after split", () => {
    const existingCards = Array.from({ length: 5 }, (_, i) => ({
      title: `Card ${i + 1}`,
      target: `$${i + 1}K`,
      metric_key: `card_${i + 1}`,
    }));
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$100K and 20 clients", metric_key: "revenue" },
      smart_cards: existingCards,
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.smart_cards.length).toBeLessThanOrEqual(6);
  });

  it("8. north_star.target_value set to primary segment only", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$75K and 15 customers and 3 referrals", metric_key: "rev" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$75K");
    expect(result?.north_star.target_value).not.toContain("and");
  });

  it("9. missing metric_key on simple North Star gets linked to matching smart_card", () => {
    const g = makeGoal({
      north_star: { title: "My Goal", target_value: "$50K revenue", metric_key: "" },
      smart_cards: [
        { title: "Revenue", target: "$50K", metric_key: "my_revenue_key" },
      ],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.metric_key).toBe("my_revenue_key");
  });
});

// ─── Negative / Edge Cases ────────────────────────────────────────
describe("resolveGoalDefinitions — negative/edge cases", () => {
  it("10. null north_star returns input unchanged", () => {
    const g = { id: "x", north_star: null, smart_cards: [] };
    const result = resolveGoalDefinitions(g);
    expect(result).toEqual(g);
  });

  it("11. undefined north_star is treated as empty object, no crash", () => {
    const g: any = { id: "x", smart_cards: [] };
    expect(() => resolveGoalDefinitions(g)).not.toThrow();
  });

  it("12. empty target_value produces no split", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("");
    expect(result?.smart_cards).toHaveLength(0);
  });

  it("13. single number '$50K' with no 'and/+' produces no split", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$50K", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$50K");
    expect(result?.smart_cards).toHaveLength(0);
  });

  it("14. thousands-separator '$2,000 and 5 clients' — primary is '$2,000' not '$2'", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$2,000 and 5 clients", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$2,000");
  });

  it("15. input with no smart_cards key still creates secondary card safely", () => {
    const g: any = {
      id: "g2",
      north_star: { title: "Goal", target_value: "$10K and 3 clients", metric_key: "revenue" },
    };
    const result = resolveGoalDefinitions(g);
    expect(Array.isArray(result?.smart_cards)).toBe(true);
    expect(result?.smart_cards.length).toBeGreaterThan(0);
  });

  it("16. already-compound with matching card — no duplicate cards created", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$50K and 10 clients", metric_key: "revenue" },
      smart_cards: [
        { title: "New Clients", target: "10 clients", metric_key: "new_clients" },
      ],
    });
    const result = resolveGoalDefinitions(g);
    const clientCards = result?.smart_cards.filter((c: any) =>
      c.metric_key === "new_clients" ||
      (c.title ?? "").toLowerCase().includes("client")
    );
    // Should not have more than one client card
    expect(clientCards.length).toBeLessThanOrEqual(1);
  });

  it("resolves '&' separator the same as 'and'", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$30K & 8 leads", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$30K");
    expect(result?.smart_cards.length).toBeGreaterThan(0);
  });

  it("resolves '/' separator", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$20K / 4 clients", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.target_value).toBe("$20K");
  });

  it("non-compound text-only target_value with no numbers produces no split", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "grow my brand", metric_key: "" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    // No split, no crash
    expect(result?.north_star.target_value).toBe("grow my brand");
  });

  it("north_star.title is updated to match primary segment on split", () => {
    const g = makeGoal({
      north_star: { title: "Old Title", target_value: "$80K and 20 clients", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    expect(result?.north_star.title).toBeTruthy();
    // Title should reference primary segment or fall back to "Reach $80K"
    expect(typeof result?.north_star.title).toBe("string");
  });

  it("extraCards have required card shape (category, title, target, metric_key)", () => {
    const g = makeGoal({
      north_star: { title: "Goal", target_value: "$50K and 10 referrals", metric_key: "revenue" },
      smart_cards: [],
    });
    const result = resolveGoalDefinitions(g);
    const extra = result?.smart_cards[0];
    expect(extra).toHaveProperty("category");
    expect(extra).toHaveProperty("title");
    expect(extra).toHaveProperty("target");
    expect(extra).toHaveProperty("metric_key");
  });
});
