// Resolve a goal_definitions record into a single-metric North Star.
// If the North Star target holds a compound "X and Y" ambition, keep the
// first numeric segment as the primary metric and move any additional
// segments into smart_cards so nothing is lost. This runs client-side so
// existing users get the fix without a full regenerate.

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "metric";
}

function parseSeg(s: string): { value: string; unit: string } {
  const m = s.match(/([\d.,]+\s*[kKmM]?)\s*(.*)/);
  return { value: (m?.[1] ?? s).trim(), unit: (m?.[2] ?? "").trim() };
}

function splitSegments(s: string): string[] {
  if (!s) return [];
  const parts = s.split(/\s+and\s+|\s*&\s*|,\s*|\s*\+\s*|\s*\/\s*/i).map((p) => p.trim()).filter(Boolean);
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
  const primaryKey = (ns.metric_key && String(ns.metric_key)) || matchCardKey(cards, primary) || slugify(primaryParsed.unit || primary);

  const extraCards = rest.map((seg) => {
    if (matchCardKey(cards, seg)) return null; // already represented
    const q = parseSeg(seg);
    return {
      category: "Growth",
      title: `Grow ${q.unit || "secondary metric"} to ${q.value}`.trim(),
      target: seg,
      deadline: ns.deadline ?? "",
      tracked_by: "self",
      lever: "",
      metric_key: slugify(q.unit || seg),
    };
  }).filter(Boolean) as any[];

  const newNs = {
    ...ns,
    target_value: primary,
    target_unit: primaryParsed.unit || ns.target_unit || "",
    metric_key: primaryKey,
  };

  return { ...(g as any), north_star: newNs, smart_cards: [...extraCards, ...cards].slice(0, 6) } as T;
}