import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/cookieConsent", () => ({ getConsent: () => null }));

beforeEach(() => { vi.resetModules(); document.head.innerHTML = ""; delete window.clarity; });

it("makes no Clarity request without analytics permission", async () => {
  const { applyClarityConsent } = await import("./clarityConsent");
  applyClarityConsent(null);
  expect(document.querySelector('script[src*="clarity.ms"]')).toBeNull();
});

it("loads the required Clarity project only after analytics permission", async () => {
  const { applyClarityConsent } = await import("./clarityConsent");
  applyClarityConsent({ version: "2026-11-01", timestamp: new Date().toISOString(), necessary: true, preferences: false, analytics: true, marketing: false, gpc: false });
  expect(document.querySelector("#moxiemo-clarity")?.getAttribute("src")).toBe("https://www.clarity.ms/tag/xwa1meyqgq");
  expect(window.clarity?.q).toContainEqual(["consentv2", { analytics_Storage: "granted", ad_Storage: "denied" }]);
});

it("withdrawal denies both storage types and removes Clarity cookies", async () => {
  vi.useFakeTimers();
  const { applyClarityConsent } = await import("./clarityConsent");
  const choice = { version: "2026-11-01", timestamp: new Date().toISOString(), necessary: true as const, preferences: true, analytics: true, marketing: true, gpc: false };
  applyClarityConsent(choice);
  document.cookie = "_clck=test; path=/";
  document.cookie = "_clsk=test; path=/";
  applyClarityConsent({ ...choice, analytics: false });
  expect(window.clarity?.q).toContainEqual(["consentv2", { analytics_Storage: "denied", ad_Storage: "denied" }]);
  expect(document.cookie).not.toContain("_clck=");
  expect(document.cookie).not.toContain("_clsk=");
  vi.clearAllTimers();
  vi.useRealTimers();
});