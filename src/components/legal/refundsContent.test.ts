import { expect, it } from "vitest";
import refunds from "@/content/legal/refunds.md?raw";

it("keeps the refund policy date line exactly as approved", () => {
  expect(refunds).toContain("Effective November 1, 2026 · Last updated October 29, 2026 · Version 1.0");
});

it("ties every guarantee mention to thirty days", () => {
  const mentions = refunds.match(/30-day guarantee|within 30 days|guarantee covers it for 30 days/g) ?? [];
  expect(mentions).toHaveLength(6);
  const dayCounts = [...refunds.matchAll(/(\d+)[- ]day guarantee/g)].map(match => match[1]);
  expect(dayCounts).toEqual(["30", "30", "30"]);
});

it("never offers a free trial", () => {
  expect(refunds.toLowerCase()).not.toContain("free trial");
});

it("numbers every section from 1 to 10", () => {
  const numbered = [...refunds.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  expect(numbered).toEqual(Array.from({ length: 10 }, (_, index) => index + 1));
});
