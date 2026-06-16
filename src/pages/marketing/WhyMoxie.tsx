import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";
import { MarketingPage } from "./MarketingPage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const failed = [
  {
    t: "Hired a VA",
    tried: "Brought on a virtual assistant to manage tools, post content, and coordinate marketing.",
    happened: "Weeks one and two went to training on six platforms. Weeks three to six, they seemed to be getting it. Weeks seven and eight, they quit. You were back to managing everything, and behind on campaigns.",
    why: "The problem was not capacity. It was system complexity. Adding a person to chaos does not eliminate the chaos.",
  },
  {
    t: "Built Zapier automations",
    tried: "Spent hours wiring workflows to connect your tools.",
    happened: "It felt brilliant when it worked. Then one stopped firing. Then another broke silently. Now you are debugging webhooks on Sunday nights.",
    why: "Integration layers add complexity. When tools update, integrations break. You end up maintaining infrastructure, not marketing.",
  },
  {
    t: "Looked at HubSpot",
    tried: "Evaluated enterprise marketing automation.",
    happened: "You loved the demo. Then you saw the enterprise price, the months-long implementation, and the mixed reviews. You walked away.",
    why: "It was built for enterprises with marketing teams and IT departments. Not for lean, founder-led businesses.",
  },
  {
    t: "Tried all-in-one platforms",
    tried: "Consolidated onto Kajabi or Teachable.",
    happened: "You still needed a separate tool for advanced email. Another for scheduling. Another for social. Another for contracts. The same number of tools, just rearranged.",
    why: "All-in-one platforms do one thing well and need supplements for everything else.",
  },
  {
    t: "Used generic AI tools",
    tried: "ChatGPT, Claude, or Jasper, to write content faster.",
    happened: "The drafts came out generic. You saved a little time writing and added complexity everywhere else. You were still moving content across six platforms.",
    why: "Generic AI does not know your business, your voice, or your strategy. And it does not solve fragmentation.",
  },
];

const differences = [
  {
    t: "We start with strategy",
    them: "Jump straight to execution, what do you want to post.",
    us: "A strategic discovery first. Who you serve, what transformation you provide, and your voice, before any content gets written.",
  },
  {
    t: "Strategy is a living system",
    them: "A consultant hands you a strategy document, and you reference it manually until it goes stale.",
    us: "Strategy embedded in every tool. You never forget the strategy, because the system enforces it automatically.",
  },
  {
    t: "True consolidation",
    them: "Integration platforms connect fragmented tools, and all-in-ones still need three or four supplements.",
    us: "Replaces the tools entirely. No integrations, because everything is native. One login, one source of truth.",
  },
  {
    t: "Built for the messy middle",
    them: "Tools for startups, too simple, or enterprises, too complex and expensive.",
    us: "Built for the messy middle, founders and growing businesses past the scrappy start but without a full marketing team. Simple enough to use without training. Sophisticated enough to grow with you.",
  },
  {
    t: "AI that knows your business",
    them: "Generic AI that needs prompting, and generic output.",
    us: "AI trained on your strategic foundation. It knows your voice, your positioning, and your audience. It sounds like you wrote it.",
  },
];

const forYou = [
  { t: "You have built something real", d: "Not a side hobby. You are serious about growth, and you need marketing that actually works." },
  { t: "You are done juggling a stack of disconnected tools", d: "You are tired of paying for tools that do not talk to each other, with no strategy holding them together. You want one system that runs the whole go-to-market." },
  { t: "You want strategy and execution, not just post ideas", d: "You do not want a feed of generic content. You want a complete go-to-market: the strategy, the content that carries it, and the distribution that puts it in front of the right people." },
  { t: "You want the system to do the work, with your hand on it", d: "MOXIEMO plans, writes, schedules, and publishes on your strategy. You review, approve, and steer. You stay the owner without doing the grind." },
  { t: "You want your time back for the work only you can do", d: "You would rather spend a few minutes steering the system than hours building content from scratch." },
  { t: "You want agency-level strategy without the agency price", d: "You need real strategy and execution at a price that makes sense for a founder or a growing business." },
];

const notForYou = [
  { t: "You want to hand it off and never look at it again", d: "MOXIEMO runs the work, but you stay the strategic owner. You review and approve. If you want to disappear completely and never weigh in, this is not that." },
  { t: "You expect results without strategy", d: "MOXIEMO is built strategy-first. If you just want to post and hope, this is not the fit." },
  { t: "You only want a list of content ideas", d: "MOXIEMO is a full go-to-market system. If all you need is a board of post prompts, this is more than you need." },
  { t: "You do not believe marketing needs a foundation", d: "A brand is not a go-to-market. If you are not willing to get clear on who you are for and what they need to hear, the system cannot do its best work." },
  { t: "You are not ready to invest in your marketing yet", d: "MOXIEMO starts at $79 a month, not free. If you cannot commit to investing in your growth right now, this is not the moment." },
];

