// Pure helpers for the admin "Sign-up button test" card.
// A tagged row is a waitlist sign-up that recorded which button label the visitor saw.

export type CtaTaggedRow = {
  created_at: string | null;
  cta_variant: string | null;
  source: string | null;
  role: string | null;
  brand_count: string | null;
  referral_source: string | null;
};

// The only columns the tagged export may contain. No names, no emails.
export const CTA_EXPORT_COLUMNS = [
  "created_at",
  "cta_variant",
  "source",
  "role",
  "brand_count",
  "referral_source",
] as const;

export const CTA_VARIANTS = [
  { key: "seat", letter: "A", label: "Claim my founding seat" },
  { key: "early", letter: "B", label: "Claim early access" },
] as const;

export type CtaVariantSummary = {
  key: string;
  letter: string;
  label: string;
  signups: number;
  share: number | null;
};

export type CtaSummary = {
  tagged: number;
  variants: CtaVariantSummary[];
};

function isTagged(row: CtaTaggedRow) {
  return CTA_VARIANTS.some((variant) => variant.key === row.cta_variant);
}

export function summarizeCtaVariants(rows: CtaTaggedRow[]): CtaSummary {
  const taggedRows = rows.filter(isTagged);
  const tagged = taggedRows.length;
  const variants = CTA_VARIANTS.map((variant) => {
    const signups = taggedRows.filter((row) => row.cta_variant === variant.key).length;
    return { ...variant, signups, share: shareOf(signups, tagged) };
  });
  return { tagged, variants };
}

// Percentage of all tagged sign-ups, one decimal, trailing zero dropped.
export function shareOf(count: number, total: number): number | null {
  if (total <= 0) return null;
  const rounded = Math.round((count / total) * 1000) / 10;
  return Number.isInteger(rounded) ? rounded : Number(rounded.toFixed(1));
}

export function formatShare(share: number | null): string {
  return share === null ? "No tagged sign-ups yet" : `${share}% of tagged sign-ups`;
}

export function ctaTaggedCsv(rows: CtaTaggedRow[]): string {
  const tagged = rows.filter(isTagged);
  const lines = [CTA_EXPORT_COLUMNS.join(",")];
  for (const row of tagged) {
    lines.push(CTA_EXPORT_COLUMNS.map((column) => csvEscape(row[column])).join(","));
  }
  return lines.join("\n");
}

export function ctaTaggedCsvFilename(today = new Date()): string {
  return `MOXIEMO_Signup_Button_Test_${today.toISOString().slice(0, 10)}.csv`;
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
