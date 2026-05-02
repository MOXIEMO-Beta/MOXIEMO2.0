export function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // Sun=0, Mon=1
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
export function ymd(d: Date) { return d.toISOString().slice(0, 10); }
export function isBetween(iso: string | null | undefined, from: Date, to: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= from && d <= to;
}
export function quarterRange(year: number, q: number) {
  const startMonth = (q - 1) * 3;
  return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0, 23, 59, 59) };
}
export function currentQuarter(d = new Date()) {
  return { year: d.getFullYear(), q: Math.floor(d.getMonth() / 3) + 1 };
}
export function nextQuarters(n = 3) {
  const out: { year: number; q: number }[] = [];
  let { year, q } = currentQuarter();
  for (let i = 0; i < n; i++) { out.push({ year, q }); q++; if (q > 4) { q = 1; year++; } }
  return out;
}
export function fmtMonth(d: Date) { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
export function fmtShort(d: Date) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-500",
  instagram: "bg-purple-500",
  facebook: "bg-blue-700",
  email: "bg-accent",
  content: "bg-muted-foreground",
};
export const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  email: "Email",
  content: "Content",
};

export function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  return [];
}

/**
 * Generate placeholder content slots for a campaign.
 * Distributes posts across Mon–Thu of each week and emails on Tuesdays.
 */
export function generateCampaignSlots(opts: {
  start_date: string | null;
  end_date: string | null;
  channels: string[];
  targets: Record<string, number>;
}) {
  const { start_date, end_date, channels, targets } = opts;
  if (!start_date || !end_date) return [];
  const start = startOfWeek(new Date(start_date));
  const end = new Date(end_date);
  const weeks: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    weeks.push(cursor);
    cursor = addDays(cursor, 7);
  }

  const POST_DAYS = [0, 1, 2, 3]; // Mon, Tue, Wed, Thu offsets from week start
  const slots: any[] = [];

  weeks.forEach((weekStart, weekIdx) => {
    (["linkedin", "instagram", "facebook"] as const).forEach((ch) => {
      if (!channels.includes(ch)) return;
      const count = Math.max(0, Math.min(POST_DAYS.length, Math.round(targets?.[ch] ?? 0)));
      for (let i = 0; i < count; i++) {
        const dayOffset = POST_DAYS[i % POST_DAYS.length];
        const d = addDays(weekStart, dayOffset);
        if (d < new Date(start_date) || d > end) continue;
        slots.push({
          id: `${ch}-w${weekIdx}-${i}`,
          date: ymd(d),
          platform: ch,
          contentType: ch === "linkedin" ? "LinkedIn Post" : ch === "instagram" ? "Instagram Caption" : "Facebook Post",
          status: "needs_content",
        });
      }
    });
    // Emails — Tuesdays. If weekly target >=1, schedule every week; if <1 (e.g. fortnightly), every other week.
    if (channels.includes("email")) {
      const emailTarget = targets?.email ?? 0;
      const emailEveryWeek = emailTarget >= 1;
      const shouldSchedule = emailEveryWeek || weekIdx % 2 === 0;
      if (shouldSchedule) {
        const d = addDays(weekStart, 1); // Tuesday
        if (d >= new Date(start_date) && d <= end) {
          slots.push({
            id: `email-w${weekIdx}`,
            date: ymd(d),
            platform: "email",
            contentType: "Newsletter",
            status: "needs_content",
          });
        }
      }
    }
  });

  return slots;
}

export function campaignSlotProgress(campaign: any) {
  const slots: any[] = campaign?.content_plan?.slots ?? [];
  const total = slots.length;
  const filled = slots.filter((s) => s.status === "filled" || s.filled_with).length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { total, filled, pct };
}

export function campaignSlotCounts(campaign: any) {
  const slots: any[] = campaign?.content_plan?.slots ?? [];
  const counts: Record<string, number> = { linkedin: 0, email: 0, instagram: 0, facebook: 0 };
  slots.forEach((s) => {
    if (counts[s.platform] !== undefined) counts[s.platform]++;
  });
  return counts;
}

export function activeCampaignForDate(campaigns: any[], d: Date) {
  const t = d.getTime();
  return campaigns.find((c) => {
    if (!c.start_date || !c.end_date) return false;
    const s = new Date(c.start_date).getTime();
    const e = new Date(c.end_date).getTime();
    return t >= s && t <= e && c.status !== "completed" && c.status !== "paused";
  });
}

export const CAMPAIGN_BANNER_CLASS = "bg-accent/15 text-accent border border-accent/30";
