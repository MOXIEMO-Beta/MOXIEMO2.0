import { supabase } from "@/integrations/supabase/client";

export const CONSENT_VERSION = "2026-11-01";
export const CONSENT_KEY = "moxiemo_consent";
export const OPEN_COOKIE_SETTINGS = "moxiemo:cookie-settings";
export type OptionalChoices = { preferences: boolean; analytics: boolean; marketing: boolean };
export type ConsentChoice = OptionalChoices & { version: string; timestamp: string; necessary: true; gpc: boolean };
export type ConsentSource = "banner_accept_all" | "banner_reject_all" | "panel_save" | "gpc_auto";
export const OPTIONAL_OFF: OptionalChoices = { preferences: false, analytics: false, marketing: false };
type Listener = (choice: ConsentChoice | null) => void;
const listeners = new Set<Listener>();
let memoryChoice: ConsentChoice | null = null;
let memoryAnonId: string | null = null;

declare global {
  interface Window {
    moxiemoConsent: { get: typeof getConsent; onChange: typeof onConsentChange };
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
  interface Navigator { globalPrivacyControl?: boolean }
}

export function validConsent(value: unknown, now = new Date()): value is ConsentChoice {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ConsentChoice>;
  const cutoff = new Date(now);
  const day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 6);
  const endOfMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, endOfMonth));
  const time = typeof record.timestamp === "string" ? Date.parse(record.timestamp) : NaN;
  return record.version === CONSENT_VERSION && record.necessary === true &&
    [record.preferences, record.analytics, record.marketing, record.gpc].every(v => typeof v === "boolean") &&
    Number.isFinite(time) && time >= cutoff.getTime() && time <= now.getTime();
}

export function readConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return validConsent(parsed) ? parsed : null;
  } catch { return null; }
}

export function getConsent(): ConsentChoice | null {
  return memoryChoice && validConsent(memoryChoice) ? { ...memoryChoice } : null;
}

export function hasGpc() { return navigator.globalPrivacyControl === true; }

export function onConsentChange(callback: Listener) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

function notify() { listeners.forEach(listener => listener(getConsent())); }

function anonId() {
  if (memoryAnonId) return memoryAnonId;
  try {
    const saved = localStorage.getItem("moxiemo_anon_id");
    if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) memoryAnonId = saved;
  } catch { /* A session-only identifier is used when storage is unavailable. */ }
  if (!memoryAnonId) memoryAnonId = crypto.randomUUID();
  try { localStorage.setItem("moxiemo_anon_id", memoryAnonId); } catch { /* Choice still applies for this visit. */ }
  return memoryAnonId;
}

export function saveConsent(choices: OptionalChoices, source: ConsentSource): ConsentChoice {
  const choice: ConsentChoice = { version: CONSENT_VERSION, timestamp: new Date().toISOString(), necessary: true, preferences: choices.preferences, analytics: choices.analytics, marketing: choices.marketing, gpc: hasGpc() };
  memoryChoice = choice;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(choice)); } catch { /* Keep the choice in memory for this visit. */ }
  notify();
  void (async () => {
    try {
      const { error } = await supabase.from("cookie_consents").insert({
        anon_id: anonId(), version: choice.version, preferences: choice.preferences,
        analytics: choice.analytics, marketing: choice.marketing, gpc: choice.gpc,
        source, page_path: window.location.pathname,
      });
      if (error) console.error("Cookie consent log could not be saved:", error.message);
    } catch { console.error("Cookie consent log could not be saved."); }
  })();
  return { ...choice };
}

export function initializeConsent() {
  memoryChoice = readConsent();
  if (!memoryChoice && hasGpc()) saveConsent(OPTIONAL_OFF, "gpc_auto");
  window.moxiemoConsent = { get: getConsent, onChange: onConsentChange };
  return getConsent();
}

export function syncStoredConsent() { memoryChoice = readConsent(); notify(); }
export function expireConsent() {
  if (memoryChoice && !validConsent(memoryChoice)) { memoryChoice = null; notify(); }
}

export function openCookieSettings() { window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS)); }