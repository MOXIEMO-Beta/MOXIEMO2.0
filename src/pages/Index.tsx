import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoxieLogo } from "@/components/MoxieLogo";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowRight, Sparkles, Clock, Layers, Compass, Check, Mail, Calendar, FileText, BarChart3, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-warm">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-semibold mb-8 tracking-wide">
            <Sparkles className="h-3 w-3" /> One platform. Confident marketing.
          </div>
          <h1 className="font-display text-6xl md:text-8xl leading-[0.95] mb-6 max-w-5xl mx-auto text-foreground">
            STRATEGY FIRST.<br />
            <span className="text-accent">SIX TOOLS REPLACED.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            MOXIE creates the strategy other tools skip — then executes it through one consolidated platform built for coaches and consultants doing $600K+.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-7 rounded-lg text-base font-semibold">
              <Link to="/auth">Get started — free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-lg text-base border-border font-medium">
              <Link to="/platform">See the platform</Link>
            </Button>
          </div>

          {/* Hero visual — product card */}
          <div className="relative max-w-5xl mx-auto">
            <Card className="p-3 border-border shadow-lift bg-card overflow-hidden">
              <div className="rounded-lg bg-foreground p-10 text-background text-left">
                <div className="flex items-center gap-2 text-xs text-accent mb-4 font-semibold tracking-wider uppercase"><Sparkles className="h-3 w-3" /> AI Discovery — Section 1 of 5</div>
                <p className="font-display text-3xl md:text-4xl mb-6 leading-tight">"WHAT TRANSFORMATION DO YOU HELP CLIENTS ACHIEVE?"</p>
                <div className="text-sm text-background/60 font-light">MOXIE adapts to how you answer — coaching mode when unclear, placeholders when stuck.</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: "18+", l: "hrs back per week" },
            { v: "4-6", l: "tools eliminated" },
            { v: "45m", l: "to full strategy" },
            { v: "$93K", l: "saved annually" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-5xl md:text-6xl text-accent mb-1">{s.v}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform overview */}
      <section id="platform" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">The platform</div>
            <h2 className="font-display text-5xl md:text-6xl mb-4">EVERYTHING. ONE PLACE.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light text-lg">Strategy, content, calendar, analytics — all wired to one source of truth about your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Compass, t: "Strategy", d: "AI-built positioning, pillars, voice, and goals — alive in every workflow." },
              { icon: FileText, t: "Content", d: "Generate emails, posts, captions in your voice. Edit. Approve. Schedule." },
              { icon: Calendar, t: "Calendar", d: "Plan a quarter in minutes. See cadence, gaps, and channel mix at a glance." },
              { icon: Mail, t: "Email", d: "Sequences and broadcasts that already match your strategy and audience." },
              { icon: BarChart3, t: "Analytics", d: "What's working, what's not — explained against your strategic goals." },
              { icon: Users, t: "Audience", d: "One contact list, one truth. Behavior-aware. No more re-tagging across tools." },
            ].map((s) => (
              <Card key={s.t} className="p-7 border-border shadow-soft hover:shadow-card transition group">
                <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4 group-hover:bg-accent transition">
                  <s.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition" />
                </div>
                <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">How it works</div>
            <h2 className="font-display text-5xl md:text-6xl mb-4">SCATTERED TO STRATEGIC IN 45 MINUTES.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: Compass, t: "AI Discovery", d: "A guided conversation. MOXIE extracts your positioning, voice, audience, and goals." },
              { n: "02", icon: Layers, t: "Strategy synthesized", d: "Positioning, content pillars, voice, channel, success metrics — connected, not a PDF." },
              { n: "03", icon: Clock, t: "Execution embedded", d: "Every tool already knows your strategy. Approve, edit, publish." },
            ].map((s) => (
              <Card key={s.n} className="p-7 border-border shadow-soft hover:shadow-card transition bg-card">
                <div className="font-display text-4xl text-accent mb-4">{s.n}</div>
                <s.icon className="h-5 w-5 text-foreground mb-3" />
                <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">Why MOXIE</div>
              <h2 className="font-display text-5xl md:text-6xl mb-6 leading-[0.95]">YOU BECAME A COACH TO HELP PEOPLE. NOT TO RUN A TOOL STACK.</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed font-light text-lg">ConvertKit, Buffer, Kajabi, Calendly, Dubsado, GA. 20 hours a week. The "messy middle" deserves better than Frankenstein stacks or enterprise bloat.</p>
            </div>
            <Card className="p-8 border-border shadow-card bg-card">
              <div className="space-y-4">
                {[
                  "End fragmentation — replace tools, never integrate",
                  "Strategy embedded in execution, not a static PDF",
                  "Built for $600K-$2M operators, not startups or enterprises",
                  "Honest urgency over hype — real ROI, no exaggeration",
                ].map((t) => (
                  <div key={t} className="flex gap-3">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-12 md:p-16 bg-foreground text-background border-0 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-5xl md:text-6xl mb-4">GET YOUR IDENTITY BACK.</h2>
              <p className="text-background/70 mb-8 max-w-lg mx-auto font-light text-lg">Stop running tools. Start running a business.</p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-lg text-base font-semibold">
                <Link to="/auth">Begin discovery <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MoxieLogo />
          <p className="text-xs text-muted-foreground font-light">© 2026 MOXIE. One platform. Confident marketing.</p>
        </div>
      </footer>
    </div>
  );
}
