import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import kareeHeadshot from "@/assets/karee-headshot.png";
import kareeBranson from "@/assets/karee-branson.png";
import kareePersonal from "@/assets/karee-personal.png";
import kareeTable from "@/assets/karee-table.png";
import kareeQuote from "@/assets/karee-quote.png";

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

const credentials = ["Brand Strategist", "JD/MBA", "Goldman Sachs 10KSB Scholar", "HBJ 40 Under 40"];

const photoShadow = { boxShadow: "0 8px 40px rgba(0,0,0,0.10)" };

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 order-2 md:order-1">
            <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
              About
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-[-0.04em] mb-6 text-foreground">
              Ending the tool fragmentation era.
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl leading-relaxed font-light">
              MOXIEMO exists because brilliant entrepreneurs deserve to be strategic leaders — not exhausted system administrators.
            </p>
          </div>
          <div className="md:col-span-2 order-1 md:order-2">
            <div className="rounded-2xl overflow-hidden border-l-4 border-accent" style={photoShadow}>
              <img src={kareeHeadshot} alt="Karee Laing, Founder of MOXIEMO" className="w-full h-auto object-cover" loading="eager" />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center md:text-left">
              Karee Laing — Founder, Brand Strategist, 4x Entrepreneur
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full">
        {/* FOUNDER STORY */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div
                className="rounded-2xl overflow-hidden bg-muted"
                style={{ ...photoShadow, borderRadius: "16px" }}
              >
                <img
                  src={kareePersonal}
                  alt="Karee Laing"
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
              <div style={{ marginTop: "12px" }}>
                <div className="text-foreground" style={{ fontSize: "15px", fontWeight: 400 }}>— Karee Laing</div>
                <div className="text-muted-foreground" style={{ fontSize: "14px", marginTop: "2px" }}>Founder, MOXIEMO</div>
                <div
                  className="text-accent"
                  style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "10px" }}
                >
                  {credentials.map((c, i) => (
                    <span key={c}>
                      {i > 0 && <span className="text-muted-foreground"> • </span>}
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div
                className="text-accent font-bold mb-3 uppercase"
                style={{ fontSize: "13px", letterSpacing: "2px" }}
              >
                Why MOXIEMO exists
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">This is personal.</h2>
              <div className="space-y-5 text-muted-foreground font-light leading-relaxed">
                <p>I've lived the Monday night tool panic. You know the one where it's 9 PM and you need to prep and schedule the Tuesday morning newsletter, but first you have to pull the list from your website, check Analytics for what performed best, find that graphic in Canva, copy the caption from Claude, and format it all while updating the CTA. Two hours later, you've sent one email.</p>
                <p>I've spent 14 years in marketing. I should know better. But I was still drowning in tools, building Zapier automations at 11 PM, wondering why marketing felt like IT work instead of strategy. If I was struggling, what about the founders I work with? The ones building real businesses, whether it's coaching practices, consulting firms, or service companies who never signed up to become software administrators.</p>
                <p>Here's what I kept seeing: Brilliant founders spending 20+ hours a week on marketing operations; from copying content between platforms, troubleshooting integrations, managing subscriptions and zero hours on marketing strategy. No time to think about positioning, building a consistent narrative, or creating content that actually moves the needle. Just managing systems.</p>
                <p className="text-foreground font-medium">That's the real problem. It's not too many tools, and the issue is that every tool jumps straight to execution without fully asking the strategic questions: Who are you? Who do you serve? What makes you different? What's your actual narrative? You can't build a business that lasts on random posts and duct-taped automations.</p>
                <p>So, I built MOXIEMO — your AI CMO. Not another tool to manage, but your actual Chief Marketing Officer. The one who asks the strategic questions, creates your foundation, then executes it consistently so you can get back to building the business you actually started. Because you didn't become a founder to be a system administrator. You became one to build a legacy.</p>
                <p className="text-foreground font-medium">MOXIEMO gives you the marketing brain to do it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PERSONAL SECTION */}
        <section className="bg-[#f8f8f8]">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14 leading-[1.1]">
              Built from experience.<br />Not just ambition.
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5]" style={photoShadow}>
                  <img src={kareeTable} alt="Karee at The Table dinner" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">The Table — curated dinners for women founders in Houston</p>
              </div>
              <div>
                <div className="rounded-2xl overflow-hidden aspect-[4/5]" style={photoShadow}>
                  <img src={kareeQuote} alt="Karee Laing quote" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">15+ years. Hundreds of founders. One recurring problem.</p>
              </div>
              <div className="rounded-2xl bg-[#101116] text-white p-8 md:p-10 flex flex-col justify-center aspect-[4/5]" style={photoShadow}>
                <div className="font-display text-6xl text-accent leading-none mb-4">"</div>
                <p className="text-2xl md:text-3xl italic font-light leading-snug mb-6">
                  You're not missing knowledge. You're missing a system.
                </p>
                <p className="text-sm text-white/70 font-medium">That's why MOXIEMO exists.</p>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="bg-foreground text-background px-6 md:px-12 py-16 rounded-3xl">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-4">Our mission</div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">We're ending the tool fragmentation era — turning exhausted operators into strategic marketers who actually grow revenue.</h2>
              <p className="text-background/70 font-light leading-relaxed">In five years, we want "tool fragmentation" to feel as outdated as fax machines. The default answer should be: <em>just use MOXIEMO.</em></p>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="max-w-6xl mx-auto px-6 py-12 pb-24">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">The rules we never break.</h2>
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

        {/* VISION */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">Where we're going.</h2>
          <p className="text-center italic text-accent font-medium mb-12">
            We measure success in hours returned and tools eliminated — not vanity metrics.
          </p>
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

      </main>

      {/* FINAL CTA */}
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Ready when you are.</h2>
          <p className="text-muted-foreground mb-7 text-lg">Start your MOXIEMO Discovery in under a minute.</p>
          <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-12 px-8 rounded-full font-semibold">
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
