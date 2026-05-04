import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full px-6 py-20">
        <div className="max-w-[760px] mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-foreground mb-3">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mb-12">{lastUpdated}</p>
          <div className="legal-content">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="py-10 first:pt-0">
      <h2 className="text-[13px] font-bold uppercase tracking-[2px] text-accent border-l-[3px] border-accent pl-3 mb-6">
        {heading}
      </h2>
      <div className="space-y-5 text-[17px] leading-[1.8] text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalDivider() {
  return <hr className="border-0 border-t border-border" />;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 list-disc pl-6 marker:text-accent">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}