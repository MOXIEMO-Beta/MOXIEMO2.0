import { Card } from "@/components/ui/card";
import { MarketingPage } from "./MarketingPage";

export default function About() {
  return (
    <MarketingPage
      eyebrow="About"
      title="BUILT FOR THE OPERATOR YOU ACTUALLY ARE."
      subtitle="MOXIE was born from one observation: the people doing $600K-$2M in coaching and consulting are spending 20 hours a week on tools instead of clients."
    >
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
          <p className="text-lg">We watched brilliant operators become part-time IT administrators. Patching together ConvertKit, Buffer, Kajabi, Calendly, Dubsado, Google Analytics. Re-explaining their business to every tool.</p>
          <p>So we built the opposite. One platform that asks who you are <em>once</em> — and lets every workflow inherit that answer.</p>
          <p>Strategy first. Execution embedded. No integrations. No Frankenstacks. Just confident marketing.</p>
        </div>
        <Card className="p-8 border-border shadow-card bg-card">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">Our principles</div>
          <ul className="space-y-4">
            {[
              "Replace tools, never integrate.",
              "Strategy is alive — not a static PDF.",
              "Honest urgency over hype.",
              "Built for real operators, not startups or enterprises.",
            ].map((p) => (
              <li key={p} className="font-medium border-l-2 border-accent pl-4 py-1">{p}</li>
            ))}
          </ul>
        </Card>
      </div>
    </MarketingPage>
  );
}