import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { applyClarityConsent } from "@/lib/clarityConsent";
import { CONSENT_KEY, ConsentChoice, ConsentSource, expireConsent, getConsent, hasGpc, initializeConsent, onConsentChange, OPEN_COOKIE_SETTINGS, OPTIONAL_OFF, OptionalChoices, saveConsent, syncStoredConsent } from "@/lib/cookieConsent";

const categories = [
  { key: "preferences", title: "Preferences", body: "Remember settings you choose, like your monthly or annual pricing view." },
  { key: "analytics", title: "Analytics", body: "Help us see how visitors use the site so we can fix problems and improve pages. We use Microsoft Clarity, which records clicks, scrolls and page movement to build heatmaps and session replays." },
  { key: "marketing", title: "Marketing", body: "Help us measure our ads and campaigns. If you allow this, Microsoft may use site data for advertising." },
] as const;

export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OptionalChoices>(OPTIONAL_OFF);
  const trigger = useRef<HTMLElement | null>(null);

  function openPanel() {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDraft(getConsent() ?? { ...OPTIONAL_OFF });
    setOpen(true);
  }

  useEffect(() => {
    const initial = initializeConsent();
    setChoice(initial);
    setReady(true);
    applyClarityConsent(initial);
    const unsubscribe = onConsentChange(next => { setChoice(next); applyClarityConsent(next); });
    const settings = () => openPanel();
    const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY || event.key === null) syncStoredConsent(); };
    const visibility = () => { if (document.visibilityState === "visible") expireConsent(); };
    window.addEventListener(OPEN_COOKIE_SETTINGS, settings);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", visibility);
    const interval = window.setInterval(expireConsent, 60000);
    return () => {
      unsubscribe();
      window.removeEventListener(OPEN_COOKIE_SETTINGS, settings);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visibility);
      window.clearInterval(interval);
    };
  }, []);

  function save(values: OptionalChoices, source: ConsentSource) {
    saveConsent(values, source);
    setOpen(false);
    toast.success("Your cookie choices are saved.");
  }
  const allOn = { preferences: true, analytics: true, marketing: true };

  return <>
    {ready && !choice && !open && <section role="region" aria-label="Cookie consent" className="cookie-surface cookie-banner">
      <h2 className="cookie-title">Your privacy, your call</h2>
      <p className="cookie-copy">We use cookies to keep this site working. With your OK, we also use them to see how the site is used and to measure our marketing. You can accept all, reject all or choose. Learn more in our <Link className="cookie-link" to="/privacy">Privacy Policy</Link> and <Link className="cookie-link" to="/terms">Terms of Service</Link>.</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="consent" onClick={() => save(allOn, "banner_accept_all")}>Accept all</Button>
        <Button variant="consent" onClick={() => save(OPTIONAL_OFF, "banner_reject_all")}>Reject all</Button>
        <Button variant="consentOutline" className="col-span-2" onClick={openPanel}>Manage preferences</Button>
      </div>
    </section>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-labelledby="cookie-preferences-title" aria-modal="true" className="cookie-surface cookie-panel" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <DialogTitle id="cookie-preferences-title" className="cookie-title">Cookie preferences</DialogTitle>
        <DialogDescription className="cookie-copy">Choose which cookies we can use. You can change this anytime from Cookie settings at the bottom of any page.</DialogDescription>
        <div>
          <div className="cookie-category">
            <div><label htmlFor="cookie-necessary" className="cookie-label">Strictly necessary <span className="cookie-always">Always on</span></label><p id="cookie-necessary-description" className="cookie-copy mt-2">Keep the site and your account working, like signing in, security and remembering your cookie choices.</p></div>
            <Switch id="cookie-necessary" checked disabled aria-label="Strictly necessary" aria-describedby="cookie-necessary-description" className="cookie-toggle" />
          </div>
          {categories.map(category => <div key={category.key} className="cookie-category">
            <div><label htmlFor={`cookie-${category.key}`} className="cookie-label">{category.title}</label><p id={`cookie-${category.key}-description`} className="cookie-copy mt-2">{category.body}</p></div>
            <Switch id={`cookie-${category.key}`} checked={draft[category.key]} onCheckedChange={value => setDraft(previous => ({ ...previous, [category.key]: value }))} aria-describedby={`cookie-${category.key}-description`} className="cookie-toggle" />
          </div>)}
        </div>
        {hasGpc() && <p className="cookie-copy cookie-gpc">We detected a Global Privacy Control signal from your browser, so we turned off optional cookies.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="consent" className="col-span-2" onClick={() => save(draft, "panel_save")}>Save my choices</Button>
          <Button variant="consent" onClick={() => save(allOn, "banner_accept_all")}>Accept all</Button>
          <Button variant="consent" onClick={() => save(OPTIONAL_OFF, "banner_reject_all")}>Reject all</Button>
        </div>
        <Link to="/privacy" onClick={() => setOpen(false)} className="cookie-link text-sm">Read our Privacy Policy</Link>
      </DialogContent>
    </Dialog>
  </>;
}