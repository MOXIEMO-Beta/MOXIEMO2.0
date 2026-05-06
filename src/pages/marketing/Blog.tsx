import { useState, FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "All",
  "Strategy",
  "Content",
  "Founder Stories",
  "AI Marketing",
  "Tools & Systems",
  "Case Studies",
];

const ARTICLES = [
  { category: "Strategy", title: "The Brand Architecture Method: How to stop winging your positioning", excerpt: "A repeatable system for nailing positioning the first time — without the guesswork.", read: "6 min read" },
  { category: "Content", title: "Why your LinkedIn posts aren't landing (and the fix takes 10 minutes)", excerpt: "Most posts fail at the hook. Here's the framework we use with every founder.", read: "5 min read" },
  { category: "AI Marketing", title: "AI slop vs. AI strategy: the difference is your foundation", excerpt: "Why your prompts only get as good as the brand architecture behind them.", read: "7 min read" },
  { category: "Tools & Systems", title: "The 6-tool stack killing your productivity — and what replaces it", excerpt: "An honest audit of the marketing stack most founders accidentally end up with.", read: "4 min read" },
  { category: "Founder Stories", title: "From overwhelmed to operating: how one consultant reclaimed 18 hours a week", excerpt: "What changed when she stopped reinventing her marketing every Monday.", read: "9 min read" },
  { category: "Case Studies", title: "$93K in annual savings: what happens when your marketing actually has a strategy", excerpt: "A real teardown of one founder's stack before and after MOXIEMO.", read: "8 min read" },
];

function PlaceholderImage({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#f8f8f8] ${className}`}>
      <Sparkles className="text-accent" style={{ width: 40, height: 40 }} />
    </div>
  );
}

function ComingSoonPill() {
  return (
    <span className="inline-block rounded-full bg-accent text-white uppercase font-semibold" style={{ fontSize: 10, letterSpacing: 0.5, padding: "3px 8px" }}>
      Coming Soon
    </span>
  );
}

function EmailCapture({ ctaLabel, dark = false }: { ctaLabel: string; dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("blog_waitlist").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setSubmitted(true);
    setEmail("");
  }

  if (submitted) {
    return <p className={`text-sm font-medium ${dark ? "text-white" : "text-foreground"}`}>You're on the list.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg">
      <Input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`h-12 flex-1 ${dark ? "bg-white text-foreground" : ""}`}
      />
      <Button type="submit" disabled={loading} className="h-12 px-5 rounded-md bg-accent hover:bg-accent/90 text-white font-semibold">
        {ctaLabel} <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

export default function Blog() {
  const [activeCat, setActiveCat] = useState("All");
  const filtered = activeCat === "All" ? ARTICLES : ARTICLES.filter((a) => a.category === activeCat);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            The Blog
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.02] text-foreground mb-5">
            Building with MOXIEMO.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-3xl mb-8">
            Strategy, content, and founder stories for experts building real businesses.
          </p>
          <EmailCapture ctaLabel="Notify me when we launch" />
        </div>
      </section>

      {/* Filters (sticky) */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => {
            const active = c === activeCat;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-accent text-white" : "bg-muted text-foreground/70 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Featured */}
        <article className="rounded-2xl overflow-hidden bg-[#101116] text-white grid md:grid-cols-[55%_45%]">
          <div className="p-8 md:p-12 flex flex-col justify-between gap-6">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.2em]">Coming Soon</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4 leading-tight">
                She stopped Googling "content ideas" and built a system instead.
              </h2>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                The story behind MOXIEMO — and why every expertise-based founder needs a marketing engine, not a marketing to-do list.
              </p>
              <p className="text-white/50 text-sm mt-5">Founder Stories · 8 min read</p>
            </div>
            <span className="text-white/40 text-sm font-medium">Read when it drops →</span>
          </div>
          <div className="relative min-h-[260px] bg-gradient-to-br from-[#1c1d24] to-[#101116]">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-accent" style={{ width: 64, height: 64 }} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent" />
          </div>
        </article>

        {/* Article grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {filtered.map((a) => (
            <div key={a.title} className="rounded-xl border border-border overflow-hidden bg-card flex flex-col">
              <PlaceholderImage className="aspect-[16/10] rounded-t-xl" />
              <div className="p-5 flex flex-col gap-2 flex-1">
                <span className="text-accent text-xs font-bold uppercase tracking-wider">{a.category}</span>
                <h3 className="text-[18px] font-bold leading-snug text-foreground">{a.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <div className="flex items-center justify-between mt-auto pt-3">
                  <span className="text-xs text-muted-foreground">{a.read}</span>
                  <ComingSoonPill />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom CTA */}
      <section className="bg-muted/60 border-t border-border py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">Be first to read every issue.</h2>
          <p className="text-muted-foreground text-lg mb-7">No spam. Just strategy, stories, and systems worth your time.</p>
          <div className="flex justify-center">
            <EmailCapture ctaLabel="Notify me when we launch" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}