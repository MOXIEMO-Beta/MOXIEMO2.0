import { describe, expect, it } from "vitest";
import {
  CTA_EXPORT_COLUMNS,
  ctaTaggedCsv,
  formatShare,
  shareOf,
  summarizeCtaVariants,
  type CtaTaggedRow,
} from "./ctaResults";

const row = (over: Partial<CtaTaggedRow>): CtaTaggedRow => ({
  created_at: "2026-10-29T03:00:00+00:00",
  cta_variant: null,
  source: null,
  role: null,
  brand_count: null,
  referral_source: null,
  ...over,
});

const rows: CtaTaggedRow[] = [
  ...Array.from({ length: 7 }, (_, i) =>
    row({ cta_variant: "seat", source: "home_first100", role: "Founder", brand_count: "1", referral_source: `ref ${i}` })
  ),
  ...Array.from({ length: 3 }, () => row({ cta_variant: "early", source: "founding_first100" })),
  row({ cta_variant: null, source: "brand_kit_tool" }),
  row({ cta_variant: "other", source: "home_first100" }),
];

describe("summarizeCtaVariants", () => {
  it("counts only tagged sign-ups and splits them by version", () => {
    const summary = summarizeCtaVariants(rows);
    expect(summary.tagged).toBe(10);
    expect(summary.variants.map((v) => [v.key, v.letter, v.label, v.signups, v.share])).toEqual([
      ["seat", "A", "Claim my founding seat", 7, 70],
      ["early", "B", "Claim early access", 3, 30],
    ]);
  });

  it("reports no share when nothing is tagged", () => {
    const summary = summarizeCtaVariants([row({ cta_variant: null }), row({ cta_variant: "other" })]);
    expect(summary.tagged).toBe(0);
    expect(summary.variants.every((v) => v.signups === 0 && v.share === null)).toBe(true);
    expect(formatShare(null)).toBe("No tagged sign-ups yet");
  });
});

describe("shareOf", () => {
  it("rounds the share to one decimal", () => {
    expect(shareOf(1, 3)).toBe(33.3);
    expect(shareOf(2, 3)).toBe(66.7);
    expect(shareOf(0, 5)).toBe(0);
    expect(formatShare(66.7)).toBe("66.7% of tagged sign-ups");
  });
});

describe("ctaTaggedCsv", () => {
  it("holds only the agreed columns and drops untagged rows", () => {
    const csv = ctaTaggedCsv(rows);
    const [header, ...lines] = csv.split("\n");
    expect(header).toBe("created_at,cta_variant,source,role,brand_count,referral_source");
    expect(header).toBe(CTA_EXPORT_COLUMNS.join(","));
    expect(lines).toHaveLength(10);
  });

  it("never carries names or emails", () => {
    const csv = ctaTaggedCsv(rows);
    expect(csv.toLowerCase()).not.toMatch(/name|email|@/);
  });

  it("quotes values that contain a comma", () => {
    const csv = ctaTaggedCsv([row({ cta_variant: "seat", referral_source: "Podcast, live" })]);
    expect(csv.split("\n")[1].endsWith('"Podcast, live"')).toBe(true);
  });
});
