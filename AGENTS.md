# Project rules
- Preserve `/why-moxie` as a replace-navigation redirect to `/why-moxiemo` so legacy links reach the canonical page without retaining an obsolete page in browser history.
- Mount one cookie consent controller at the app root; all optional script loaders must use window.moxiemoConsent before loading so choices apply across every route.
- Keep consent validation and persistence separate from the dialog; use Radix for modal focus management and an insert-only consent log for visitor evidence.
- Reload after analytics withdrawal to stop already-loaded Clarity code, because removing its script element alone cannot unload running third-party code.