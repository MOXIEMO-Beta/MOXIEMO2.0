import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface MarketingPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function MarketingPage({ eyebrow, title, subtitle, children }: MarketingPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <section className="bg-gradient-warm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-4 font-bold">{eyebrow}</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6 text-foreground">{title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">{subtitle}</p>
        </div>
      </section>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">{children}</main>
      <section className="border-t border-border bg-muted/40 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-4">READY WHEN YOU ARE.</h2>
          <p className="text-muted-foreground mb-6 font-light">Start your AI Discovery in under a minute.</p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 rounded-lg font-semibold">
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MoxieLogo />
          <p className="text-xs text-muted-foreground font-light">© 2026 MOXIE. One platform. Confident marketing.</p>
        </div>
      </footer>
    </div>
  );
}