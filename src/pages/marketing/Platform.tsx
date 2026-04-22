import { Card } from "@/components/ui/card";
import { Compass, FileText, Calendar, Mail, BarChart3, Megaphone, ArrowRight, Check } from "lucide-react";
import { MarketingPage } from "./MarketingPage";

const stages = [
  {
    n: "01",
    label: "Strategic foundation",
    time: "30 minutes",
    title: "AI Discovery conversation",
    body: "MOXIE's AI interviews you about who you serve, the transformation you provide, your unique positioning, and your voice. The strategic work most tools skip — done in half an hour.",
    outputs: ["Strategic positioning statement", "Brand voice guidelines", "Audience pain map", "Content theme clusters", "Channel prioritization", "Success metrics dashboard"],
  },
  {
    n: "02",
    label: "Living strategy system",
    time: "Always on",
    title: "Strategy embedded in every tool",
    body: "Your strategy isn't a PDF in a folder. It's wired into the email tool, the social tool, the content creator, the analytics — guiding every output automatically.",
    outputs: ["Email subject lines align to positioning", "Social posts build a narrative", "Content sounds like you", "Analytics tracks YOUR success metric"],
  },
  {
    n: "03",
    label: "Execution without exhaustion",
    time: "2 hours / week",
    title: "Marketing that runs while you coach",
    body: "Monday morning: review, approve, publish. Friday: check what worked. The other 18 hours go back to clients and growth.",
    outputs: ["Review week's content (15 min)", "Approve & edit (30 min)", "Auto-publish across channels", "Friday analytics check (15 min)"],
  },
];

const features = [
  { icon: Compass, t: "AI Strategic Discovery", d: "30-minute conversation extracts your positioning, audience, and voice. The foundation everything else builds on — no consultant fees, no CMO hire." },
  { icon: Calendar, t: "Content Calendar & Themes", d: "90-day roadmap with quarterly themes and weekly topics, all aligned to your transformation journey. Never 'what should I post today?' again." },
  { icon: Mail, t: "Email Marketing", d: "Welcome sequences, newsletters, broadcasts, and conversion flows that match your voice. Replaces ConvertKit, Mailchimp, and the rest." },
  { icon: Megaphone, t: "Social Publishing", d: "LinkedIn, Instagram, Facebook publishing with content that builds your narrative. Replaces Buffer, Later, Hootsuite." },
  { icon: FileText, t: "Content Creation", d: "Blog posts, articles, lead magnets, and video scripts — written in your voice, aligned to your strategy, ready to publish." },
  { icon: BarChart3, t: "Strategic Analytics", d: "Tracks YOUR success metric (e.g. 'discovery calls per week') with attribution and recommendations — not vanity metrics." },
];

const security = ["SOC 2 Type II certified", "End-to-end encryption", "GDPR compliant", "Your data never trains AI", "Daily backups", "99.9% uptime SLA"];

export default function Platform() {
  return (
    <MarketingPage
      eyebrow="The platform"
      title="The only platform that starts with strategy."
      subtitle="MOXIE isn't better execution tools. We're the only marketing platform that creates your strategic foundation first — then embeds it into every tool you use."
    >
      <div className="space-y-24">
        {/* Stages */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Strategy → Execution → Freedom</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">Three stages. One platform. Built to give you back 18 hours a week.</p>
          </div>
          <div className="space-y-6">
            {stages.map((s) => (
              <Card key={s.n} className="p-8 md:p-12 border-border shadow-soft">
                <div className="grid md:grid-cols-[200px_1fr] gap-8">
                  <div>
                    <div className="font-display text-6xl text-accent leading-none mb-3">{s.n}</div>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-foreground">{s.label}</div>
                    <div className="text-sm text-muted-foreground mt-1 font-light">{s.time}</div>
                  </div>
                  <div>
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
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Every feature. One platform. Your strategy.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">Six tools, deeply unified — not six tabs duct-taped together.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((m) => (
              <Card key={m.t} className="p-7 border-border shadow-soft hover:shadow-card transition group">
                <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4 group-hover:bg-accent transition">
                  <m.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition" />
                </div>
                <h3 className="font-bold text-lg mb-2">{m.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{m.d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Migration */}
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-3">Migration</div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Seamless migration from your current tools.</h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-6">We handle the heavy lifting — subscribers, content calendars, automations, social accounts, analytics history. White-glove migration is included on Enterprise.</p>
            <ul className="space-y-2 text-sm">
              {["Week 1 — Discovery + strategy", "Week 2 — Data migration + setup", "Week 3 — Content generation begins", "Week 4 — Full switch to MOXIE"].map((w) => (
                <li key={w} className="flex gap-2"><ArrowRight className="h-4 w-4 text-accent mt-0.5" />{w}</li>
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