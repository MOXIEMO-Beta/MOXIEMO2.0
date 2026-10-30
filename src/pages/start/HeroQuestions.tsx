import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { questions } from "./heroData";
export function HeroQuestions() {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="start-questions">{questions.map(([question, answer], index) => <div key={question} className="start-question-row">
    <Button variant="ghost" className="start-question" aria-expanded={open === index} aria-controls={`start-answer-${index}`} onClick={() => setOpen(open === index ? null : index)}>
      <span>{question}</span><Plus size={16} className={open === index ? "start-plus-open" : ""} />
    </Button>
    {open === index && <p id={`start-answer-${index}`} className="start-answer">{answer}</p>}
  </div>)}</div>;
}
