export type CtaVariant = "seat" | "early";
const STORAGE_KEY = "moxiemo_cta_variant";
let currentVariant: CtaVariant | undefined;

function isVariant(value: unknown): value is CtaVariant {
  return value === "seat" || value === "early";
}

export function getCtaVariant(): CtaVariant {
  const override = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("cta");
  if (isVariant(override)) {
    currentVariant = override;
    try { localStorage.setItem(STORAGE_KEY, override); } catch { /* Keep this page-load assignment. */ }
    return override;
  }
  if (currentVariant) return currentVariant;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isVariant(saved)) currentVariant = saved;
  } catch { /* Storage is optional. */ }
  currentVariant ??= Math.random() < 0.5 ? "seat" : "early";
  try { localStorage.setItem(STORAGE_KEY, currentVariant); } catch { /* Keep this page-load assignment. */ }
  return currentVariant;
}

export function getCtaLabel(): string {
  return getCtaVariant() === "seat" ? "Claim my founding seat" : "Claim early access";
}

export function tagCtaVariant() {
  if (typeof window === "undefined" || window.moxiemoConsent?.get()?.analytics !== true) return;
  window.clarity?.("set", "cta_variant", getCtaVariant());
}

export function trackCtaClick() {
  if (typeof window === "undefined" || window.moxiemoConsent?.get()?.analytics !== true) return;
  tagCtaVariant();
  window.clarity?.("event", "cta_click_" + getCtaVariant());
}