import { ArrowRight } from "lucide-react";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { Reveal, Kicker } from "./SectionParts";
const prompts = ["Who is your audience?", "What brings your customers in?", "What is holding you back?", "What should you do next?"];
const steps = ["Strategy", "Content", "Campaigns", "Publishing", "Testing", "Measuring results"];
export function HowWeStart() {
  return <section id="start" className="start-section start-how-start"><div className="start-section-inner start-section-row">
    <Reveal className="start-column"><div className="start-question-panel" aria-hidden="true">{prompts.map((text, index) => <p key={text} className={`start-decor-bubble start-decor-bubble-${index+1}`}>{text}</p>)}<div className="start-section-float"><MoxieAvatar pose="icon" size={84} decorative /></div></div></Reveal>
    <Reveal className="start-column"><Kicker>How we start</Kicker><h2>MOXIEMO starts with the questions other marketing tools skip.</h2><p className="start-section-body">We get to know your business, uncover the gaps in your brand and marketing, and build a growth strategy around what you are trying to achieve.</p><p className="start-section-body start-work-line">Then we help do the work.</p>
      <div className="start-process-pills">{steps.map((text,index) => <span key={text} className="start-process-item"><span className={`start-process-pill start-process-pill-${index+1}`}>{text}</span>{index<5 && <ArrowRight size={14} aria-hidden="true" />}</span>)}</div>
      <p className="start-section-body start-companion-line">And MOXIE, your built-in growth companion, keeps things moving and keeps you accountable.</p>
    </Reveal>
  </div></section>;
}
