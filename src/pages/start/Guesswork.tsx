import { Grid2X2, Filter, Target } from "lucide-react";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { Reveal, Kicker } from "./SectionParts";
const chips = ["Post more?", "Run an ad?", "Try reels?", "New offer?", "Email blast?", "Rebrand?", "Go viral?"];
const cards = ["Maybe you are posting consistently but not seeing customers come through.", "Maybe you are attracting attention but not converting enough of it into sales.", "Or maybe you know exactly what you want to achieve but have no clear idea which marketing activities will get you there."];
const icons = [Grid2X2, Filter, Target];
export function Guesswork() {
  return <section id="guesswork" className="start-section"><div className="start-section-inner">
    <div className="start-section-row"><Reveal className="start-column"><Kicker number="01">Sound familiar?</Kicker><h2>Your business does not need more marketing <em>guesswork.</em></h2></Reveal><div className="start-guess-chips start-column" aria-hidden="true">{chips.map((text,index) => <span key={text} className={`start-guess-chip start-guess-chip-${index+1}`}>{text}</span>)}</div></div>
    <div className="start-three-cards start-guess-cards">{cards.map((text,index) => { const Icon=icons[index];return <Reveal key={text}><article className="start-lift-card"><span className={`start-card-icon start-deliverable-color-${index}`}><Icon size={22} /></span><p>{text}</p></article></Reveal>; })}</div>
    <div className="start-section-row start-guess-bottom"><Reveal className="start-column"><p className="start-guess-thought">Here is the thing: more marketing is not necessarily better marketing.</p></Reveal><Reveal className="start-column"><div className="start-strategy-note"><MoxieAvatar pose="icon" size={60} decorative loading="lazy" /><p>The right strategy starts with understanding the business, not creating the next campaign.</p></div></Reveal></div>
  </div></section>;
}
