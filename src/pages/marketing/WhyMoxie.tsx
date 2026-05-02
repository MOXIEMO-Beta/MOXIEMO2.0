import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";
import { MarketingPage } from "./MarketingPage";
import { StatsBar } from "@/components/StatsBar";

const failed = [
  { t: "Hired a VA", tried: "Brought on a virtual assistant to manage tools, post content, coordinate marketing.", happened: "Week 1–2 training on 6 platforms. Week 3–6 they seem to be getting it. Week 7–8 they quit. You're back to managing everything — plus you're behind on campaigns.", why: "The problem wasn't capacity. It was system complexity. Adding a person to chaos doesn't eliminate chaos." },
  { t: "Built Zapier automations", tried: "Spent 15–20 hours wiring workflows to connect your 6 tools.", happened: "Felt brilliant when it worked. Week 3 one stopped firing. Week 5 another broke silently. Now you're debugging webhooks on Sunday nights.", why: "Integration layers add complexity. When tools update, integrations break. You're maintaining infrastructure, not marketing." },
  { t: "Looked at HubSpot", tried: "Evaluated enterprise marketing automation.", happened: "Loved the demo. Saw the price ($1,200–3,600/mo). Saw the implementation (3–6 months). Saw the 1.9/5 reviews. Walked away.", why: "Built for enterprises with marketing teams and IT departments. Not for lean coaching businesses." },
  { t: "'All-in-one' platforms", tried: "Consolidated to Kajabi or Teachable.", happened: "Still needed ConvertKit for advanced email. Calendly for scheduling. Later for social. Dubsado for contracts. Same number of tools, just rearranged.", why: "All-in-one platforms do one thing well and need supplements for everything else." },
  { t: "Generic AI tools", tried: "ChatGPT, Claude, Jasper to write content faster.", happened: "Drafts came out generic. Saved 30 minutes writing, added complexity everywhere else. Still moved content across 6 platforms.", why: "Generic AI doesn't know YOUR business, voice, or strategy. And it doesn't solve fragmentation." },
];

const differences = [
  { t: "We start with strategy", them: "Jump straight to execution: 'What do you want to post?'", us: "30-minute strategic discovery first. Who you serve, what transformation you provide, your voice — before any content gets written." },
  { t: "Strategy is a living system", them: "Consultant gives you a strategy PDF. You reference it manually until it goes stale.", us: "Strategy embedded IN every tool. You never 'forget the strategy' — the system enforces it automatically." },
  { t: "True consolidation", them: "Integration platforms connect fragmented tools. 'All-in-ones' still need 3–4 supplements.", us: "Replaces tools entirely. No integrations because everything is native. One login, one source of truth." },
  { t: "Built for the messy middle", them: "Tools for startups (too simple) or enterprises (too complex / expensive).", us: "Built specifically for $600K–$2M revenue businesses. Simple enough to use without training. Sophisticated enough to grow." },
  { t: "AI that knows your business", them: "Generic AI that needs prompting. Generic outputs.", us: "AI trained on your strategic foundation. Knows your voice, your positioning, your audience. Sounds like you wrote it." },
];

export default function WhyMoxie() {
  return (
    <MarketingPage
      eyebrow="Why MOXIE"
      title="Why MOXIE succeeds where others failed."
      subtitle="You've tried VAs, Zapier, HubSpot, all-in-one platforms, and generic AI. They all failed for the same reason: they didn't start with strategy."
    >
      <div className="space-y-24">
        {/* Differences */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">What makes MOXIE unreplicable.</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">Five differences nobody else can copy without rebuilding from the ground up.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {differences.map((d, i) => (
              <Card key={d.t} className="p-7 border-border shadow-soft">
                <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-3">Difference {i + 1}</div>
                <h3 className="font-bold text-xl mb-4 tracking-tight">{d.t}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div><span className="font-semibold">Everyone else:</span> <span className="text-muted-foreground font-light">{d.them}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div><span className="font-semibold">MOXIE:</span> <span className="font-light">{d.us}</span></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Failed solutions */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">What you've already tried.</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">And exactly why none of it stuck.</p>
          </div>
          <div className="space-y-4">
            {failed.map((f, i) => (
              <Card key={f.t} className="p-7 md:p-8 border-border shadow-soft">
                <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                  <div className="font-display text-3xl text-muted-foreground/40 leading-none">0{i + 1}</div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><X className="h-5 w-5 text-muted-foreground" />{f.t}</h3>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">{f.tried}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">What happened</div>
                      <p className="text-sm font-light leading-relaxed">{f.happened}</p>
                    </div>
                    <div className="md:border-l border-border md:pl-6">
                      <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">Why it failed</div>
                      <p className="text-sm font-medium leading-relaxed">{f.why}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats proof bar */}
        <section>
          <StatsBar />
        </section>

        {/* Why now */}
        <section className="bg-muted/40 -mx-6 px-6 md:-mx-12 md:px-12 py-16 rounded-3xl border border-border">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-10">Three convergences make this the right moment.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "AI matured", d: "ChatGPT proved AI can create quality content. MOXIE goes further — AI that knows YOUR business, voice, and strategy." },
              { n: "02", t: "Fragmentation hit a breaking point", d: "40% of companies abandoned marketing automation in 2024 (up from 24%). The market is rejecting complexity." },
              { n: "03", t: "The messy middle is underserved", d: "Tools built for startups or enterprises. The $600K–$2M segment ignored. Exactly where MOXIE fits." },
            ].map((r) => (
              <div key={r.n}>
                <div className="font-display text-5xl text-accent mb-3">{r.n}</div>
                <h3 className="font-bold text-lg mb-2">{r.t}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{r.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}