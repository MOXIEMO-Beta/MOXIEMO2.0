import { Button } from "@/components/ui/button";
import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
const logo = { url: "/moxiemo-logo-header.png" };

export function StartHeader() {
  return <header className="start-header">
    <a href="#top" className="start-logo" aria-label="MOXIEMO, back to top"><img src={logo.url} alt="MOXIEMO" width={158} height={30} /></a>
    <nav aria-label="Campaign navigation">
      <a className="start-nav-link" href="#assessment">Free assessment</a>
      <a className="start-nav-link" href="#moxie">Meet MOXIE</a>
      <Button asChild className="start-cta"><a href="#founding" onClick={trackCtaClick}>{getCtaLabel()}</a></Button>
    </nav>
  </header>;
}
