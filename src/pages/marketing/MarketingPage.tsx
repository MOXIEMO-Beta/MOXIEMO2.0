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
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="text-sm font-semibold text-accent mb-4">{eyebrow}</div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-[-0.035em] mb-6 text-foreground">{title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
        </div>
      </section>
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">{children}</main>
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">Ready when you are.</h2>
          <p className="text-muted-foreground mb-7 text-lg">Start your AI Discovery in under a minute.</p>
          <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-12 px-8 rounded-full font-semibold">
            <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <MoxieLogo />
          <p className="text-xs text-muted-foreground">© 2026 MOXIE. One platform. Confident marketing.</p>
        </div>
      </footer>
    </div>
  );
}