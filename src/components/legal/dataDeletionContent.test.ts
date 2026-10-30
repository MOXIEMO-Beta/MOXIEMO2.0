import { expect, it } from "vitest";
import dataDeletion from "@/content/legal/data-deletion.md?raw";

it("keeps the data deletion date line exactly as approved", () => {
  expect(dataDeletion).toContain("Last updated October 29, 2026");
  expect(dataDeletion).not.toContain("Last updated: May 4, 2026");
});

it("states the deletion promise in the short version", () => {
  const summary = dataDeletion.split("## 1.")[0];
  expect(summary).toContain("within 3 business days and finish within 30 days of verifying it");
  expect(summary).toContain("billing records for 7 years, because tax law requires it");
});

it("numbers every section from 1 to 7", () => {
  const numbered = [...dataDeletion.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  expect(numbered).toEqual(Array.from({ length: 7 }, (_, index) => index + 1));
});

it("keeps the settings paths readable with arrows", () => {
  expect(dataDeletion.match(/→/g)).toHaveLength(8);
});
