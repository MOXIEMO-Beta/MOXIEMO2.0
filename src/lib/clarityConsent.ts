import { ConsentChoice, getConsent } from "@/lib/cookieConsent";

let clarityRequested = false;
let previouslyAllowed = false;

export function deleteClarityCookies() {
  const hostParts = window.location.hostname.split(".");
  const domains = ["", ...hostParts.map((_, index) => hostParts.slice(index).join("."))];
  const segments = window.location.pathname.split("/");
  const paths = new Set(["/", ...segments.map((_, index) => segments.slice(0, index + 1).join("/") || "/")]);
  for (const cookie of ["_clck", "_clsk"]) {
    for (const path of paths) for (const domain of domains) {
      document.cookie = `${cookie}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

function sendClarityConsent(analytics: boolean, marketing: boolean) {
  window.clarity?.("consentv2", {
    analytics_Storage: analytics ? "granted" : "denied",
    ad_Storage: marketing ? "granted" : "denied",
  });
}

export function applyClarityConsent(choice: ConsentChoice | null) {
  const analytics = choice?.analytics === true;
  const marketing = choice?.marketing === true;
  if (!analytics) {
    sendClarityConsent(false, false);
    deleteClarityCookies();
    if (previouslyAllowed && clarityRequested) {
      // A loaded third-party script cannot be unloaded. Restart with its loader blocked.
      window.setTimeout(() => window.location.reload(), 800);
    }
    previouslyAllowed = false;
    return;
  }
  previouslyAllowed = true;
  if (!clarityRequested) {
    clarityRequested = true;
    window.clarity = window.clarity || Object.assign((...args: unknown[]) => {
      window.clarity?.q?.push(args);
    }, { q: [] as unknown[][] });
    sendClarityConsent(analytics, marketing);
    const script = document.createElement("script");
    script.id = "moxiemo-clarity";
    script.async = true;
    script.src = "https://www.clarity.ms/tag/xwa1meyqgq";
    script.onload = () => {
      const latest = getConsent();
      sendClarityConsent(latest?.analytics === true, latest?.analytics === true && latest?.marketing === true);
    };
    document.head.appendChild(script);
  } else sendClarityConsent(analytics, marketing);
}