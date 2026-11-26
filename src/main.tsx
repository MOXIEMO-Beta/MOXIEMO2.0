import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import App from "./App.tsx";
import "./index.css";
import { getCtaVariant } from "./lib/ctaVariant";

// ── Sentry (error monitoring) ──────────────────────────────────────────────
// DSN is set via VITE_SENTRY_DSN. No-ops gracefully in local dev when unset.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Only send errors in production — avoids noise in dev/staging
    beforeSend: (event) => (import.meta.env.PROD ? event : null),
  });
}

// ── PostHog (product analytics) ───────────────────────────────────────────
// Key is set via VITE_POSTHOG_KEY. No-ops gracefully in local dev when unset.
const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage+cookie",
    loaded: (ph) => {
      if (!import.meta.env.PROD) ph.opt_out_capturing();
    },
  });
}

getCtaVariant();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<HelmetProvider><App /></HelmetProvider>);
}
