import { expect, it } from "vitest";
import privacy from "@/content/legal/privacy.md?raw";

const section72 = privacy.slice(
  privacy.indexOf("**7.2 MOXIE text messages.**"),
  privacy.indexOf("## 8. Cookies"),
);

it("keeps the privacy date line exactly as approved", () => {
  expect(privacy).toContain("Effective November 1, 2026 · Last updated October 29, 2026 · Version 2.0");
});

it("lists nine service providers and no placeholder rows", () => {
  const rows = privacy.split("\n").filter(line => line.startsWith("| ") && !line.startsWith("| Provider") && !line.startsWith("| ---"));
  expect(rows).toHaveLength(9);
  expect(privacy).not.toContain("[confirm]");
});

it("keeps the section 7.2 texting disclosures word for word", () => {
  expect(section72).toContain("No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.");
  expect(section72).toContain("Reply STOP to any message to opt out. Reply HELP for help, or email hello@buildwithmoxiemo.com.");
});

it("numbers every section from 1 to 17", () => {
  const numbered = [...privacy.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  expect(numbered).toEqual(Array.from({ length: 17 }, (_, index) => index + 1));
});
