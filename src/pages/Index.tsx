import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoxieLogo } from "@/components/MoxieLogo";
import { ArrowRight, Sparkles, Clock, Layers, Compass, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <MoxieLogo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#why" className="hover:text-foreground">Why MOXIE</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline px-3">Sign in</Link>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-9 rounded-lg">
              <Link to="/auth">Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-medium mb-8">
            <Sparkles className="h-3 w-3" /> Your AI Chief Marketing Officer
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6 max-w-4xl mx-auto">
            Strategy first.<br />Six tools <span className="text-accent italic">replaced.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            MOXIE creates the strategy other tools skip — then executes it through one consolidated platform. Built for coaches and consultants doing $600K+ who became part-time IT administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-lg text-base">
              <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-lg text-base border-border">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          {/* Hero visual */}
          <div className="relative max-w-4xl mx-auto">
            <Card className="p-2 border-border shadow-lift bg-card">
              <div className="rounded-lg bg-foreground p-8 text-background text-left">
                <div className="flex items-center gap-2 text-xs text-accent mb-4"><Sparkles className="h-3 w-3" /> AI Discovery — Section 1 of 5</div>
                <p className="font-display text-2xl mb-6 leading-snug">"What transformation do you help clients achieve?"</p>
                <div className="text-sm text-background/60">MOXIE adapts to how you answer — coaching mode for unclear, placeholder when stuck.</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: "18+", l: "hrs back per week" },
            { v: "4-6", l: "tools eliminated" },
            { v: "45m", l: "to full strategy" },
            { v: "$93K", l: "saved annually" },
          ].map((s) => (
            <div key={s.l}><div className="font-display text-4xl md:text-5xl text-accent mb-1">{s.v}</div><div className="text-sm text-muted-foreground">{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-wider text-accent mb-3 font-medium">How it works</div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">From scattered to strategic in 45 minutes.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: Compass, t: "AI Discovery", d: "A 30-45 minute guided conversation. MOXIE extracts your positioning, voice, audience, and goals." },
              { n: "02", icon: Layers, t: "Strategy synthesized", d: "Your foundation appears: positioning, content pillars, voice, channel, success metrics — all connected." },
              { n: "03", icon: Clock, t: "Execution embedded", d: "Email, social, content — every tool already knows your strategy. Approve, edit, publish." },
            ].map((s) => (
              <Card key={s.n} className="p-7 border-border shadow-soft hover:shadow-card transition">
                <div className="font-display text-3xl text-accent mb-4">{s.n}</div>
                <s.icon className="h-5 w-5 text-foreground mb-3" />
                <h3 className="font-medium text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-24 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-accent mb-3 font-medium">The problem</div>
              <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">You became a coach to help people. Now you're a part-time IT administrator.</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">ConvertKit, Buffer, Kajabi, Calendly, Dubsado, GA. 20 hours a week. Disconnected content. No strategic coherence. The "messy middle" deserves better than Frankenstein stacks or enterprise bloat.</p>
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
                    <span className="text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-12 md:p-16 bg-foreground text-background border-0 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl mb-4">Get your identity back.</h2>
              <p className="text-background/70 mb-8 max-w-lg mx-auto">Stop running tools. Start running a business.</p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-lg text-base">
                <Link to="/auth">Begin discovery <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MoxieLogo />
          <p className="text-xs text-muted-foreground">© 2026 MOXIE. Strategy first. Execution embedded.</p>
        </div>
      </footer>
    </div>
  );
}
