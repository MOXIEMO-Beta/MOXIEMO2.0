import { useState, FormEvent, useRef } from "react";
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
const byType = (t: Resource["type"]) => ALL.filter((r) => r.type === t).slice(0, 2);

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

        <CategorySection label="Templates" items={byType("Template")} />
        <CategorySection label="Guides" items={byType("Guide")} />
        <CategorySection label="Frameworks" items={byType("Framework")} />
        <CategorySection label="Toolkits" items={byType("Toolkit")} />
      </main>

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