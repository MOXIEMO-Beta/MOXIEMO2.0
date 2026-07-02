import { supabase } from "@/integrations/supabase/client";

export type BaseCalendarItem = {
  item_id?: string;
  date?: string;
  day?: string;
  platform?: string;
  topic?: string;
  title?: string;
  theme?: string;
  pillar?: string;
  contentType?: string;
  [k: string]: any;
};

export type ResolvedCalendarItem = BaseCalendarItem & {
  item_id: string;
  originalDate: string;
  resolvedDate: string;
};

export type CalendarOverride = { item_id: string; override_date: string };

// Deterministic hash for backfilling stable item_ids on legacy items.
function stableHash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(13, "0");
  return `it_${hex}`;
}

function deriveItemId(item: BaseCalendarItem, index: number): string {
  const key = `${item.date ?? ""}|${item.platform ?? ""}|${item.topic ?? item.title ?? ""}|${index}`;
  return stableHash(key);
}

/**
 * Ensure every item has a stable item_id. Returns items with ids assigned.
 * `mutated` indicates whether any ids had to be backfilled.
 */
export function ensureItemIds(items: BaseCalendarItem[]): { items: BaseCalendarItem[]; mutated: boolean } {
  let mutated = false;
  const out = items.map((it, i) => {
    if (it.item_id && typeof it.item_id === "string") return it;
    mutated = true;
    return { ...it, item_id: deriveItemId(it, i) };
  });
  return { items: out, mutated };
}

/** Persist backfilled item_ids into enhanced_foundation.contentCalendar. */
export async function persistItemIdBackfill(
  userId: string,
  strategy: any,
  itemsWithIds: BaseCalendarItem[],
): Promise<void> {
  if (!userId || !strategy) return;
  const ef = { ...(strategy.enhanced_foundation || {}), contentCalendar: itemsWithIds };
  await supabase.from("strategies").update({ enhanced_foundation: ef }).eq("user_id", userId);
}

export function resolveCalendarDates(
  baseItems: BaseCalendarItem[],
  overrides: CalendarOverride[],
): ResolvedCalendarItem[] {
  const map = new Map(overrides.map((o) => [o.item_id, o.override_date]));
  return baseItems.map((it, i) => {
    const item_id = it.item_id || deriveItemId(it, i);
    const originalDate = it.date ?? "";
    return {
      ...it,
      item_id,
      originalDate,
      resolvedDate: map.get(item_id) ?? originalDate,
    };
  });
}

export function sortByResolvedDate(items: ResolvedCalendarItem[]): ResolvedCalendarItem[] {
  return [...items].sort((a, b) => (a.resolvedDate || "").localeCompare(b.resolvedDate || ""));
}

export function groupByWeek(
  items: ResolvedCalendarItem[],
  perWeek = 7,
): { week: number; items: ResolvedCalendarItem[] }[] {
  const sorted = sortByResolvedDate(items);
  const out: { week: number; items: ResolvedCalendarItem[] }[] = [];
  for (let i = 0; i < sorted.length; i += perWeek) {
    out.push({ week: Math.floor(i / perWeek) + 1, items: sorted.slice(i, i + perWeek) });
  }
  return out;
}

export async function fetchOverrides(userId: string): Promise<CalendarOverride[]> {
  const { data, error } = await supabase
    .from("content_calendar_overrides")
    .select("item_id, override_date")
    .eq("user_id", userId);
  if (error) {
    console.error("fetchOverrides failed", error);
    return [];
  }
  return (data ?? []) as CalendarOverride[];
}

export async function swapCalendarItems(
  userId: string,
  a: ResolvedCalendarItem,
  b: ResolvedCalendarItem,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("content_calendar_overrides").upsert(
    [
      { user_id: userId, item_id: a.item_id, override_date: b.resolvedDate, updated_at: now },
      { user_id: userId, item_id: b.item_id, override_date: a.resolvedDate, updated_at: now },
    ],
    { onConflict: "user_id,item_id" },
  );
  if (error) throw error;
}

export async function clearOverridesForUser(userId: string): Promise<void> {
  if (!userId) return;
  const { error } = await supabase
    .from("content_calendar_overrides")
    .delete()
    .eq("user_id", userId);
  if (error) console.error("clearOverridesForUser failed", error);
}
