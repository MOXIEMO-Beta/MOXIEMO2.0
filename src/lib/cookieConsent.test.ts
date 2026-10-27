import { beforeEach, describe, expect, it, vi } from "vitest";
const insert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
import { CONSENT_KEY, CONSENT_VERSION, getConsent, initializeConsent, onConsentChange, OPTIONAL_OFF, readConsent, saveConsent, validConsent } from "./cookieConsent";

const now = new Date("2026-11-01T12:00:00.000Z");
const valid = { version: CONSENT_VERSION, timestamp: now.toISOString(), necessary: true, ...OPTIONAL_OFF, gpc: false };
beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  insert.mockClear();
  Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
});

describe("cookie consent rules", () => {
  it("uses the required notice version", () => { expect(CONSENT_VERSION).toBe("2026-11-01"); });
  it("defaults every optional category off", () => { expect(OPTIONAL_OFF).toEqual({ preferences: false, analytics: false, marketing: false }); });
  it("treats a missing choice as no consent", () => { expect(readConsent()).toBeNull(); });
  it("treats unreadable JSON as no consent", () => { localStorage.setItem(CONSENT_KEY, "{"); expect(readConsent()).toBeNull(); });
  it("rejects an older notice version", () => { expect(validConsent({ ...valid, version: "2026-10-01" }, now)).toBe(false); });
  it("rejects records more than six calendar months old", () => { expect(validConsent({ ...valid, timestamp: "2026-05-01T11:59:59.999Z" }, now)).toBe(false); });
  it("accepts a record exactly six months old", () => { expect(validConsent({ ...valid, timestamp: "2026-05-01T12:00:00.000Z" }, now)).toBe(true); });
  it("cannot disable necessary cookies", () => { expect(validConsent({ ...valid, necessary: false }, now)).toBe(false); });
  it("fails closed when localStorage reading is blocked", () => { vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); }); expect(readConsent()).toBeNull(); });
  it("keeps choices usable when storage writes are blocked", () => {
    initializeConsent();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => saveConsent(OPTIONAL_OFF, "banner_reject_all")).not.toThrow();
    expect(getConsent()?.analytics).toBe(false);
  });
  it("GPC automatically saves optional categories off and logs gpc_auto", () => {
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    initializeConsent();
    expect(getConsent()).toMatchObject({ necessary: true, preferences: false, analytics: false, marketing: false, gpc: true });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ source: "gpc_auto", gpc: true }));
  });
  it("an explicit saved choice remains valid when GPC is detected", () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...valid, timestamp: new Date().toISOString(), analytics: true }));
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    initializeConsent();
    expect(getConsent()?.analytics).toBe(true);
    expect(insert).not.toHaveBeenCalled();
  });
  it("logs every save with an anonymous UUID and no IP address", () => {
    initializeConsent();
    saveConsent(OPTIONAL_OFF, "banner_reject_all");
    saveConsent({ ...OPTIONAL_OFF, preferences: true }, "panel_save");
    expect(insert).toHaveBeenCalledTimes(2);
    const row = insert.mock.calls[1][0];
    expect(row.anon_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row).toMatchObject({ version: "2026-11-01", preferences: true, analytics: false, marketing: false, source: "panel_save", page_path: "/" });
    expect(row).not.toHaveProperty("ip_address");
  });
  it("notifies subscribed scripts when consent is withdrawn", () => {
    initializeConsent();
    const listener = vi.fn();
    const unsubscribe = onConsentChange(listener);
    saveConsent(OPTIONAL_OFF, "panel_save");
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ analytics: false, marketing: false }));
    unsubscribe();
  });
});