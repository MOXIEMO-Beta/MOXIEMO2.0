import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface MarketingPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  heroContainerClassName?: string;
  heroTitleClassName?: string;
  heroSubtitleClassName?: string;
}

export function MarketingPage({
  eyebrow,
  title,
  subtitle,
  children,
  heroContainerClassName,
  heroTitleClassName,
  heroSubtitleClassName,
}: MarketingPageProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteHeader />
      <section className="border-b border-border">
        <div className={`mx-auto px-6 py-24 text-center ${heroContainerClassName ?? "max-w-5xl"}`}>
          <div className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            {eyebrow}
          </div>
          <h1 className={heroTitleClassName ?? "text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-[-0.04em] mb-6 text-foreground"}>
            {title}
          </h1>
          <p className={heroSubtitleClassName ?? "text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light"}>
            {subtitle}
          </p>
        </div>
      </section>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">{children}</main>
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Ready when you are.</h2>
          <p className="text-muted-foreground mb-7 text-lg">Build your foundation with MOXIEMO Discovery in one guided session.</p>
          <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-12 px-8 rounded-full font-semibold">
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}