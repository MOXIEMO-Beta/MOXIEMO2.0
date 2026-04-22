import { Card } from "@/components/ui/card";
import { MarketingPage } from "./MarketingPage";

const stories = [
  {
    name: "Sarah Thompson",
    role: "Executive Coach",
    rev: "$650K",
    before: "20+ hrs/week across 6 tools. Exhausted system administrator.",
    quote: "MOXIE didn't just save me time. It gave me my identity back. I'm a strategist again — coaching high-ticket clients instead of debugging integrations. The AI discovery understood my positioning better than I did.",
    metrics: ["18 hrs/week freed", "6 tools eliminated", "$93K saved annually", "Discovery calls up 40%"],
  },
  {
    name: "Michael Chen",
    role: "Leadership Consultant",
    rev: "$1.2M",
    before: "Disconnected content. Hired a $5K consultant. Got a 40-page PDF that sat in a folder.",
    quote: "MOXIE's 30-min discovery nailed my positioning better than the $5K consultant. Unlike their PDF, MOXIE's strategy is embedded in every tool. Leads come in already understanding my value.",
    metrics: ["Content time: 90 → 30 min", "Sales cycle −2 weeks", "Lead quality way up", "Pipeline reviews 5★"],
  },
  {
    name: "Jennifer Martinez",
    role: "Business Coach",
    rev: "$750K → $1.5M",
    before: "Wanted to scale to $1.5M. Marketing already at 20 hrs/week. CMO unaffordable.",
    quote: "MOXIE solved my scaling problem. Same 2 hours/week, 3x the content output. The AI learned what works and generates more of it. Pipeline filled without working weekends.",
    metrics: ["3x content output", "Same 2 hrs/week", "2.5x lead volume", "On track for $1.5M"],
  },
];

const spotlights = [
  { name: "David Park", role: "Agency Founder", rev: "$2.3M", q: "We build strategies for clients but couldn't execute our own. MOXIE gave us the system we sell — for ourselves." },
  { name: "Lisa Wang", role: "Career Coach", rev: "$480K → $850K", q: "MOXIE helped me clarify positioning I'd struggled with for 3 years. Revenue up 77% in 12 months." },
  { name: "Robert Johnson", role: "Sales Consultant", rev: "$1.1M", q: "MOXIE's analytics show which content drives calls. I optimize what works, cut what doesn't. Lead cost down 60%." },
  { name: "Maria Garcia", role: "Leadership Coach", rev: "$680K", q: "Stopped working weekends. MOXIE runs whether I remember or not. Work-life balance and better results." },
  { name: "Tom Anderson", role: "Strategy Consultant", rev: "$920K", q: "The AI writes in my voice better than the writers I hired. Saves $3K/month and sounds authentic." },
  { name: "Emily Chen", role: "Executive Coach", rev: "$1.4M", q: "I was skeptical AI could capture my voice. MOXIE proved me wrong. Every post sounds like me." },
];

const stats = [
  { v: "450+", l: "Founders freed from tool chaos" },
  { v: "8,100+", l: "Hours reclaimed weekly" },
  { v: "$4.2M", l: "Annual savings (opportunity cost)" },
  { v: "1,800+", l: "Tools eliminated" },
];

export default function Community() {
  return (
    <MarketingPage
      eyebrow="Community"
      title="You're not alone in this transformation."
      subtitle="Join coaching and consulting founders who've eliminated tool chaos and reclaimed their strategic identity."
    >
      <div className="space-y-24">
        {/* Featured stories */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">Real founders. Real transformation.</h2>
          <div className="space-y-6">
            {stories.map((s) => (
              <Card key={s.name} className="p-8 md:p-12 border-border shadow-soft">
                <div className="grid md:grid-cols-[260px_1fr] gap-8">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">Revenue {s.rev}</div>
                    <h3 className="text-2xl font-bold tracking-tight">{s.name}</h3>
                    <p className="text-sm text-muted-foreground font-light mb-4">{s.role}</p>
                    <p className="text-sm border-l-2 border-border pl-3 text-muted-foreground font-light leading-relaxed"><span className="font-semibold text-foreground">Before:</span> {s.before}</p>
                  </div>
                  <div>
                    <blockquote className="text-lg md:text-xl font-light leading-relaxed mb-6 italic">"{s.quote}"</blockquote>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {s.metrics.map((m) => (
                        <div key={m} className="text-sm font-medium px-3 py-2 rounded-lg bg-accent-soft text-foreground">{m}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Spotlights */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-3">This month's featured founders.</h2>
          <p className="text-center text-muted-foreground text-lg font-light mb-12">Six more operators who got their CEO life back.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spotlights.map((s) => (
              <Card key={s.name} className="p-6 border-border shadow-soft">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground font-light">{s.role}</p>
                  </div>
                  <div className="text-xs font-bold text-accent">{s.rev}</div>
                </div>
                <p className="text-sm font-light italic text-muted-foreground leading-relaxed">"{s.q}"</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Movement stats */}
        <section className="text-center bg-muted/40 -mx-6 px-6 md:-mx-12 md:px-12 py-16 rounded-3xl border border-border">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Be part of ending the tool fragmentation era.</h2>
          <p className="text-muted-foreground font-light max-w-2xl mx-auto mb-12">Every founder who eliminates tool chaos proves consolidation works. You're not just using software — you're part of a movement.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl md:text-6xl text-accent mb-2">{s.v}</div>
                <div className="text-xs uppercase tracking-[0.15em] font-semibold text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}