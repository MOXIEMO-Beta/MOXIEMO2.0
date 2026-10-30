import { useState } from "react";
import { FileText, CalendarDays, Grid2X2, Search, TrendingUp, MessageSquare, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { getCtaLabel } from "@/lib/ctaVariant";
import { openSeat } from "./heroData";
import { deliverables, howStages, nextStage, previousStage } from "./howData";
import { HowRing } from "./HowRing";
const icons = [FileText, CalendarDays, Grid2X2, Search, TrendingUp, MessageSquare];
export function HeroHow() {
  const [stage, setStage] = useState(1);
  const [final, setFinal] = useState(false);
  const current = howStages[stage - 1];
  return <div className="start-how">
    <HowRing stage={stage} final={final} onStage={number => { setStage(number); setFinal(false); }} />
    <div className="start-message-card start-how-card">
      <div className="start-message-header"><span className="start-message-icon"><MoxieAvatar pose="icon" size={30} decorative /><span /></span><span>MOXIE</span></div>
      {stage === 1 && !final && <p className="start-message">Here is how we work together. Six stages, then it loops.</p>}
      <div className="start-how-content" aria-live="polite" aria-atomic="true">
        {final ? <>
          <p className="start-how-eyebrow">What you get</p>
          <h2 className="start-how-final-title">Here is everything MOXIEMO builds.</h2>
          <ul className="start-deliverables">{deliverables.map((item, index) => {
            const Icon = icons[index];
            return <li key={item.name} className={`start-deliverable start-deliverable-${index + 1}`}><span className={`start-deliverable-icon start-deliverable-color-${index % 3}`}>{Icon && <Icon size={17} />}</span><div><strong>{item.name}</strong><p>{item.line}</p></div></li>;
          })}</ul>
        </> : <>
          <p className="start-how-eyebrow">Stage {stage} of 6</p>
          <h2 className="start-how-title">{current.name}</h2>
          <p className="start-how-line">{current.line}</p>
          {stage === 6 && <p className="start-how-loop"><Repeat2 size={18} />Then the loop starts again.</p>}
        </>}
      </div>
      <div className="start-how-actions">
        {(stage > 1 || final) && <Button variant="outline" className="start-how-back" onClick={() => { if (final) setFinal(false); else setStage(previousStage(stage)); }}>Back</Button>}
        {final ? <Button className="start-form-submit" onClick={openSeat}>{getCtaLabel()}</Button> : stage === 6 ? <Button className="start-form-submit" onClick={() => setFinal(true)}>Show me everything MOXIEMO builds</Button> : <Button className="start-how-next" onClick={() => setStage(nextStage(stage))}>Next step</Button>}
      </div>
    </div>
  </div>;
}
