import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for US display. Accepts ISO (YYYY-MM-DD or full ISO)
 * or anything Date can parse. Returns "MM/DD/YYYY" by default, or a long form
 * "September 30, 2026" when style === "long". If the input is unparseable it
 * is returned unchanged (so already-formatted strings pass through cleanly).
 */
export function formatDateUS(input: unknown, style: "short" | "long" = "short"): string {
  if (input == null) return "";
  const s = String(input).trim();
  if (!s) return "";
  // Only reformat things that look like an ISO-style date. Human strings like
  // "September 30, 2026" or "Q3 2026" are returned as-is.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(s);
  if (!iso) return s;
  const [, y, m, d] = iso;
  if (style === "long") {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthIdx = Number(m) - 1;
    const dayNum = Number(d);
    if (monthIdx < 0 || monthIdx > 11 || !dayNum) return s;
    return `${months[monthIdx]} ${dayNum}, ${y}`;
  }
  return `${m}/${d}/${y}`;
}
