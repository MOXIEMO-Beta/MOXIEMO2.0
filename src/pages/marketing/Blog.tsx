import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import article1 from "@/assets/blog/article-1-marketing.jpg";
import article2 from "@/assets/blog/article-2-content.jpg";
import article3 from "@/assets/blog/article-3-platform.jpg";
import article4 from "@/assets/blog/article-4-linkedin.jpg";
import article5 from "@/assets/blog/article-5-ai-slop.jpg";
import article6 from "@/assets/blog/article-6-tool-stack.jpg";
import article7 from "@/assets/blog/article-7-optimism.jpg";
import article8 from "@/assets/blog/article-8-ai-everywhere.jpg";
import article9 from "@/assets/blog/article-9-real-founder.jpg";
import article10 from "@/assets/blog/article-10-second-job.jpg";
const article11Asset = { url: "/05-how-it-works.png" };
import { MoxieBlogImage } from "@/components/MoxieBlogImage";
import { MOXIE_POST_TITLE, MOXIE_POST_DESCRIPTION } from "@/pages/blog/MyWebsiteCouldNotExplainMoxie";

const REAL_ARTICLES: Record<string, { image: string; href: string; date: string }> = {
  [MOXIE_POST_TITLE]: {
    image: "",
    href: "/blog/my-website-could-not-explain-moxie",
    date: "October 29, 2026",
  },
  "The AI Marketing Stack Advice Nobody Gives Solo Founders": {
    image: article11Asset.url,
    href: "/blog/ai-marketing-stack-advice-solo-founders",
    date: "August 5, 2026",
  },
  "Why Your Marketing Feels Like a Second Job (And What to Do About It)": {
    image: article10,
    href: "/blog/why-your-marketing-feels-like-a-second-job",
    date: "June 29, 2026",
  },
  "What Happens When a Real Founder Sits Down with Your Product": {
    image: article9,
    href: "/blog/what-happens-when-a-real-founder-sits-down-with-your-product",
    date: "June 24, 2026",
  },
  "AI is everywhere. Here is how you still stand out.": {
    image: article8,
    href: "/blog/ai-everywhere-how-you-stand-out",
    date: "June 16, 2026",
  },
  "The Case for Optimism: Why the Best Time to Build Is Right Now": {
    image: article7,
    href: "/blog/case-for-optimism-best-time-to-build",
    date: "May 13, 2026",
  },
  "Why Your Marketing Isn't Working (It's Not the Tools)": {
    image: article1,
    href: "/blog/why-marketing-isnt-working",
    date: "May 6, 2026",
  },
  "How to Know Exactly What to Post Without Guessing": {
    image: article2,
    href: "/blog/how-to-know-what-to-post",
    date: "May 6, 2026",
  },
  "Building a Tech Platform at the Peak of AI: What Nobody Prepared Me For": {
    image: article3,
    href: "/blog/building-a-tech-platform-at-peak-of-ai",
    date: "May 6, 2026",
  },
  "Why Your LinkedIn Posts Aren't Landing (And the Fix Takes 10 Minutes)": {
    image: article4,
    href: "/blog/why-linkedin-posts-arent-landing",
    date: "May 6, 2026",
  },
  "AI Slop vs. AI Strategy: The Difference Is Your Foundation": {
    image: article5,
    href: "/blog/ai-slop-vs-ai-strategy",
    date: "May 6, 2026",
  },
  "The 6-Tool Stack Killing Your Productivity (And What Replaces It)": {
    image: article6,
    href: "/blog/six-tool-stack-killing-productivity",
    date: "May 6, 2026",
  },
};

const CATEGORIES = [
  "All",
  "Strategy",
  "Content",
  "Founder Stories",
  "Founder Mindset",
  "AI Marketing",
  "Tools & Systems",
  "Case Studies",
];

