import { Button } from "@/components/ui/button";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { howStages, stageProgress } from "./howData";
export function HowRing({ stage, final, onStage }: { stage: number; final: boolean; onStage: (stage: number) => void }) {
  const progress = stageProgress(stage, final);
  return <div className="start-how-ring">
    <svg viewBox="0 0 560 560" className="start-ring-svg" aria-hidden="true">
      <circle cx="280" cy="280" r="150" className="start-ring-fill" />
      <circle cx="280" cy="280" r="212.8" className="start-ring-dots" />
      <circle cx="280" cy="280" r="212.8" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - progress} transform="rotate(-90 280 280)" className="start-ring-progress" data-progress={progress} />
      {[0,1,2,3,4,5].map(index => <g key={index} transform={`rotate(${index * 60 + 30} 280 280)`}><path d="M276 63 l4 4 l-4 4" className="start-ring-chevron" /></g>)}
    </svg>
    <div className="start-ring-moxie"><MoxieAvatar pose="wave" size={180} /></div>
    {howStages.map((item, index) => {
      const number = index + 1;
      const state = !final && stage === number ? "current" : final || number < stage ? "done" : "future";
      return <div key={item.name} className={`start-ring-node start-ring-node-${number}`}>
        <Button className={`start-ring-button start-ring-${state}`} variant="outline" aria-label={`Stage ${number}, ${item.name}`} aria-current={state === "current" ? "step" : undefined} onClick={() => onStage(number)}>{number}</Button>
        <span className={`start-ring-label start-ring-label-${state}`}>{item.name}</span>
      </div>;
    })}
  </div>;
}
