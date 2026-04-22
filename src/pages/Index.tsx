import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoxieLogo } from "@/components/MoxieLogo";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowRight, Clock, Layers, Compass, Check, Mail, Calendar, FileText, BarChart3, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative">
          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold leading-[1.05] tracking-[-0.035em] mb-8 max-w-5xl mx-auto text-foreground">
            Outpace everyone with the <span className="text-gradient-coral">best AI marketing platform</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Exponential execution that scales your business impact and replaces the six tools you're juggling today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-12 px-7 rounded-full text-base font-semibold">
              <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/80">No credit card needed ✦ Unlimited time on Free plan</p>

          {/* Hero visual — product card */}
          <div className="relative max-w-5xl mx-auto mt-16">
            <Card className="p-2 border-border shadow-lift bg-card overflow-hidden rounded-2xl">
              <div className="rounded-xl bg-foreground p-10 md:p-14 text-background text-left">
                <div className="text-xs text-accent mb-5 font-semibold tracking-wider uppercase">AI Discovery — Section 1 of 5</div>
                <p className="text-2xl md:text-3xl font-semibold mb-6 leading-tight tracking-tight">"What transformation do you help clients achieve?"</p>
                <div className="text-sm text-background/60">MOXIE adapts as you answer — coaching when unclear, placeholders when stuck.</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: "18+", l: "hrs back per week" },
            { v: "4–6", l: "tools eliminated" },
            { v: "45m", l: "to full strategy" },
            { v: "$93K", l: "saved annually" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-1">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform overview */}
      <section id="platform" className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">The platform</div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] mb-6 leading-[1.02]">Everything you need. <span className="text-muted-foreground">One place.</span></h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">Strategy, content, calendar, analytics — all wired to one source of truth about your business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Compass, t: "Strategy", d: "AI-built positioning, pillars, voice, and goals — alive in every workflow." },
              { icon: FileText, t: "Content", d: "Generate emails, posts, captions in your voice. Edit. Approve. Schedule." },
              { icon: Calendar, t: "Calendar", d: "Plan a quarter in minutes. See cadence, gaps, and channel mix at a glance." },
              { icon: Mail, t: "Email", d: "Sequences and broadcasts that already match your strategy and audience." },
              { icon: BarChart3, t: "Analytics", d: "What's working, what's not — explained against your strategic goals." },
              { icon: Users, t: "Audience", d: "One contact list, one truth. Behavior-aware. No more re-tagging across tools." },
            ].map((s) => (
              <Card key={s.t} className="p-7 border-border rounded-2xl hover:shadow-card transition group">
                <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center mb-5 group-hover:bg-accent transition">
                  <s.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition" />
                </div>
                <h3 className="font-semibold text-lg mb-2 tracking-tight">{s.t}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-28 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">How it works</div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.02]">Scattered to strategic <span className="text-gradient-coral">in 45 minutes.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "01", icon: Compass, t: "AI Discovery", d: "A guided conversation extracts your positioning, voice, audience, and goals." },
              { n: "02", icon: Layers, t: "Strategy synthesized", d: "Positioning, pillars, voice, channels, metrics — connected, not a PDF." },
              { n: "03", icon: Clock, t: "Execution embedded", d: "Every tool already knows your strategy. Approve, edit, publish." },
            ].map((s) => (
              <Card key={s.n} className="p-7 border-border rounded-2xl bg-card hover:shadow-card transition">
                <div className="text-sm font-semibold text-accent mb-4">{s.n}</div>
                <s.icon className="h-5 w-5 text-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2 tracking-tight">{s.t}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">Why MOXIE</div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] mb-6 leading-[1.02]">You became a coach to help people. <span className="text-muted-foreground">Not to run a tool stack.</span></h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">ConvertKit, Buffer, Kajabi, Calendly, Dubsado, GA. 20 hours a week. The "messy middle" deserves better than Frankenstein stacks or enterprise bloat.</p>
            </div>
            <Card className="p-8 border-border rounded-2xl bg-card">
              <div className="space-y-4">
                {[
                  "End fragmentation — replace tools, never integrate",
                  "Strategy embedded in execution, not a static PDF",
                  "Built for $600K-$2M operators, not startups or enterprises",
                  "Honest urgency over hype — real ROI, no exaggeration",
                ].map((t) => (
                  <div key={t} className="flex gap-3">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-[15px]">{t}</span>
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
          <Card className="p-12 md:p-20 bg-foreground text-background border-0 text-center relative overflow-hidden rounded-3xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Get your identity back.</h2>
              <p className="text-background/70 mb-8 max-w-lg mx-auto text-lg">Stop running tools. Start running a business.</p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-full text-base font-semibold">
                <Link to="/auth">Begin discovery <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MoxieLogo />
          <p className="text-xs text-muted-foreground">© 2026 MOXIE. One platform. Confident marketing.</p>
        </div>
      </footer>
    </div>
  );
}
