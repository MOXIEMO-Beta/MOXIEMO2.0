import { MoxieAvatar } from "@/components/MoxieAvatar";
import { HeroFounding } from "./HeroFounding";
import { Reveal, Kicker } from "./SectionParts";
export function Founding() {
  return <section id="founding" className="start-section"><div className="start-section-inner"><Reveal><div className="start-founding-card start-section-row">
    <div className="start-column"><Kicker number="05">Claim your founding access</Kicker><h2>We want you to be a part of what we are building.</h2><p className="start-section-body">MOXIEMO is being built for founders and business owners who want something more useful than yet another marketing tool. We are opening a limited founding-member opportunity as we introduce new capabilities.</p><HeroFounding entry="section" /></div>
    <div className="start-founding-art" aria-hidden="true"><div className="start-section-float"><MoxieAvatar pose="cheer" size={200} decorative loading="lazy" /></div><div className="start-seat-grid">{Array.from({length:100},(_,index) => <span key={index} className={`start-seat-square start-seat-diagonal-${Math.floor(index/10)+index%10}`} />)}</div><p className="start-seat-caption">100 founding seats.<br /><em>50% off, for life.</em></p></div>
  </div></Reveal></div></section>;
}
