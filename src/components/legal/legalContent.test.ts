import { describe, expect, it } from "vitest";
import { headingId, parseLegalContent } from "./legalContent";

describe("legal heading anchors", () => {
  it("uses section-18 for numbered disputes headings", () => {
    expect(headingId("18. Disputes: informal resolution, arbitration and waivers")).toBe("section-18");
  });
  it("slugs non-numbered headings", () => {
    expect(headingId("Your Rights and Choices")).toBe("your-rights-and-choices");
  });
});

describe("legal content sections", () => {
  it("isolates title, date, arbitration notice and short version from contents", () => {
    const result = parseLegalContent("# Terms of Service\n\nOctober 30, 2026\n\nARBITRATION NOTICE.\n\n## The short version\n\nSummary.\n\n## 18. Disputes\n\nBody.");
    expect(result.title).toBe("Terms of Service");
    expect(result.date).toBe("October 30, 2026");
    expect(result.intro).toBe("ARBITRATION NOTICE.");
    expect(result.summary).toBe("## The short version\n\nSummary.");
    expect(result.headings).toEqual([{ text: "18. Disputes", id: "section-18" }]);
    expect(result.content).toBe("## 18. Disputes\n\nBody.");
  });
  it("excludes the affiliate overview from contents", () => {
    const result = parseLegalContent("# Affiliate Terms\n\nDate\n\n## The program at a glance\n\nOverview\n\n## Eligibility\n\nDetails");
    expect(result.headings).toEqual([{ text: "Eligibility", id: "eligibility" }]);
    expect(result.summary).toContain("Overview");
  });
  it("leaves an unfilled file empty for legacy fallback", () => {
    expect(parseLegalContent("").content).toBe("");
  });
});