import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { MarketingPage } from "./MarketingPage";
import heroFunctions from "@/assets/platform-hero-functions.png";
import shotDiscovery from "@/assets/platform-social.png";
import shotStrategy from "@/assets/platform-strategy.png";
import shotPlanner from "@/assets/platform-planner.png";

const stages = [
  {
    n: "01",
    label: "Strategic foundation",
    time: "30 minutes",
    title: "MOXIE Discovery conversation",
    body: "MOXIE's AI interviews you about who you serve, the transformation you provide, your unique positioning, and your voice. The strategic work most tools skip — done in half an hour.",
    outputs: ["Strategic positioning statement", "Brand voice guidelines", "Audience pain map", "Content theme clusters", "Channel prioritization", "Success metrics dashboard"],
    img: shotDiscovery,
    alt: "MOXIE Discovery conversation",
  },
  {
    n: "02",
    label: "Living strategy system",
    time: "Always on",
    title: "Strategy embedded in every tool",
    body: "Your strategy isn't a PDF in a folder. It's wired into the email tool, the social tool, the content creator, the analytics — guiding every output automatically.",
    outputs: ["Email subject lines align to positioning", "Social posts build a narrative", "Content sounds like you", "Analytics tracks YOUR success metric"],
    img: shotStrategy,
    alt: "MOXIE Strategy positioning",
  },
  {
    n: "03",
    label: "Execution without exhaustion",
    time: "2 hours / week",
    title: "Marketing that runs while you coach",
    body: "Monday morning: review, approve, publish. Friday: check what worked. The other 18 hours go back to clients and growth.",
    outputs: ["Review week's content (15 min)", "Approve & edit (30 min)", "Auto-publish across channels", "Friday analytics check (15 min)"],
    img: shotPlanner,
    alt: "MOXIE Marketing Planner",
  },
];

const stats = [
  { v: "18+", l: "hrs back per week" },
  { v: "4–6", l: "tools eliminated" },
  { v: "20 min", l: "to full strategy" },
  { v: "$93K", l: "saved annually" },
];

const security = ["SOC 2 Type II certified", "End-to-end encryption", "GDPR compliant", "Your data never trains AI", "Daily backups", "99.9% uptime SLA"];
const weeks = [
  { n: "Week 1", t: "Discovery + strategy" },
  { n: "Week 2", t: "Data migration + setup" },
  { n: "Week 3", t: "Content generation begins" },
  { n: "Week 4", t: "Full switch to MOXIE" },
];

export default function Platform() {
  return (
    <MarketingPage
      eyebrow="The platform"
      title="The only platform that starts with strategy."
      subtitle="MOXIE isn't better execution tools. We're the only marketing platform that creates your strategic foundation first — then embeds it into every tool you use."
    >
      <div className="space-y-24">
        {/* SECTION 1 — Hero image + CTA */}
        <section className="-mt-8">
          <div className="w-[90%] mx-auto">
            <img
              src={heroFunctions}
              alt="MOXIE — your AI marketing co-pilot with six core functions"
              className="w-full h-auto rounded-2xl"
              style={{ borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
              loading="lazy"
            />
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-full font-semibold">
              <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* SECTION 2 — Strategy → Execution → Freedom */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Strategy <span className="text-accent">→</span> Execution <span className="text-accent">→</span>{" "}
              <span className="relative inline-block">
                Freedom
                <span aria-hidden className="freedom-underline" />
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">Three stages. One platform. Built to give you back 18 hours a week.</p>
          </div>

          {/* SECTION 3 — Numbered cards w/ screenshots */}
          <div className="space-y-8">
            {stages.map((s) => (
              <Card key={s.n} className="p-8 md:p-12 border-border shadow-soft">
                <div className="grid md:grid-cols-[55%_45%] gap-10 items-center">
                  <div className="order-2 md:order-1">
                    <div className="font-display font-bold text-accent leading-none mb-3" style={{ fontSize: 80 }}>{s.n}</div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-foreground">{s.label}</div>
                    <div className="text-sm text-muted-foreground mt-1 mb-5 font-light">{s.time}</div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-light mb-6">{s.body}</p>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      {s.outputs.map((o) => (
                        <li key={o} className="flex gap-2 text-sm">
                          <Check className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="order-1 md:order-2 overflow-hidden bg-card border border-border" style={{ borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
                    <img src={s.img} alt={s.alt} className="w-full h-auto block" loading="lazy" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 4 — Stats bar */}
        <section className="bg-[#f8f8f8] border-y border-border -mx-6 px-6" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border">
              {stats.map((s) => (
                <div key={s.l} className="text-center md:px-6">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-1.5">{s.v}</div>
                  <div className="text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5 — Migration + Security */}
        <section className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-3">Migration</div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Seamless migration from your current tools.</h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-8">We handle the heavy lifting — subscribers, content calendars, automations, social accounts, analytics history. White-glove migration is included on Enterprise.</p>

            {/* Step timeline */}
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                {weeks.map((w, i) => (
                  <div key={w.n} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-4 rounded-full bg-accent ring-4 ring-accent-soft" />
                      <div className="text-[11px] font-bold uppercase tracking-wider text-foreground mt-2 whitespace-nowrap">{w.n}</div>
                    </div>
                    {i < weeks.length - 1 && <div className="flex-1 h-0.5 bg-accent/40 mx-2" />}
                  </div>
                ))}
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              {weeks.map((w) => (
                <li key={w.n} className="flex gap-2"><ArrowRight className="h-4 w-4 text-accent mt-0.5" />{w.n} — {w.t}</li>
              ))}
            </ul>
          </div>
          <Card className="p-8 border-border shadow-card bg-muted/40">
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-4">Enterprise-grade security</div>
            <ul className="space-y-3">
              {security.map((s) => (
                <li key={s} className="flex gap-3 text-sm font-medium"><Check className="h-4 w-4 text-accent mt-0.5" />{s}</li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </MarketingPage>
  );
}
