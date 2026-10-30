import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/lib/cookieConsent";
import { campaignLink, type Campaign } from "./campaign";

export function StartFooter({ campaign }: { campaign: Campaign }) {
  return <footer className="start-footer">
    <span>© 2026 KLMG US Ltd, LLC</span>
    <nav aria-label="Campaign footer">
      <Link to={campaignLink("/terms", campaign)}>Terms</Link>
      <Link to={campaignLink("/privacy", campaign)}>Privacy</Link>
      <Link to={campaignLink("/cookies", campaign)}>Cookies</Link>
      <Button variant="ghost" className="start-cookie-settings" onClick={openCookieSettings}>Cookie settings</Button>
      <Link to={campaignLink("/auth?mode=signin", campaign)}>Sign in</Link>
    </nav>
  </footer>;
}
