import { MoxieAvatar } from "@/components/MoxieAvatar";
import { Reveal, Kicker } from "./SectionParts";
export function MeetMoxie() {
  return <section id="moxie" className="start-section start-meet-section"><div className="start-section-inner start-section-row">
    <Reveal className="start-column start-meet-art"><div className="start-meet-circle" /><div className="start-section-float"><MoxieAvatar pose="phone" size={300} decorative loading="lazy" /></div></Reveal>
    <Reveal className="start-column"><Kicker number="04">Meet MOXIE</Kicker><h2>Hi, I am MOXIE.</h2><div className="start-chat-stack">{["Think of me as the marketing partner who knows your business, remembers your goals, and helps you keep moving.", "Need to approve something? Soon I will be able to text you.", "Wondering what needs your attention this week? Just ask me.", "Need a reminder, or want to check on your progress? I can help with that, too."].map((text,index) => <p key={text} className={`start-meet-chat start-meet-chat-${index+1}`}>{text}</p>)}<div className="start-typing-bubble" aria-hidden="true"><span /><span /><span /></div></div><p className="start-texting-pill"><span />Two-way texting with MOXIE is coming in a future release.</p></Reveal>
  </div></section>;
}
