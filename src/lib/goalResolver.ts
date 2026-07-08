// Resolve a goal_definitions record into a single-metric North Star.
// If the North Star target holds a compound "X and Y" ambition, keep the
// first numeric segment as the primary metric and move any additional
// segments into smart_cards so nothing is lost. This runs client-side so
// existing users get the fix without a full regenerate.

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "metric";
}

function cleanUnit(s: string): string {
  return s.replace(/^\s*(?:on|in|for|to)\s+/i, "").trim();
}

function parseSeg(s: string): { value: string; unit: string; unitKey: string } {
  const m = s.match(/([$]?\d[\d,]*(?:\.\d+)?\s*[kKmM]?)\s*(.*)/);
  const unit = (m?.[2] ?? "").trim();
  const cleaned = cleanUnit(unit);
  return {
    value: (m?.[1] ?? s).trim(),
    unit,
    unitKey: cleaned || unit,
  };
}

function splitSegments(s: string): string[] {
  if (!s) return [];
  const normalized = s.replace(/\s+(?:and|&)\s+|\s*\+\s*|\s*\/\s*/gi, "|goal|");
  const withCommaBreaks = normalized.replace(/,(\s*[$]?\d)/g, (match, next: string, offset: number, whole: string) => {
    const before = whole[offset - 1] ?? "";
    const after = whole.slice(offset + 1);
    return /\d/.test(before) && /^\d{3}\b/.test(after) ? match : `|goal|${next}`;
  });
  // Split list commas, but preserve thousands separators like 2,000.
  const parts = withCommaBreaks
    .split("|goal|")
    .map((p) => p.trim())
    .filter(Boolean);
  const numeric = parts.filter((p) => /\d/.test(p));
  return numeric.length >= 2 ? numeric : [];
}

function matchCardKey(cards: any[], segment: string): string | null {
  const words = (segment.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  if (words.length === 0) return null;
  for (const c of cards) {
    const hay = `${c?.title ?? ""} ${c?.target ?? ""} ${c?.metric_key ?? ""}`.toLowerCase();
    if (words.some((w) => hay.includes(w))) {
      return (c?.metric_key && String(c.metric_key)) || slugify(String(c?.title ?? ""));
    }
  }
  return null;
}

function matchCard(cards: any[], segment: string): any | null {
  const words = (segment.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  if (words.length === 0) return null;
  return cards.find((c) => {
    const hay = `${c?.title ?? ""} ${c?.target ?? ""} ${c?.metric_key ?? ""}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  }) ?? null;
}

export function resolveGoalDefinitions<T extends { north_star?: any; smart_cards?: any[] } | null>(g: T): T {
  if (!g) return g;
  const ns = (g as any).north_star ?? {};
  const raw = String(ns.target_value ?? "").trim();
  const segments = splitSegments(raw);
  if (segments.length < 2) {
    // Not compound; still make sure ns has a metric_key linked to a card when possible.
    if (!ns.metric_key && raw) {
      const key = matchCardKey((g as any).smart_cards ?? [], raw);
      if (key) return { ...(g as any), north_star: { ...ns, metric_key: key } } as T;
    }
    return g;
  }

  const [primary, ...rest] = segments;
  const primaryParsed = parseSeg(primary);
  const cards = [...((g as any).smart_cards ?? [])];
  const primaryCard = matchCard(cards, primary);
  const primaryKey = (ns.metric_key && String(ns.metric_key)) || matchCardKey(cards, primary) || slugify(primaryParsed.unitKey || primaryParsed.unit || primary);

  const extraCards = rest.map((seg) => {
    if (matchCardKey(cards, seg)) return null; // already represented
    const q = parseSeg(seg);
    return {
      category: "Growth",
      title: `Grow ${q.unitKey || q.unit || "secondary metric"} to ${q.value}`.trim(),
      target: seg,
      deadline: ns.deadline ?? "",
      tracked_by: "self",
      lever: "",
      metric_key: slugify(q.unitKey || q.unit || seg),
    };
  }).filter(Boolean) as any[];

  const newNs = {
    ...ns,
    title: primaryCard?.title || `Reach ${primary}`,
    target_value: primary,
    target_unit: primaryParsed.unit || ns.target_unit || "",
    metric_key: primaryKey,
  };

  const resolved = { ...(g as any), north_star: newNs, smart_cards: [...extraCards, ...cards].slice(0, 6) } as T;

  if (typeof console !== "undefined") {
    console.info("[goalResolver] compound North Star resolved", {
      goal_definition_id: (g as any).id ?? null,
      received: {
        north_star: ns,
        target_value: raw,
        parsed_segments: segments,
      },
      returned: {
        primary_metric: newNs,
        secondary_cards_added: extraCards,
        smart_card_count: (resolved as any).smart_cards?.length ?? 0,
      },
    });
  }

  return resolved;
}