// Outcomes band. Each item is an editable slot: a qualitative claim today,
// ready to be replaced with a real figure (e.g. value: "18+ hrs") once beta data is in.
const outcomes: { value: string; label: string }[] = [
  { value: "Hours back", label: "every week, spent steering instead of grinding" },
  { value: "One platform", label: "in place of a stack of disconnected tools" },
  { value: "Minutes, not months", label: "to a complete strategy" },
  { value: "Agency-level", label: "strategy and execution, without the agency price" },
];

export default function WhyMoxie() {
  return (
    <MarketingPage
      eyebrow="Why MOXIEMO"
      title="MOXIEMO is not another tool. It is a growth system."
      subtitle="You have tried VAs, Zapier, HubSpot, all-in-one platforms, and generic AI. They all failed for the same reason. They were tools, bolted onto a go-to-market that was never built. MOXIEMO is a growth system. It finds what makes you valuable, turns it into content that earns attention, puts it in market, and proves it kept driving your growth. It starts with strategy, runs the work on it, and is moving to do that work autonomously, with your approval."
    >
      <div className="space-y-24">
        <section className="-mx-6 md:-mx-12 px-6 md:px-12" style={{ paddingTop: "16px", paddingBottom: "40px" }}>
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-accent mb-4">Who is MOXIEMO for?</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.05]">
              Is This <span className="italic text-accent">Right</span> For You?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* For you */}
            <Card className="overflow-hidden border-border shadow-soft">
              <div className="bg-accent text-accent-foreground px-6 py-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-background/95 flex items-center justify-center">
                  <Check className="h-5 w-5 text-accent" strokeWidth={3} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">This is for you if…</h3>
              </div>
              <ul className="divide-y divide-border">
                {forYou.map((item) => (
                  <li key={item.t} className="px-6 py-5 flex gap-4">
                    <div className="h-7 w-7 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-accent" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base mb-1 tracking-tight">{item.t}</h4>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Not for you */}
            <Card className="overflow-hidden border-border shadow-soft">
              <div className="bg-foreground text-background px-6 py-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-background/95 flex items-center justify-center">
                  <X className="h-5 w-5 text-foreground" strokeWidth={3} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">This is not for you if…</h3>
              </div>
              <ul className="divide-y divide-border">
                {notForYou.map((item) => (
                  <li key={item.t} className="px-6 py-5 flex gap-4">
                    <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="h-4 w-4 text-background" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base mb-1 tracking-tight">{item.t}</h4>
                      <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Differences */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">What makes MOXIEMO unreplicable</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">Five differences nobody else can copy without rebuilding from the ground up.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div><span className="font-semibold">MOXIEMO:</span> <span className="font-light">{d.us}</span></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center gap-3">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-full font-semibold">
              <Link to="/auth">Start free Discovery <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <p className="text-sm text-muted-foreground text-center">No credit card required. Founding members get full access free.</p>
          </div>
        </section>

        {/* Outcomes band. Editable slots, ready for real figures once beta data is in. */}
        <section>
          <div
            className="rounded-2xl bg-[#f8f8f8] w-full"
            style={{ padding: "clamp(32px, 6vw, 60px) clamp(20px, 6vw, 80px)", maxWidth: "100%", boxSizing: "border-box" }}
          >
            <div className="text-center mb-10">
              <h2 className="font-bold text-foreground" style={{ fontSize: 28 }}>
                What MOXIEMO gives you back
              </h2>
              <p className="text-muted-foreground mt-3 mx-auto" style={{ fontSize: 16, maxWidth: 620 }}>
                Run Discovery once, and you stop bleeding time, money, and focus into a broken stack.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
              {outcomes.map((s, i) => (
                <div
                  key={s.label}
                  className="text-center flex flex-col items-center justify-center relative md:px-6"
                >
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2"
                      style={{ width: 1, height: 40, background: "#e0e0e0" }}
                    />
                  )}
                  <div
                    className="font-bold leading-tight mb-3"
                    style={{ color: "#ff6b6b", fontSize: "clamp(24px, 4vw, 36px)" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-muted-foreground font-medium"
                    style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 220 }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why now */}
        <section className="bg-muted/40 -mx-6 px-6 md:-mx-12 md:px-12 py-16 rounded-3xl border border-border">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-10">Three convergences make this the right moment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "AI matured", d: "ChatGPT proved AI can create quality content. MOXIEMO goes further, with AI that knows your business, your voice, and your strategy." },
              { n: "02", t: "Fragmentation hit a breaking point", d: "Companies are walking away from bloated marketing automation. The market is rejecting complexity." },
              { n: "03", t: "The messy middle is underserved", d: "Tools are built for startups or for enterprises. The founders and growing businesses in between, with real traction and no marketing team, get ignored. That is exactly where MOXIEMO fits." },
            ].map((r) => (
              <div key={r.n}>
                <div className="font-display text-5xl text-accent mb-3">{r.n}</div>
                <h3 className="font-bold text-lg mb-2">{r.t}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What you have already tried */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">What you've already tried</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">And exactly why none of it stuck.</p>
          </div>
          <div className="space-y-4">
            {failed.map((f, i) => (
              <Card key={f.t} className="p-7 md:p-8 border-border shadow-soft">
                <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                  <div className="font-display text-3xl text-muted-foreground/40 leading-none">0{i + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </MarketingPage>
  );
}