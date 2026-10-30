import { expect, it } from "vitest";
import affiliates from "@/content/legal/affiliates.md?raw";

it("keeps the affiliate terms date line exactly as approved", () => {
  expect(affiliates).toContain("Effective November 1, 2026 · Last updated October 29, 2026 · Version 1.0");
});

it("states the program terms in the at a glance table", () => {
  const rows = affiliates.split(/\r?\n/).filter(line => line.startsWith("| ") && !line.startsWith("| ---"));
  expect(rows).toHaveLength(8);
  expect(rows.slice(1).join("\n")).toContain("30% of what each customer you refer pays us");
  expect(rows.slice(1).join("\n")).toContain("Each payment in the customer's first 12 months");
  expect(rows.slice(1).join("\n")).toContain("60 days from the click on your link");
  expect(rows.slice(1).join("\n")).toContain("30 days on each commission, to cover the 30-day guarantee");
  expect(rows.slice(1).join("\n")).toContain("$50");
  expect(rows.slice(1).join("\n")).toContain("Monthly, by PayPal or bank transfer, in US dollars");
  expect(rows.slice(1).join("\n")).toContain("Anyone we approve, member or not");
});

it("numbers every section from 1 to 18", () => {
  const numbered = [...affiliates.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  expect(numbered).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
});
