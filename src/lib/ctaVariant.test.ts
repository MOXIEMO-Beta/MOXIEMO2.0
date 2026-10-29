import { beforeEach, expect, it, vi } from "vitest";
import type { ConsentChoice } from "./cookieConsent";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  delete window.clarity;
  window.moxiemoConsent = { get: () => null, onChange: () => () => {} };
});

it.each([[0.49, "seat"], [0.5, "early"]] as const)("splits equally at random %s", async (random, expected) => {
  vi.spyOn(Math, "random").mockReturnValue(random);
  const { getCtaVariant } = await import("./ctaVariant");
  expect(getCtaVariant()).toBe(expected);
  expect(localStorage.getItem("moxiemo_cta_variant")).toBe(expected);
});

it("reuses the stored version across page loads", async () => {
  localStorage.setItem("moxiemo_cta_variant", "early");
  expect((await import("./ctaVariant")).getCtaVariant()).toBe("early");
  vi.resetModules();
  expect((await import("./ctaVariant")).getCtaVariant()).toBe("early");
});

it.each(["seat", "early"])("URL override %s persists", async variant => {
  localStorage.setItem("moxiemo_cta_variant", variant === "seat" ? "early" : "seat");
  window.history.replaceState({}, "", `/?cta=${variant}`);
  const { getCtaVariant } = await import("./ctaVariant");
  expect(getCtaVariant()).toBe(variant);
  expect(localStorage.getItem("moxiemo_cta_variant")).toBe(variant);
});

it("uses one page-load assignment when storage throws", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValue(0.9);
  const { getCtaVariant } = await import("./ctaVariant");
  expect(getCtaVariant()).toBe("seat");
  expect(getCtaVariant()).toBe("seat");
});

it("sends no experiment calls without analytics consent", async () => {
  window.clarity = vi.fn();
  const { tagCtaVariant, trackCtaClick } = await import("./ctaVariant");
  tagCtaVariant(); trackCtaClick();
  expect(window.clarity).not.toHaveBeenCalled();
});

it("tags and records clicks only with analytics consent", async () => {
  localStorage.setItem("moxiemo_cta_variant", "seat");
  window.clarity = vi.fn();
  window.moxiemoConsent.get = () => ({ analytics: true } as ConsentChoice);
  const { trackCtaClick } = await import("./ctaVariant");
  trackCtaClick();
  expect(window.clarity).toHaveBeenCalledWith("set", "cta_variant", "seat");
  expect(window.clarity).toHaveBeenCalledWith("event", "cta_click_seat");
});