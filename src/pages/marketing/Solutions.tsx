import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StatsBar } from "@/components/StatsBar";

const profiles = [
  {
    t: "Executive Coaches",
    rev: "$500K–$1.5M annually",
    challenge: "Managing Kajabi, ConvertKit, Calendly, Dubsado, Later, and Google Analytics takes 20+ hours weekly. You're spending more time on marketing than coaching.",
    help: ["Position as the coach who's lived what clients are experiencing", "One platform for courses, email, scheduling, social", "18 hours back to coach high-ticket clients"],
    quote: "I went from 20 hours managing tools to 2 hours approving content. MOXIE gave me my CEO life back.",
    who: "Sarah Thompson — Executive Coach, $650K",
  },
  {
    t: "Fractional Executives & Consultants",
    rev: "$600K–$2M annually",
    challenge: "Disconnected marketing across LinkedIn, email, and content. No coherent narrative. Prospects can't articulate what you actually do — and neither can your marketing.",
    help: ["Clarify positioning and the transformation you provide", "Content calendar that builds a clear narrative", "Qualified leads who understand your value before the first call"],
    quote: "MOXIE's AI discovery nailed my positioning better than the $5K consultant I hired. And unlike their PDF, MOXIE executes.",
    who: "Michael Chen — Leadership Consultant, $1.2M",
  },
  {
    t: "Service-Based Founders",
    rev: "$600K–$2M annually",
    challenge: "You deliver exceptional work for clients but your own marketing is an afterthought. You're too busy serving others to build the system that serves you.",
    help: ["Practice what you preach with a strategic foundation", "Marketing runs without pulling team off client work", "Consistent pipeline without sacrificing delivery"],
    quote: "We built incredible strategies for clients but couldn't execute our own. MOXIE gave us the system we build for others — finally working for us.",
    who: "David Park — Agency Founder, $2.3M",
  },
];

const scenarios = [
  { t: "The tool chaos problem", before: "Six tools. Data scattered. Integrations break at 2 AM. You hired a VA — she quit after 6 weeks.", after: "Replaces 4–6 tools with one unified platform. No integrations needed. 18+ hours/week back." },
  { t: "The disconnected content problem", before: "You post when you remember. Email when you have something to say. No coherent narrative.", after: "20-min discovery → strategy themes → AI writes in your voice. Random posts become a brand narrative." },
  { t: "The 'what should I post?' problem", before: "It's Wednesday. Blank LinkedIn screen. Everything feels forced or generic.", after: "Strategy-aligned topics tied to your content pillars and audience pain points. Blank screen never again." },
  { t: "The ROI uncertainty problem", before: "$800/mo on tools, 20 hours/week, no idea if any of it works. Discovery calls feel random.", after: "Define YOUR success metric in discovery. Get attribution + ROI tied to real business outcomes." },
  { t: "The scale-without-chaos problem", before: "To grow $750K → $1.5M you'd need 40-hour marketing weeks. CMO costs $120K. Agencies $5K/mo.", after: "Same 2 hours/week at $600K or $1.5M. The system scales — you don't have to." },
];

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            Solutions
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-[-0.04em] mb-6 text-foreground">
            Built for the messy middle.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            You're too successful for scrappy startup hacks. Not big enough for enterprise platforms with 6-month implementations. MOXIE is built for $600K–$2M coaches, consultants, and agencies.
          </p>
        </div>
      </section>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">
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
                  <div
                    className="italic text-muted-foreground mb-2"
                    style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" }}
                  >
                    Representative scenario
                  </div>
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
      </main>
      <section className="py-[60px] bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <StatsBar />
        </div>
      </section>
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Ready when you are.</h2>
          <p className="text-muted-foreground mb-7 text-lg">Start your MOXIE Discovery in under a minute.</p>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-full font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "#ff6b6b" }}
          >
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}