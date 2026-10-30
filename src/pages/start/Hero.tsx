import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoxieAvatar, type MoxiePose } from "@/components/MoxieAvatar";
import { getCtaLabel } from "@/lib/ctaVariant";
import { HeroAssessment } from "./HeroAssessment";
import { HeroFounding } from "./HeroFounding";
import { HeroQuestions } from "./HeroQuestions";
import { HeroHow } from "./HeroHow";
import { fixedHeadline, initialMessage, messages, startEvent, type HeroChoice } from "./heroData";
import { useTypedHeadline } from "./useTypedHeadline";
export { openSeat } from "./heroData";

const poses: Record<HeroChoice, MoxiePose> = { assessment: "magnify", seat: "cheer", questions: "point", how: "wave" };

export function Hero() {
  const [choice, setChoice] = useState<HeroChoice | null>(null);
  const phrase = useTypedHeadline();
  useEffect(() => {
    const showSeat = () => setChoice("seat");
    window.addEventListener("moxiemo:start-seat", showSeat);
    return () => window.removeEventListener("moxiemo:start-seat", showSeat);
  }, []);
  const choices: [HeroChoice, string][] = [["assessment", "Find my next growth move"], ["seat", getCtaLabel()], ["questions", "I have a few questions"], ["how", "Show me how MOXIEMO works"]];
  return <section id="start" className="start-hero">
    <div className="start-hero-top">
      <p className="start-eyebrow"><span aria-hidden="true" />Strategy-led marketing for founders and growing businesses</p>
      <h1 className="start-headline"><span className="sr-only">{fixedHeadline}</span><span aria-hidden="true"><span className="start-built-line">You built <span className="start-typed">{phrase}<span className="start-caret" /></span></span><span className="start-headline-second">Now stop guessing how to grow it.</span></span></h1>
      <p className="start-subhead">You are posting, promoting, launching campaigns, maybe even running ads. But do you actually know who your audience is, what brings your customers in, what is holding you back, or what to do next?</p>
    </div>
    {choice === "how" ? <HeroHow /> : <div className="start-stage">
      <div className="start-moxie-arrival"><div className="start-moxie-float"><div className="start-moxie-circle" /><div key={choice ?? "initial"} className="start-moxie-pose"><MoxieAvatar pose={choice ? poses[choice] : "wave"} size={236} /></div></div></div>
      <div className="start-message-card">
        <div className="start-message-header"><span className="start-message-icon"><MoxieAvatar pose="icon" size={30} decorative /><span /></span><span>MOXIE</span></div>
        <p className="start-message" aria-live="polite" aria-atomic="true">{choice ? messages[choice] : initialMessage}</p>
        {choice === "assessment" && <HeroAssessment />}
        {choice === "seat" && <HeroFounding />}
        {choice === "questions" && <HeroQuestions />}
      </div>
    </div>}
    <div className="start-choices">{choices.map(([value, label]) => <Button key={value} variant="outline" className="start-choice" aria-pressed={choice === value} onClick={() => { setChoice(value); startEvent(`start_choice_${value}`); }}>{label}</Button>)}
      {choice && <Button variant="outline" className="start-choice start-reset" onClick={() => setChoice(null)}>Something else</Button>}
    </div>
    <p className="start-hero-tagline">Your goals first. Your strategy next. Marketing that actually has a purpose.</p>
  </section>;
}
