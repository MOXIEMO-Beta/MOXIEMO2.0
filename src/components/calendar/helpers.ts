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
