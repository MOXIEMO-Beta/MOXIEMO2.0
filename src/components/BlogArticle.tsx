import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export interface BlogArticleProps {
  heroImage?: string;
  heroContent?: ReactNode;
  heroAlt?: string;
  byline?: string;
  closingCta?: ReactNode;
  category: string;
  readTime: string;
  date: string;
  headline: string;
  children: ReactNode;
}

export function BlogArticle({ heroImage, heroContent, heroAlt, byline = "By Karee Laing", closingCta, category, readTime, date, headline, children }: BlogArticleProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <div className="w-full pt-20">
        {heroContent ?? <img
          src={heroImage}
          alt={heroAlt ?? headline}
          className="w-full object-cover rounded-b-2xl"
          style={{ maxHeight: 480, aspectRatio: "16 / 9" }}
        />}
      </div>

      <main className="max-w-[740px] mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
          <span className="inline-block rounded-full bg-accent text-white uppercase font-bold px-3 py-1 text-xs tracking-wider">
            {category}
          </span>
          <span>{readTime}</span>
          <span>·</span>
          <span>{date}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-6 text-center">
          {headline}
        </h1>

        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">
            K
          </div>
          <span className="text-muted-foreground text-[15px]">{byline}</span>
        </div>

        <article
          className="prose-article text-foreground/85"
          style={{ fontSize: 17, lineHeight: 1.9 }}
        >
          {children}
        </article>

        {closingCta}

        {/* Author bio card */}
        <div className="mt-16 rounded-xl border border-border bg-card p-6 flex gap-4 items-start" style={{ borderLeft: "4px solid hsl(var(--accent))" }}>
          <div className="h-14 w-14 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
            K
          </div>
          <div>
            <div className="font-bold text-foreground">Karee Laing</div>
            <div className="text-sm text-muted-foreground mb-2">Founder, MOXIEMO</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Brand strategist with 15 years of experience working with expertise-based founders. She built MOXIEMO because the system she needed didn't exist.
            </p>
          </div>
        </div>

        {!closingCta && <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white h-12 px-7 rounded-full font-semibold">
            <Link to="/auth?mode=signup">Try MOXIEMO free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>}

        <div className="text-center mt-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Building with MOXIEMO
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ marginBottom: 24 }}>{children}</p>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-bold text-foreground" style={{ fontSize: 22, marginTop: 40, marginBottom: 16 }}>
      {children}
    </h2>
  );
}