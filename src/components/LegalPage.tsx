import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LegalHeadingLink, LegalLayout, useLegalLayout } from "@/components/legal/LegalLayout";
import terms from "@/content/legal/terms.md?raw";
import privacy from "@/content/legal/privacy.md?raw";
import deletion from "@/content/legal/data-deletion.md?raw";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  const { pathname } = useLocation();
  const markdown = pathname === "/terms" ? terms : pathname === "/privacy" ? privacy : deletion;
  return <LegalLayout markdown={markdown} fallbackTitle={title} fallbackDate={lastUpdated}>{children}</LegalLayout>;
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  const shared = useLegalLayout();
  if (shared) return <section><LegalHeadingLink text={heading} /><div>{children}</div></section>;
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
  const shared = useLegalLayout();
  return shared ? null : <hr className="border-0 border-t border-border" />;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  const shared = useLegalLayout();
  return (
    <ul className={shared ? undefined : "space-y-2 list-disc pl-6 marker:text-accent"}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}