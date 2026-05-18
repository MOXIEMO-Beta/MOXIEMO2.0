import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StatsBar } from "@/components/StatsBar";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const profiles = [
  {
    t: "Executive Coaches",
    rev: "$500K–$1.5M annually",
    challenge: "Managing Kajabi, ConvertKit, Calendly, Dubsado, Later, and Google Analytics takes 20+ hours weekly. You're spending more time on marketing than coaching.",
    help: ["Position as the coach who's lived what clients are experiencing", "One platform for courses, email, scheduling, social", "18 hours back to coach high-ticket clients"],
    quote: "I went from 20 hours managing tools to 2 hours approving content. MOXIEMO gave me my CEO life back.",
    who: "Sarah Thompson — Executive Coach, $650K",
  },
  {
    t: "Fractional Executives & Consultants",
    rev: "$250K+ annually",
    challenge: "Disconnected marketing across LinkedIn, email, and content. No coherent narrative. Prospects can't articulate what you actually do — and neither can your marketing.",
    help: ["Clarify positioning and the transformation you provide", "Content calendar that builds a clear narrative", "Qualified leads who understand your value before the first call"],
    quote: "MOXIEMO's AI discovery nailed my positioning better than the $5K consultant I hired. And unlike their PDF, MOXIEMO executes.",
    who: "Michael Chen — Leadership Consultant, $1.2M",
  },
  {
    t: "Service-Based Founders",
    rev: "$250K+ annually",
    challenge: "You deliver exceptional work for clients but your own marketing is an afterthought. You're too busy serving others to build the system that serves you.",
    help: ["Practice what you preach with a strategic foundation", "Marketing runs without pulling team off client work", "Consistent pipeline without sacrificing delivery"],
    quote: "We built incredible strategies for clients but couldn't execute our own. MOXIEMO gave us the system we build for others — finally working for us.",
    who: "David Park — Agency Founder, $2.3M",
  },
];

const scenarios = [
  { t: "The tool chaos problem", before: "Six tools. Data scattered. Integrations break at 2 AM. You hired a VA — she quit after 6 weeks.", after: "Replaces 4–6 tools with one unified platform. No integrations needed. 18+ hours/week back." },
  { t: "The disconnected content problem", before: "You post when you remember. Email when you have something to say. No coherent narrative.", after: "20-min discovery → strategy themes → AI writes in your voice. Random posts become a brand narrative." },
  { t: "The 'what should I post?' problem", before: "It's Wednesday. Blank LinkedIn screen. Everything feels forced or generic.", after: "Strategy-aligned topics tied to your content pillars and audience pain points. Blank screen never again." },
  { t: "The ROI uncertainty problem", before: "$800/mo on tools, 20 hours/week, no idea if any of it works. Discovery calls feel random.", after: "Define YOUR success metric in discovery. Get attribution + ROI tied to real business outcomes." },
  { t: "The scale-without-chaos problem", before: "To grow $750K → $1.5M you'd need 40-hour marketing weeks. CMO costs $120K. Agencies $5K/mo.", after: "Same 2 hours/week at $250K or $1.5M. The system scales — you don't have to." },
];

type FaqItem = { q: string; a: string };
type FaqGroup = { label: string; items: FaqItem[] };

