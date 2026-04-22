import { Card } from "@/components/ui/card";
import { MarketingPage } from "./MarketingPage";

const profiles = [
  {
    t: "Executive Coaches",
    rev: "$600K–$2M annually",
    challenge: "Managing Kajabi, ConvertKit, Calendly, Dubsado, Later, and Google Analytics takes 20+ hours weekly. You're spending more time on marketing than coaching.",
    help: ["Position as the coach who's lived what clients are experiencing", "One platform for courses, email, scheduling, social", "18 hours back to coach high-ticket clients"],
    quote: "I went from 20 hours managing tools to 2 hours approving content. MOXIE gave me my CEO life back.",
    who: "Sarah Thompson — Executive Coach, $650K",
  },
  {
    t: "Business Consultants",
    rev: "$800K–$3M annually",
    challenge: "Disconnected marketing across LinkedIn, email, and content. No coherent narrative. Prospects confused about what you actually do.",
    help: ["Clarify positioning and the transformation you provide", "Content calendar that builds a clear narrative", "Qualified leads who understand your value before the first call"],
    quote: "MOXIE's AI discovery nailed my positioning better than the $5K consultant I hired. And unlike their PDF, MOXIE executes.",
    who: "Michael Chen — Leadership Consultant, $1.2M",
  },
  {
    t: "Service-Based Agencies",
    rev: "$1M–$5M annually",
    challenge: "You create brilliant strategies for clients but never execute your own marketing consistently. Cobbler's children, no shoes.",
    help: ["Practice what you preach with a strategic foundation", "Marketing runs without pulling team off client work", "Consistent pipeline without sacrificing delivery"],
    quote: "We're a marketing agency that couldn't market ourselves. MOXIE gave us the system we build for clients — for ourselves.",
    who: "David Park — Agency Founder, $2.3M",
  },
];

const scenarios = [
  { t: "The tool chaos problem", before: "Six tools. Data scattered. Integrations break at 2 AM. You hired a VA — she quit after 6 weeks.", after: "Replaces 4–6 tools with one unified platform. No integrations needed. 18+ hours/week back." },
  { t: "The disconnected content problem", before: "You post when you remember. Email when you have something to say. No coherent narrative.", after: "30-min discovery → quarterly themes → AI writes in your voice. Random posts become a brand narrative." },
  { t: "The 'what should I post?' problem", before: "It's Wednesday. Blank LinkedIn screen. Everything feels forced or generic.", after: "90 days of topics, every one tied to your strategy and audience pain points. Blank screen never again." },
  { t: "The ROI uncertainty problem", before: "$800/mo on tools, 20 hours/week, no idea if any of it works. Discovery calls feel random.", after: "Define YOUR success metric in discovery. Get attribution + ROI tied to real business outcomes." },
  { t: "The scale-without-chaos problem", before: "To grow $750K → $1.5M you'd need 40-hour marketing weeks. CMO costs $120K. Agencies $5K/mo.", after: "Same 2 hours/week at $600K or $1.5M. The system scales — you don't have to." },
];

export default function Solutions() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="Built for the messy middle."
      subtitle="You're too successful for scrappy startup hacks. Not big enough for enterprise platforms with 6-month implementations. MOXIE is built for $600K–$2M coaches, consultants, and agencies."
    >
      <div className="space-y-24">
        {/* ICPs */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">The exact businesses MOXIE serves.</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {profiles.map((p) => (
              <Card key={p.t} className="p-8 border-border shadow-soft flex flex-col">
                <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">{p.rev}</div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{p.t}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-5"><span className="font-semibold text-foreground">The challenge:</span> {p.challenge}</p>
                <ul className="space-y-2 mb-6 text-sm">
                  {p.help.map((h) => (
                    <li key={h} className="border-l-2 border-accent pl-3 py-0.5 font-medium">{h}</li>
                  ))}
                </ul>
                <blockquote className="mt-auto border-t border-border pt-5">
                  <p className="text-sm italic font-light text-muted-foreground mb-2">"{p.quote}"</p>
                  <cite className="text-xs font-semibold not-italic">{p.who}</cite>
                </blockquote>
              </Card>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The problems MOXIE actually solves.</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">Five scenarios we hear every single week. You'll recognize at least three.</p>
          </div>
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <Card key={s.t} className="p-7 md:p-8 border-border shadow-soft">
                <div className="grid md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-8 items-start">
                  <div className="font-display text-4xl text-muted-foreground/40 leading-none">0{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{s.before}</p>
                  </div>
                  <div className="md:border-l border-border md:pl-8">
                    <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">With MOXIE</div>
                    <p className="text-sm font-medium leading-relaxed">{s.after}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}