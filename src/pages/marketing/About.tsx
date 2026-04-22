import { Card } from "@/components/ui/card";
import { MarketingPage } from "./MarketingPage";

const values = [
  { n: "01", t: "End fragmentation, don't add to it.", d: "Every feature should reduce tools, not add layers. We're not making better integrations — we're replacing fragmented systems entirely.", filter: "Does this end fragmentation or perpetuate it?" },
  { n: "02", t: "Respect time as currency.", d: "Customers are drowning in 20 hours/week of tool management. Every minute we waste is time they could spend on their business.", filter: "Does this save more time than it takes?" },
  { n: "03", t: "Built for operators, not engineers.", d: "Sarah is brilliant at coaching. She's not a developer. If a feature requires technical knowledge, we've failed.", filter: "Can Sarah use this without frustration?" },
  { n: "04", t: "Honest urgency over hype.", d: "The problem is real (20 hrs/week wasted). The ROI is real ($93K saved). We don't need to exaggerate.", filter: "Is this true and specific, or vague hype?" },
  { n: "05", t: "Compound simplicity over feature bloat.", d: "Fewer features that multiply each other's value. Tool-fatigued users don't want more — they want fewer, better.", filter: "Does this make the platform simpler or more complex?" },
];

const vision = [
  { y: "2026", t: "Year 1", d: "Free 75 founders from tool chaos, reclaiming 1,350 hours weekly for strategic growth." },
  { y: "2028", t: "Year 3", d: "Free 400 founders across coaching, consulting, and service businesses — each reclaiming 18+ hours weekly." },
  { y: "2030", t: "Year 5", d: "Free 1,500 service businesses from tool chaos, proving consolidation beats fragmentation as the industry standard." },
];

export default function About() {
  return (
    <MarketingPage
      eyebrow="About"
      title="Ending the tool fragmentation era."
      subtitle="MOXIE exists because brilliant entrepreneurs deserve to be strategic leaders — not exhausted system administrators."
    >
      <div className="space-y-24">
        {/* Founder story */}
        <section className="grid md:grid-cols-[1fr_2fr] gap-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-3">Why MOXIE exists</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">14 years watching brilliant people drown in tool chaos.</h2>
          </div>
          <div className="space-y-5 text-muted-foreground font-light leading-relaxed">
            <p>I've spent 14 years in marketing and branding, working with hundreds of founders. Brilliant people — exceptional at coaching, consulting, transforming lives — coming to me drowning in marketing chaos. Six, seven, sometimes eight different tools.</p>
            <p className="italic text-foreground">"I thought these tools were supposed to make marketing easier. Instead, I spend all my time managing the tools and have no time left to actually market."</p>
            <p>And what broke my heart: <span className="font-semibold text-foreground">they thought it was their fault.</span></p>
            <p>But the problem wasn't them. Every tool was built to solve ONE piece of the puzzle, with no thought to how it fits into a complete system. Email tools don't talk to social tools. Social tools don't inform strategy. Strategy? That's something founders are supposed to figure out themselves, then manually execute across 6 disconnected platforms.</p>
            <p>Even with 14 years of expertise, I was living it too — searching for the perfect stack, building Zapier integrations that broke, spending weekends "just catching up." If I was struggling, what chance did my clients have?</p>
            <p className="font-medium text-foreground">That's when the insight hit: the problem isn't that we need better tools. It's that we're approaching marketing backwards.</p>
            <p>What founders need is to start with strategy — and build execution systems that flow from it. Not a consultant's PDF you manually execute. A living system where strategy guides every tool automatically.</p>
            <p className="text-foreground font-medium">That's why MOXIE exists. Not to be another tool in the stack — to be the comprehensive system that gives you back your strategic identity.</p>
            <p className="pt-3 text-sm">— Karee Laing, Founder</p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-foreground text-background -mx-6 px-6 md:-mx-12 md:px-12 py-16 rounded-3xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-4">Our mission</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">We're ending the tool fragmentation era — turning exhausted operators into strategic marketers who actually grow revenue.</h2>
            <p className="text-background/70 font-light leading-relaxed">In five years, we want "tool fragmentation" to feel as outdated as fax machines. The default answer should be: <em>just use MOXIE.</em></p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">What guides every decision.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => (
              <Card key={v.n} className="p-8 border-border shadow-soft">
                <div className="font-display text-4xl text-accent mb-3">{v.n}</div>
                <h3 className="font-bold text-xl mb-3 tracking-tight">{v.t}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">{v.d}</p>
                <div className="border-l-2 border-accent pl-3 py-1">
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-bold mb-1">Decision filter</div>
                  <p className="text-sm font-medium italic">"{v.filter}"</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Vision */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">Where we're going.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {vision.map((v) => (
              <Card key={v.y} className="p-8 border-border shadow-soft text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-3">{v.t}</div>
                <div className="font-display text-5xl mb-4">{v.y}</div>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{v.d}</p>
              </Card>
            ))}
          </div>
          <p className="text-center mt-10 italic text-muted-foreground font-light max-w-2xl mx-auto">"I'm a strategist again, not an operator." That's the North Star.</p>
        </section>
      </div>
    </MarketingPage>
  );
}