const faqGroups: FaqGroup[] = [
  {
    label: "How it works",
    items: [
      { q: "How does MOXIEMO Discovery actually work?", a: "MOXIEMO Discovery is a guided AI conversation — not a form, not a quiz. MOXIEMO asks you 16 questions about your business: who you serve, the transformation you provide, your voice, your goals, and your biggest marketing challenges. You answer in your own words, as much or as little detail as you want. The whole conversation takes about 20 minutes. When you're done, MOXIEMO synthesizes everything into your complete marketing strategy — positioning statement, content pillars, voice guidelines, channel plan, and success metrics. It's the strategic work most founders spend $5K–$10K on with a consultant, done in under half an hour." },
      { q: "How long does it take to get set up?", a: "Most founders are fully set up and generating their first content within 45 minutes of signing up. Discovery takes 20 minutes. Strategy review takes 5–10 minutes. Your first piece of content takes another 5 minutes. There's no onboarding call required, no data migration on day one, and no technical setup. You just answer the questions and MOXIEMO does the rest." },
      { q: "What happens after I complete Discovery?", a: "MOXIEMO synthesizes your answers into your Marketing Foundation — a complete strategy document that lives inside the platform and powers everything else. From there you can review and edit your strategy, generate your first batch of content, build your first campaign, set up your content calendar, and connect your social accounts. Every tool inside MOXIEMO already knows your strategy, so everything you generate from that point forward is anchored to your positioning, voice, and goals — automatically." },
    ],
  },
  {
    label: "The AI angle",
    items: [
      { q: "Will the content actually sound like me or will it sound like AI?", a: "This is the most important question — and the honest answer is: it depends on how much you put into Discovery. MOXIEMO is specifically built to prevent AI slop. Before any AI touches your content, it reads your full strategy — your voice attributes, your ideal client, your positioning, your content pillars, and the exact language you used in your Discovery answers. The more specific you are in Discovery, the more your content sounds like you. Founders who answer in detail consistently say the output sounds like a well-briefed version of themselves. We also built in an edit-and-refine loop so you can adjust any output with a single instruction before publishing." },
      { q: "Do I need to know anything about AI to use MOXIEMO?", a: "Not even slightly. MOXIEMO is built for operators, not engineers. You don't configure anything, you don't write prompts, and you don't need to understand how the AI works. You bring the idea — a topic, a client story, a hot take — and MOXIEMO shapes it into content. The only thing you need to do is review, edit if you want to, and approve. That's it." },
      { q: "What AI does MOXIEMO use?", a: "MOXIEMO is powered by Claude, built by Anthropic — one of the leading AI safety companies in the world. We chose Claude specifically because of its strength in nuanced, voice-accurate writing and its commitment to responsible AI. Your Discovery responses and strategy data are used only to generate your content — we do not use your data to train AI models." },
    ],
  },
  {
    label: "Practical concerns",
    items: [
      { q: "What tools does MOXIEMO replace?", a: "For most founders generating $250K or more, MOXIEMO replaces 4–6 tools they're currently paying for separately. Typically: a content scheduling tool (Buffer, Later, Hootsuite), an email marketing platform (ConvertKit, Mailchimp, ActiveCampaign), a content planning tool (Notion, Airtable, or a spreadsheet), a social publishing tool, and often a strategy consultant or fractional CMO engagement. The average founder saves $300–$600/month in tool costs alone — before counting the 18+ hours a week they get back." },
      { q: "Do I have to cancel my other tools right away?", a: "No — and we actually recommend against it. Run MOXIEMO alongside your current stack for your first 30 days. Get comfortable with the platform, generate your first month of content, and see what it replaces in practice. Most founders find they can cut 3–4 tools after the first month once they've confirmed MOXIEMO covers what they need. We'd rather you make that decision with confidence than feel pressured to cancel everything on day one." },
      { q: "Can I edit the content MOXIEMO generates?", a: "Yes — always. Every piece of content MOXIEMO generates lands in a fully editable rich text area before it goes anywhere. You can rewrite sentences, change the tone, add a personal story, or use the inline refine tool to give MOXIEMO a single instruction like \"make this shorter\" or \"add a question at the end.\" Nothing publishes without your approval. You are always the final editor." },
      { q: "What if I want to change my strategy later?", a: "Your strategy is a living document, not a locked PDF. You can edit any section of your Marketing Foundation at any time — your positioning statement, your content pillars, your ideal client, your voice attributes. When you update your strategy, all future content generation automatically reflects the changes. You can also run a full Discovery refresh anytime you want a complete strategy reset — useful after a pivot, a new offer launch, or a significant shift in your business." },
    ],
  },
  {
    label: "Pricing & commitment",
    items: [
      { q: "What does founding member access include?", a: "Founding members get full access to MOXIEMO's Foundation tier — free forever. That includes MOXIEMO Discovery, your complete Marketing Foundation, content generation, Marketing Planner, email marketing, social publishing, and every feature at the Foundation level we ship going forward. As MOXIEMO grows and we build out expanded modules — advanced campaigns, deeper analytics, team collaboration, and more — those will live in paid tiers. Founding members get first access to every new feature and locked-in founding member pricing on any upgrade. You'll never pay for what you have today — and you'll always pay less than anyone who joins after you." },
      { q: "Is there a contract or can I cancel anytime?", a: "No contracts, ever. Paid plans are month-to-month and you can cancel anytime from your account settings — no fees, no friction, no calls required. For founding members on free Foundation access, there's nothing to cancel. Your free tier simply continues. We believe MOXIEMO should earn your continued use every month, not trap you into staying." },
      { q: "What happens when the beta ends?", a: "Your Foundation tier access stays free permanently — that's the founding member promise, full stop. When we move out of beta, new users will pay standard pricing. Founding members who want access to expanded Growth or Scale features will have first access and locked-in founding member rates — significantly below what new users pay. The beta period is also where you shape what we build. We're already running an active Discord community for founding members — bug reports, feature requests, early access drops, and direct conversations with Karee about what comes next. You're not just getting a tool. You're building it with us." },
    ],
  },
];

