import { expect, it } from "vitest";
import cookies from "@/content/legal/cookies.md?raw";

it("keeps the cookie policy date line exactly as approved", () => {
  expect(cookies).toContain("Effective November 1, 2026 · Last updated October 29, 2026 · Version 1.0");
});

it("lists eleven tracked items across six columns", () => {
  const rows = cookies.split("\n").filter(line => line.startsWith("| ") && !line.startsWith("| Name") && !line.startsWith("| ---"));
  expect(rows).toHaveLength(11);
  expect(rows.every(row => row.split("|").length === 8)).toBe(true);
});

it("keeps every stored item name literal, with no placeholder rows", () => {
  for (const name of ["moxiemo_consent", "moxiemo_anon_id", "sb-[project]-auth-token", "__dpl", "session-id", "moxiemo_cta_variant", "_clck", "_clsk", "CLID", "MUID", "ANONCHK, MR, SM"]) {
    expect(cookies).toContain(`| ${name} |`);
  }
  expect(cookies).not.toContain("[confirm]");
});

it("numbers every section from 1 to 9", () => {
  const numbered = [...cookies.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  expect(numbered).toEqual(Array.from({ length: 9 }, (_, index) => index + 1));
});
