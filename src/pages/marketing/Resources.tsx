import { useState, FormEvent, useRef, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Resource = { type: "Template" | "Guide" | "Toolkit" | "Framework"; title: string; description: string };

const FEATURED: Resource[] = [
  { type: "Template", title: "The Brand Architecture Worksheet", description: "Map your positioning, ideal client, voice, and content pillars in one structured doc." },
  { type: "Guide", title: "The Founder's LinkedIn Playbook", description: "Data-backed posting strategy for expertise-based founders: hooks, cadence, and content that converts." },
  { type: "Toolkit", title: "The Anti-AI-Slop Content Kit", description: "How to use AI for content without losing your voice, your authority, or your audience's trust." },
  { type: "Framework", title: "The 90-Day Marketing Engine", description: "Build a quarter of strategy-aligned content in one afternoon. Calendar, pillars, and platform plan included." },
  { type: "Template", title: "The Messaging Vault", description: "One-liner, elevator pitch, bio, and email signature — all written from your Brand Architecture." },
];

const EXTRA: Resource[] = [
  { type: "Template", title: "The Discovery Question Bank", description: "16 questions to extract your complete brand foundation — use it yourself or with clients." },
  { type: "Framework", title: "The Content Pillar Builder", description: "Define 4-5 content themes that align to your positioning and keep you out of content paralysis." },
  { type: "Guide", title: "The Tool Stack Audit", description: "Identify exactly which tools to cut, which to keep, and what MOXIE replaces in your current stack." },
];

const ALL = [...FEATURED, ...EXTRA];

type PackTag = "Framework" | "Prompt" | "Guide" | "Toolkit" | "Checklist";
type Pack = { tag: PackTag; title: string; description: string; button: string; link: string };

const PACKS: Pack[] = [
  { tag: "Framework", title: "Website Copy Framework", description: "The structure behind high-converting websites. The exact prompts and frameworks used to build CRO-optimized headlines, CTA formulas, and audience-specific copy templates.", button: "Download the Website Copy Framework", link: "https://docs.google.com/document/d/1MgD_HoUD2espAiVOFWzYbIljnfAFHCUW/" },
  { tag: "Framework", title: "Pitch Deck Framework", description: "Build decks investors can't ignore. Our full pitch deck framework — including deep research prompts, structure templates, and storytelling cues designed to win attention and funding.", button: "Access the Pitch Deck Framework", link: "https://docs.google.com/document/d/1XTIoxRfB_1YmwuS5TAogepWJ2oOOdzSN/" },
  { tag: "Prompt", title: "ChatGPT Founder Brain Prompt", description: "Train ChatGPT to think like you. Turn your AI into a second brain that remembers context, challenges your thinking, and co-creates with your style.", button: "Activate the Founder Brain Prompt", link: "https://docs.google.com/document/d/1th60TQINSbN9Lc-64uoNesqR-0AvLtrc/" },
  { tag: "Prompt", title: "Market Size Prompt", description: "Validate your market with precision. A guided prompt for calculating TAM, SAM, and SOM — ideal for investor decks, pitch prep, or understanding your growth ceiling.", button: "Run the Market Size Prompt", link: "https://docs.google.com/document/d/1RPUJm3t7FSVObS9c9jsWQXMV7LwdjCq6/" },
  { tag: "Prompt", title: "Competitor Prompt", description: "Know your landscape before you build. A single, powerful prompt for ChatGPT or Gemini that reveals competitor insights, positioning angles, and market opportunities.", button: "Download the Competitor Prompt", link: "https://docs.google.com/document/d/1caAfroIxpoe94FCL5zAEK-zLqz1OFmoB/" },
  { tag: "Guide", title: "How To Create A Brand With AI", description: "From concept to creation — all inside AI. A full step-by-step system for building brands with AI, including prompts, tools, and real examples that show what's possible when creativity meets strategy.", button: "Unlock the Brand Creation Framework", link: "https://docs.google.com/document/d/1X5sNKNe-693r9S068M1uNgiF4zqPXALq/" },
  { tag: "Toolkit", title: "Marketing Checklist", description: "Your AI-assisted marketing playbook. A complete list of how to market your brand — with prompts, strategies, and AI shortcuts for faster, smarter execution.", button: "Get the Marketing Checklist", link: "https://designhiro.com/marketing-checklist/" },
  { tag: "Toolkit", title: "Content Custom GPTs", description: "Generate ideas that go viral — on purpose. Includes two custom GPTs: one for crafting viral hooks and another for refining storytelling scripts built to convert.", button: "Try the Content GPTs", link: "https://designhiro.com/content-custom-gpts/" },
  { tag: "Checklist", title: "Business Stage Checklist With AI Tools", description: "Every stage. Every advantage. This checklist maps every phase of building a business — and the AI tools that give you leverage at each step.", button: "Access the Business Stage Checklist", link: "https://designhiro.com/business-stage-checklist-with-ai-tools/" },
  { tag: "Guide", title: "AI Tools Guide", description: "The exact AI stack behind modern creative teams. Explore the tools actually used — from research and branding to mockups and MVPs — and learn how to integrate them into your daily build process.", button: "Explore the Tools Guide", link: "https://designhiro.com/ai-tools-guide/" },
  { tag: "Framework", title: "Deep Research Framework", description: "Research like a strategist, not a student. Learn how to prompt AI for true insight — validating demand, analyzing competitors, and surfacing pricing models that make sense for your market.", button: "Get the Deep Research Framework", link: "https://designhiro.com/deep-research-framework/" },
  { tag: "Framework", title: "How To Find A Business Idea With AI", description: "AI won't hand you a million-dollar idea — but it can help you discover one. This framework shows you how to use AI to identify market gaps, validate ideas, and uncover opportunities worth building.", button: "Get the Idea Discovery Framework", link: "https://designhiro.com/how-to-find-a-business-idea-with-ai/" },
  { tag: "Toolkit", title: "Branding Prompts", description: "Turn AI into your brand architect. The exact prompts used to build brand identity — from tone and color to logos, visual direction, and messaging. Design a brand that feels intentional, not automated.", button: "Access the Branding Toolkit", link: "https://designhiro.com/branding-prompts/" },
  { tag: "Guide", title: "High-Performance ChatGPT Setup", description: "Build your AI to think like a founder. A step-by-step guide to configure ChatGPT as your strategist, co-founder, and creative coach — for high-performance leaders who want sharper output and less mental friction.", button: "Download Your Setup Guide", link: "https://designhiro.com/high-performance-chatgpt-setup/" },
  { tag: "Prompt", title: "AI Thought Partner Prompts", description: "Stop outsourcing your ideas — sharpen them. These prompts transform AI from a yes-machine into your boldest creative challenger. Push your thinking further, question assumptions, and unlock new directions for your brand or business.", button: "Unlock the Thought Partner Prompts", link: "https://designhiro.com/ai-thought-partner-prompts/" },
];

const FILTERS: Array<"All" | PackTag> = ["All", "Prompt", "Framework", "Guide", "Toolkit", "Checklist"];

function PromptPacksSection() {
  const [filter, setFilter] = useState<"All" | PackTag>("All");
  return (
    <section style={{ background: "#f8f8f8" }} className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-5 px-4 py-2 rounded-full bg-accent-soft">
            AI Prompt Packs & Toolkits
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-5">
            AI systems and tools for founders,<br />builders, and strategic thinkers.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-[640px] mx-auto leading-relaxed">
            The exact prompts, frameworks, and toolkits to turn ideas into execution — with clarity, speed, and strategy. Free for everyone. No signup required.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-start md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${
                  active ? "bg-accent text-white border-accent" : "bg-white text-foreground border-border hover:border-accent/50"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {PACKS.map((p) => {
            const hidden = filter !== "All" && p.tag !== filter;
            return (
              <div
                key={p.title}
                style={{ display: hidden ? "none" : "flex", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", borderRadius: 16 }}
                className="bg-white p-6 flex-col justify-between h-full"
              >
                <div>
                  <div className="text-accent font-bold mb-3" style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    {p.tag}
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground leading-snug mb-3">{p.title}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.7 }}>{p.description}</p>
                </div>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block text-center transition-colors hover:bg-accent hover:text-white"
                  style={{
                    border: "1.5px solid #ff6b6b",
                    color: "#ff6b6b",
                    background: "transparent",
                    borderRadius: 40,
                    padding: "12px 20px",
                    fontSize: 11,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    width: "100%",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ff6b6b"; e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ff6b6b"; }}
                >
                  {p.button}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ComingSoonPill() {
  return (
    <span className="inline-block rounded-full bg-accent text-white uppercase font-semibold" style={{ fontSize: 10, letterSpacing: 0.5, padding: "3px 8px" }}>
      Coming Soon
    </span>
  );
}

function ResourceImage({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center bg-[#f8f8f8] aspect-[16/10] rounded-t-2xl">
      <Sparkles className="text-accent" style={{ width: size, height: size }} />
    </div>
  );
}

function ResourcesEmail({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("resources_waitlist").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setSubmitted(true);
    setEmail("");
  }

  if (submitted) return <p className={`text-sm font-medium ${dark ? "text-white" : "text-foreground"}`}>You're on the list.</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto w-full">
      <Input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`h-12 flex-1 ${dark ? "bg-white text-foreground border-white" : ""}`}
      />
      <Button type="submit" disabled={loading} className="h-12 px-5 rounded-md bg-accent hover:bg-accent/90 text-white font-semibold">
        Get early access <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function FeaturedCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
    setIdx((i) => Math.max(0, Math.min(FEATURED.length - 1, i + dir)));
  }

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-6 overflow-x-auto snap-x scroll-smooth pb-4 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURED.map((r) => (
          <div key={r.title} data-card className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
            <ResourceImage size={48} />
            <div className="p-6 flex flex-col gap-3 flex-1">
              <span className="self-start inline-block rounded-full bg-accent-soft text-accent text-xs font-bold uppercase tracking-wider px-3 py-1">{r.type}</span>
              <h3 className="text-[20px] font-bold leading-snug text-foreground">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
              <span className="mt-auto text-sm font-medium text-muted-foreground">Coming Soon →</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={() => scrollBy(-1)} aria-label="Previous" className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {FEATURED.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/30"}`} />
          ))}
        </div>
        <button onClick={() => scrollBy(1)} aria-label="Next" className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CategorySection({ label, items }: { label: string; items: Resource[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-foreground mb-4">{label}</h3>
      <div className="grid sm:grid-cols-2 gap-5">
        {items.map((r) => (
          <div key={r.title} className="rounded-xl bg-card border border-border shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <span className="text-accent text-xs font-bold uppercase tracking-wider">{r.type}</span>
            </div>
            <h4 className="text-base font-bold text-foreground leading-snug">{r.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
            <div className="mt-auto pt-2"><ComingSoonPill /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Resources() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            Resources
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.02] text-foreground mb-5">
            Everything you need to build smarter.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto">
            Templates, toolkits, guides, and frameworks — built specifically for expertise-based founders at $600K–$2M.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-14 w-full space-y-16">
        <FeaturedCarousel />
      </main>

      <PromptPacksSection />

      <section className="bg-[#101116] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-4">
            Get early access to every resource.
          </h2>
          <p className="text-white/70 text-lg mb-7">
            We'll send you each resource the moment it drops — free for founding members.
          </p>
          <ResourcesEmail dark />
          <p className="text-white/50 text-xs mt-4">Free for founding members. No spam.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}