function FaqSection() {
  const [openKey, setOpenKey] = useState<string>("");
  return (
    <section className="bg-white" style={{ padding: "80px 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 860 }}>
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            Frequently asked questions
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]">
            Everything you want to know<br />before you get started.
          </h2>
          <p className="text-muted-foreground mx-auto" style={{ maxWidth: 560, fontSize: 16 }}>
            No fluff. No corporate non-answers. Just straight answers to the questions we hear every week.
          </p>
        </div>

        <div className="space-y-10">
          {faqGroups.map((group, gi) => (
            <div key={group.label}>
              <div
                className="font-bold text-foreground uppercase mb-3 pl-3"
                style={{
                  fontSize: 13,
                  letterSpacing: "2px",
                  borderLeft: "3px solid #ff6b6b",
                }}
              >
                {group.label}
              </div>
              <div>
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} style={{ borderBottom: "1px solid #eee" }}>
                      <button
                        type="button"
                        onClick={() => setOpenKey(isOpen ? "" : key)}
                        className="w-full flex items-center justify-between text-left py-5"
                      >
                        <span className="font-bold text-foreground pr-6" style={{ fontSize: 17 }}>
                          {item.q}
                        </span>
                        {isOpen ? (
                          <Minus className="shrink-0" style={{ color: "#ff6b6b" }} size={20} />
                        ) : (
                          <Plus className="shrink-0" style={{ color: "#ff6b6b" }} size={20} />
                        )}
                      </button>
                      <div
                        style={{
                          maxHeight: isOpen ? 800 : 0,
                          overflow: "hidden",
                          transition: "max-height 300ms ease",
                        }}
                      >
                        <div
                          className="text-muted-foreground"
                          style={{ fontSize: 16, lineHeight: 1.8, padding: "16px 0 24px 0" }}
                        >
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: 40 }}>
          <p className="text-muted-foreground mb-2">Still have questions? We answer personally.</p>
          <a
            href="mailto:hello@buildwithmoxiemo.com"
            className="font-semibold hover:underline"
            style={{ color: "#ff6b6b" }}
          >
            Email us at hello@buildwithmoxiemo.com →
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            Solutions
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-[-0.04em] mb-6 text-foreground">
            Built for the messy middle.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            You're too successful for scrappy startup hacks. Not big enough for enterprise platforms with 6-month implementations. MOXIEMO is built for $250K+ coaches, consultants, and agencies.
          </p>
        </div>
      </section>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="space-y-24">
        {/* ICPs */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-14">The exact businesses MOXIEMO serves.</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {profiles.map((p) => (
              <Card key={p.t} className="p-8 border-border shadow-soft flex flex-col">
                <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">{p.rev}</div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{p.t}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-5"><span className="font-semibold text-foreground">The challenge:</span> {p.challenge}</p>
                <ul className="space-y-2 mb-6 text-sm">
                  {p.help.map((h) => (
                    <li key={h} className="border-l-2 border-accent pl-3 py-0.5 font-medium">{h}</li>
                  ))}
                </ul>
                <blockquote className="mt-auto border-t border-border pt-5">
                  <div
                    className="italic text-muted-foreground mb-2"
                    style={{ fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" }}
                  >
                    Representative scenario
                  </div>
                  <p className="text-sm italic font-light text-muted-foreground mb-2">"{p.quote}"</p>
                  <cite className="text-xs font-semibold not-italic">{p.who}</cite>
                </blockquote>
              </Card>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The problems MOXIEMO actually solves.</h2>
            <p className="text-muted-foreground text-lg font-light max-w-2xl mx-auto">Five scenarios we hear every single week. You'll recognize at least three.</p>
          </div>
          <div className="space-y-4">
            {scenarios.map((s, i) => (
              <Card key={s.t} className="p-7 md:p-8 border-border shadow-soft">
                <div className="grid md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-8 items-start">
                  <div className="font-display text-4xl text-muted-foreground/40 leading-none">0{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{s.before}</p>
                  </div>
                  <div className="md:border-l border-border md:pl-8">
                    <div className="text-xs uppercase tracking-[0.2em] text-accent font-bold mb-2">With MOXIEMO</div>
                    <p className="text-sm font-medium leading-relaxed">{s.after}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
        </div>
      </main>
      <FaqSection />
      <section className="py-[60px] bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <StatsBar />
        </div>
      </section>
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Ready when you are.</h2>
          <p className="text-muted-foreground mb-7 text-lg">Start your MOXIEMO Discovery in under a minute.</p>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-full font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "#ff6b6b" }}
          >
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}