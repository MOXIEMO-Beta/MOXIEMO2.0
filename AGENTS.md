# Project rules
- Preserve `/why-moxie` as a replace-navigation redirect to `/why-moxiemo` so legacy links reach the canonical page without retaining an obsolete page in browser history.
- Mount one HelmetProvider at the app entry and use Helmet for new route-specific metadata, so route titles and self-referencing canonical URLs have a single lifecycle owner.
- Mount one cookie consent controller at the app root; all optional script loaders must use window.moxiemoConsent before loading so choices apply across every route.
- Keep consent validation and persistence separate from the dialog; use Radix for modal focus management and an insert-only consent log for visitor evidence.
- Reload after analytics withdrawal to stop already-loaded Clarity code, because removing its script element alone cannot unload running third-party code.
- Keep public pricing data and offer rules in the pricing data module, shared by the pricing cards and comparison table and covered by concrete rate tests, to prevent inconsistent plan displays.
- Persist home first-100 brand counts through the existing waitlist handler with server validation; keep the column nullable for legacy and other forms so existing signup paths continue working.