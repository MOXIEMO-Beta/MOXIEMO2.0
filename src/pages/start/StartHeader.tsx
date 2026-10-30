import { Button } from "@/components/ui/button";
import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
import logo from "@/assets/redesign/moxiemo-logo.png.asset.json";

export function StartHeader() {
  return <header className="start-header">
    <a href="#top" className="start-logo" aria-label="MOXIEMO, back to top"><img src={logo.url} alt="MOXIEMO" /></a>
    <nav aria-label="Campaign navigation">
      <a className="start-nav-link" href="#assessment">Free assessment</a>
      <a className="start-nav-link" href="#moxie">Meet MOXIE</a>
      <Button asChild className="start-cta"><a href="#founding" onClick={trackCtaClick}>{getCtaLabel()}</a></Button>
    </nav>
  </header>;
}