const ARTICLES = [
  { category: "Founder Stories", title: MOXIE_POST_TITLE, excerpt: MOXIE_POST_DESCRIPTION, read: "4 min read" },
  { category: "Strategy", title: "The AI Marketing Stack Advice Nobody Gives Solo Founders", excerpt: "Every AI marketing guide says the same thing: build a lean stack of six to eight tools. Good advice, written for a team you do not have. Here is what the stack conversation misses for expertise-based founders.", read: "5 min read" },
  { category: "Strategy", title: "Why Your Marketing Feels Like a Second Job (And What to Do About It)", excerpt: "You built a real business. So why does your marketing still feel like survival? The problem is not discipline. It is structure.", read: "6 min read" },
  { category: "Founder Mindset", title: "What Happens When a Real Founder Sits Down with Your Product", excerpt: "She would still pay for it. The features worked. And she still said it felt like work. That sentence is the most valuable thing anyone has said to me about this product.", read: "6 min read" },
  { category: "AI Marketing", title: "AI is everywhere. Here is how you still stand out.", excerpt: "AI is here to stay, and yes, the slop is real. That does not mean you have to blend in. A few honest strategies for staying original while using the same tools as everyone else.", read: "6 min read" },
  { category: "Founder Mindset", title: "The Case for Optimism: Why the Best Time to Build Is Right Now", excerpt: "Not the 'good vibes only' version. The kind of optimism that comes from looking clearly at what's in front of you and deciding the conditions are better than they've ever been.", read: "5 min read" },
  { category: "Strategy", title: "Why Your Marketing Isn't Working (It's Not the Tools)", excerpt: "Most founders aren't failing at marketing because they're using the wrong platforms. They're failing because they don't have a strategy for the tools to execute. The fix starts before you open LinkedIn.", read: "7 min read" },
  { category: "Content", title: "How to Know Exactly What to Post Without Guessing", excerpt: "Content paralysis isn't a creativity problem. It's a positioning problem. When you know your content pillars, your ideal client, and your voice, the blank screen disappears. Here's the system.", read: "6 min read" },
  { category: "Founder Stories", title: "Building a Tech Platform at the Peak of AI: What Nobody Prepared Me For", excerpt: "The honest version of what it's like to build a software platform as a brand strategist with no engineering background, in the middle of the most significant technology shift in a generation.", read: "8 min read" },
  { category: "Content", title: "Why Your LinkedIn Posts Aren't Landing (And the Fix Takes 10 Minutes)", excerpt: "You're posting consistently. You know your stuff. And yet, crickets. The problem isn't your content. It's your hook.", read: "9 min read" },
  { category: "AI Marketing", title: "AI Slop vs. AI Strategy: The Difference Is Your Foundation", excerpt: "Generic AI content isn't the AI's fault. It's the briefing. The prompts only get as good as the brand architecture behind them.", read: "7 min read" },
  { category: "Tools & Systems", title: "The 6-Tool Stack Killing Your Productivity (And What Replaces It)", excerpt: "You didn't plan this. But somewhere between Buffer, ConvertKit, Notion, and three other subscriptions, you became the integration layer.", read: "8 min read" },
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
    <div className="min-h-dvh bg-background flex flex-col">
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
        <Link to="/blog/my-website-could-not-explain-moxie" className="block rounded-2xl overflow-hidden bg-[#101116] text-white grid md:grid-cols-[55%_45%] hover:opacity-95 transition">
          <div className="p-8 md:p-12 flex flex-col justify-between gap-6">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-[0.2em]">Featured</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4 leading-tight">
                {MOXIE_POST_TITLE}
              </h2>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                {MOXIE_POST_DESCRIPTION}
              </p>
              <p className="text-white/50 text-sm mt-5">Founder Stories · October 29, 2026 · 4 min read</p>
            </div>
            <span className="text-accent text-sm font-medium">Read the story →</span>
          </div>
          <div className="relative min-h-[260px]">
            <MoxieBlogImage className="absolute inset-0 w-full h-full" />
          </div>
        </Link>

        {/* Article grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {filtered.map((a) => {
            const real = REAL_ARTICLES[a.title];
            const inner = (
              <div className="rounded-xl border border-border overflow-hidden bg-card flex flex-col h-full hover:shadow-md transition">
                {a.title === MOXIE_POST_TITLE ? (
                  <MoxieBlogImage className="aspect-[16/10] w-full" />
                ) : real ? (
                  <img src={real.image} alt={a.title} className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <PlaceholderImage className="aspect-[16/10] rounded-t-xl" />
                )}
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <span className="text-accent text-xs font-bold uppercase tracking-wider">{a.category}</span>
                  <h3 className="text-[18px] font-bold leading-snug text-foreground">{a.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <span className="text-xs text-muted-foreground">{a.read}{real ? ` · ${real.date}` : ""}</span>
                    {real ? (
                      <span className="text-accent text-xs font-bold uppercase tracking-wider">Read →</span>
                    ) : (
                      <ComingSoonPill />
                    )}
                  </div>
                </div>
              </div>
            );
            return real ? (
              <Link key={a.title} to={real.href} className="block">{inner}</Link>
            ) : (
              <div key={a.title}>{inner}</div>
            );
          })}
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