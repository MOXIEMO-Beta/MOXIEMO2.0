import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StatsBar } from "@/components/StatsBar";
import { ArrowRight, Check, MessageSquare, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WaitlistForm } from "@/components/WaitlistForm";
import { MoxiemoDemoShowcase } from "@/components/MoxiemoDemoShowcase";
import plannerImg from "@/assets/home-planner-new.png";
import contentImg from "@/assets/home-execution.png";
import strategyImg from "@/assets/home-strategy-foundation.png";
import discoveryImg from "@/assets/home-discovery.png";
import strategyThemesImg from "@/assets/home-strategy-themes.png";
import executionImg from "@/assets/home-execution.png";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
      {children}
    </div>
  );
}

function ProductShot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-card border border-border ${className}`}
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [interceptingInvite, setInterceptingInvite] = useState(false);

  useEffect(() => {
    const rawHash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!rawHash) return;
    const params = new URLSearchParams(rawHash);
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken && !type) return;

    setInterceptingInvite(true);
    (async () => {
      try {
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch (e) {
        console.error("Failed to set session from invite hash", e);
      } finally {
        // Hand off to the callback page (it handles password creation + plan)
        const target = `/auth/callback#${rawHash}`;
        window.history.replaceState(null, "", "/");
        navigate(target, { replace: true });
      }
    })();
  }, [navigate]);

  if (interceptingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Verifying your invitation…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* SECTION 1 - HERO */}
      <section className="bg-background pt-28 md:pt-32 pb-16">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <SectionLabel>Your AI CMO is ready</SectionLabel>
          <h1 className="max-w-[1100px] mx-auto text-5xl md:text-7xl lg:text-[88px] font-bold leading-[1.05] tracking-[-0.035em] mb-8 text-foreground">
            Your brand is not your go-to-market.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #ff6b6b, #ff9a3c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MOXIEMO builds both.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto mb-10 leading-relaxed">
            MOXIEMO is your AI Chief Marketing Officer, built for founders at $250K+ who are ready to stop winging it. Build your marketing foundation, plan your content, and publish with strategy behind every post.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-7 rounded-full text-base font-semibold"
            >
              <Link to="/founding">Join as a Founding Member <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 px-6 rounded-full text-base font-semibold">
              <Link to="/auth">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/80">Founding members get free access, forever. No credit card required.</p>
        </div>

        <div className="w-full max-w-full md:max-w-[85%] mx-auto px-4 sm:px-6 mt-16 overflow-hidden">
          <MoxiemoDemoShowcase />
        </div>
      </section>

      {/* SECTION 2 - STATS BAR */}
      <section className="py-[60px] bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <StatsBar />
        </div>
      </section>

      {/* SECTION 3 - HOW IT WORKS */}
      <section className="py-[70px] bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.02]">
              Scattered to strategic
              <br />
              <span className="text-gradient-coral">in 20 minutes.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: MessageSquare, t: "MOXIEMO Discovery", d: "A guided 20-minute conversation extracts your positioning, voice, audience, and goals.", img: discoveryImg, alt: "Discovery chat" },
              { n: "02", icon: Target, t: "Strategy synthesized", d: "Positioning, pillars, voice, channels, and metrics. Connected to everything, not sitting in a doc you never open.", img: strategyThemesImg, alt: "Quarterly content themes" },
              { n: "03", icon: Zap, t: "Execution embedded", d: "Every tool already knows your strategy. Generate content, plan campaigns, send emails. Approve, edit, publish.", img: executionImg, alt: "Social create view" },
            ].map((s) => (
              <Card key={s.n} className="p-7 border-border rounded-2xl bg-card hover:shadow-card transition flex flex-col">
                <div className="text-sm font-semibold text-accent mb-4">{s.n}</div>
                <s.icon className="h-5 w-5 text-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2 tracking-tight">{s.t}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">{s.d}</p>
                <div className="mt-auto rounded-xl overflow-hidden border border-border" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
                  <img src={s.img} alt={s.alt} className="w-full h-40 object-cover object-top" loading="lazy" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - PLATFORM FEATURE SHOWCASE */}
      <section className="py-[100px] bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <SectionLabel>The platform</SectionLabel>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] mb-6 leading-[1.02]">
              Everything you need.
              <br />
              <span className="text-muted-foreground">One place.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
              Strategy, content, calendar, analytics. All wired to one source of truth about your business.
            </p>
          </div>

          {/* Row 1 - Strategy */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <ProductShot src={strategyImg} alt="MOXIEMO Strategy positioning statement" />
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-accent mb-4">Strategy</div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] mb-5 leading-[1.1]">
                Your foundation. Built in minutes.
              </h3>
              <p className="text-[17px] md:text-[18px] text-muted-foreground leading-[1.7] mb-6">
                MOXIEMO runs a guided discovery, then synthesizes your complete marketing foundation: positioning, voice, content pillars, and channel plan. It scores your strategy and tells you exactly where to go deeper.
              </p>
              <div className="inline-flex items-baseline gap-2 px-4 py-2.5 rounded-full bg-accent-soft">
                <span className="text-2xl font-bold text-accent">100/100</span>
                <span className="text-sm text-foreground/70">strategy strength, out of the box</span>
              </div>
            </div>
          </div>

          {/* Row 2 - Content */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <div className="md:order-1 order-2">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-accent mb-4">Content</div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] mb-5 leading-[1.1]">
                Content that sounds like you. Every time.
              </h3>
              <p className="text-[17px] md:text-[18px] text-muted-foreground leading-[1.7]">
                Generate LinkedIn posts, newsletters, captions, and long-form content anchored to your strategy. Pick a content pillar, describe your idea, and MOXIEMO writes in your voice. Not generic AI output. Yours.
              </p>
            </div>
            <div className="md:order-2 order-1">
              <ProductShot src={contentImg} alt="MOXIEMO Content creator" />
            </div>
          </div>

          {/* Row 3 - Marketing Planner */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ProductShot src={plannerImg} alt="MOXIEMO Marketing Planner" />
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-accent mb-4">Marketing Planner</div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] mb-5 leading-[1.1]">
                See your whole quarter at a glance.
              </h3>
              <p className="text-[17px] md:text-[18px] text-muted-foreground leading-[1.7]">
                Build campaigns across LinkedIn, email, Instagram, and Facebook. MOXIEMO populates your calendar with content slots, flags gaps, and keeps everything tied back to your strategy goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - WHY MOXIEMO */}
      <section className="py-[100px] bg-[#f8f8f8] border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="max-w-[480px]">
              <SectionLabel>Why MOXIEMO</SectionLabel>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.035em] mb-6 leading-[1.05] text-foreground">
                You became a founder to build something. Not to run a tool stack.
              </h2>
              <p className="text-[17px] md:text-[18px] text-muted-foreground leading-[1.7]">
                ConvertKit. Buffer. Kajabi. Calendly. Dubsado. GA. 20 hours a week on tools that don't talk to each other. The "messy middle" deserves better than Frankenstein stacks or enterprise bloat.
              </p>
            </div>
            <Card className="p-8 md:p-10 border-border rounded-2xl bg-card" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
              <div className="space-y-5">
                {[
                  "End fragmentation. Replace tools, not just integrate them.",
                  "Strategy embedded in execution, not sitting in a static PDF.",
                  "Built for $250K+ founders, not startups or enterprises.",
                  "Honest urgency over hype. Real ROI, no exaggeration.",
                  "Your voice in every output. Not generic AI slop.",
                ].map((t) => (
                  <div key={t} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <span className="text-[15px] md:text-base leading-relaxed">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 6 - FOUNDING MEMBER CTA */}
      <section className="py-[100px] bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-accent mb-6 px-4 py-2 rounded-full bg-accent/15">
            Founding members
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.035em] mb-5 leading-[1.05]">
            Be a MOXIEMO Founding Member.
          </h2>
          <p className="text-lg md:text-xl text-background/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the beta and lock in founding member access, free forever. We are personally scheduling a 1:1 kickoff call with every founding member before granting access.
          </p>

          <WaitlistForm />
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter />
    </div>
  );
}