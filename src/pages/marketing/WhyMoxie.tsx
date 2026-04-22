import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { MarketingPage } from "./MarketingPage";

const them = ["Generic AI prompts", "Frankenstack of 6+ tools", "Strategy lives in a PDF", "Built for everyone, fits no one"];
const us = ["Strategy-aware AI in your voice", "One platform, zero integrations", "Strategy embedded in every module", "Built for $600K-$2M operators"];

export default function WhyMoxie() {
  return (
    <MarketingPage
      eyebrow="Why MOXIE"
      title="WE REPLACE TOOLS. WE DON'T INTEGRATE WITH THEM."
      subtitle="Most marketing platforms add to your stack. MOXIE removes 4-6 tools and gives you back 18+ hours a week."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 border-border shadow-soft">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-bold">The old way</div>
          <ul className="space-y-3">
            {them.map((t) => (
              <li key={t} className="flex gap-3 text-sm">
                <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-8 border-accent shadow-lift bg-accent-soft/40">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">MOXIE</div>
          <ul className="space-y-3">
            {us.map((t) => (
              <li key={t} className="flex gap-3 text-sm">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </MarketingPage>
  );
}