import { Check, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { Reveal, Kicker } from "./SectionParts";
import { openAssessment, startEvent } from "./heroData";
export function Assessment() {
  return <section id="assessment" className="start-section start-assessment-section"><div className="start-section-inner start-section-row">
    <Reveal className="start-column"><Kicker number="02">Start with a free assessment</Kicker><h2>Find out where your next growth opportunity might be hiding.</h2><p className="start-section-body">Every business has a different starting point. Tell us what you are building, who you are trying to reach, what is working today, and where you want to go.</p><p className="start-section-body">MOXIEMO uses that to uncover opportunities and show you where your attention could make the biggest difference.</p><p className="start-assessment-starting">Your free growth assessment is the starting point.</p><Button className="start-form-submit start-section-submit" onClick={() => { openAssessment(); startEvent("start_assess_section"); }}>Find my growth opportunities <ArrowRight size={18} /></Button></Reveal>
    <Reveal className="start-column start-assessment-art"><div className="start-section-float start-assessment-moxie"><MoxieAvatar pose="magnify" size={236} decorative /></div><div className="start-assessment-preview" aria-hidden="true"><div className="start-assessment-preview-title">Your growth assessment <span>Free</span></div><div className="start-assessment-checks">{["What you are building", "Who you want to reach", "What is working today", "Where you want to go"].map((text,index) => <div key={text} className={`start-assessment-check start-assessment-check-${index+1}`}><span><Check size={14} /></span>{text}</div>)}</div><div className="start-next-move"><TrendingUp size={18} />Your next growth move</div></div></Reveal>
  </div></section>;
}
