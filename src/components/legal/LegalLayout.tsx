import { Children, createContext, isValidElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, ChevronDown, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RouteMetadata } from "@/components/RouteMetadata";
import { Button } from "@/components/ui/button";
import { headingId, LegalHeading, parseLegalContent } from "./legalContent";

export const legalPages = [
  { path: "/terms", label: "Terms", title: "Terms of Service", description: "The terms for using MOXIEMO, including plans, billing, the 30-day guarantee, ownership and how disputes are resolved." },
  { path: "/privacy", label: "Privacy", title: "Privacy Policy", description: "How MOXIEMO collects, uses and protects your information, including AI processing, text messages and your privacy rights." },
  { path: "/cookies", label: "Cookies", title: "Cookie Policy", description: "Every cookie and browser item MOXIEMO uses, what it does, how long it lasts and how to change your choices." },
  { path: "/refunds", label: "Refunds", title: "Refund Policy", description: "MOXIEMO's 30-day guarantee, how cancelling and renewals work, and how to ask for a refund." },
  { path: "/affiliates", label: "Affiliates", title: "Affiliate Terms", description: "Earn 30% for 12 months on every customer you refer to MOXIEMO. The terms of the MOXIEMO affiliate program." },
  { path: "/data-deletion", label: "Data Deletion", title: "Data Deletion", description: "How to delete your MOXIEMO account and data, what we keep and how long it takes." },
];

const LegalContext = createContext(false);
export const useLegalLayout = () => useContext(LegalContext);

export function LegalHeadingLink({ text, children }: { text: string; children?: ReactNode }) {
  const id = headingId(text);
  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Section link copied."); }
    catch { toast.error("Unable to copy the section link."); }
  }
  return <h2 id={id} className="legal-heading group">{children ?? text}<Button variant="ghost" size="icon" className="legal-anchor" onClick={copyLink} aria-label={`Copy link to ${text}`} title="Copy section link"><LinkIcon /></Button></h2>;
}

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return Children.toArray(node).map(child => typeof child === "string" ? child : isValidElement<{ children?: ReactNode }>(child) ? nodeText(child.props.children) : "").join("");
}

function Markdown({ text, callout = false }: { text: string; callout?: boolean }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    h2: ({ children }) => <LegalHeadingLink text={nodeText(children)}>{children}</LegalHeadingLink>,
    p: ({ children }) => {
      const value = nodeText(children);
      const capitalized = /[A-Z]/.test(value) && value === value.toUpperCase();
      return <p className={callout && capitalized ? "legal-callout" : undefined}>{children}</p>;
    },
    table: ({ children }) => <div className="legal-table-scroll" tabIndex={0} role="region" aria-label="Scrollable table"><table>{children}</table></div>,
    a: ({ href, children }) => href?.startsWith("/") ? <Link to={href}>{children}</Link> : <a href={href}>{children}</a>,
  }}>{text}</ReactMarkdown>;
}

export function LegalLayout({ markdown, fallbackTitle, fallbackDate = "", children }: { markdown: string; fallbackTitle?: string; fallbackDate?: string; children?: ReactNode }) {
  const { pathname } = useLocation();
  const page = legalPages.find(item => item.path === pathname) ?? legalPages[0];
  const parsed = useMemo(() => parseLegalContent(markdown), [markdown]);
  const populated = Boolean(markdown.trim());
  const headings: LegalHeading[] = populated ? parsed.headings : Children.toArray(children).flatMap(child => isValidElement<{ heading?: string }>(child) && child.props.heading ? [{ text: child.props.heading, id: headingId(child.props.heading) }] : []);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(headings[0]?.id ?? "");
  const [backToTop, setBackToTop] = useState(false);
  const headingKey = headings.map(heading => heading.id).join("|");
  useEffect(() => {
    setExpanded(false);
    const ids = headingKey.split("|").filter(Boolean);
    const update = () => {
      setBackToTop(window.scrollY > window.innerHeight);
      let current = ids[0] ?? "";
      for (const id of ids) {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    if (window.location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView());
    return () => window.removeEventListener("scroll", update);
  }, [pathname, headingKey]);
  const contents = <ul>{headings.map(heading => <li key={heading.id}><a href={`#${heading.id}`} aria-current={active === heading.id ? "location" : undefined} onClick={() => setExpanded(false)}>{heading.text}</a></li>)}</ul>;
  return <div className="legal-page-shell">
    <RouteMetadata key={pathname} title={`${page.title} | MOXIEMO`} description={page.description} canonicalPath={pathname} />
    <SiteHeader />
    <main className="legal-main">
      <header className="legal-header">
        <h1>{populated ? parsed.title || page.title : fallbackTitle || page.title}</h1>
        {(populated ? parsed.date : fallbackDate) && <p className="legal-date">{populated ? parsed.date : fallbackDate}</p>}
        <nav aria-label="Legal pages" className="legal-pills">{legalPages.map(item => <Button key={item.path} asChild variant="outline" className="legal-pill"><Link to={item.path} aria-current={pathname === item.path ? "page" : undefined}>{item.label}</Link></Button>)}</nav>
        {parsed.intro && <div className="legal-prose"><Markdown text={parsed.intro} callout /></div>}
        {parsed.summary && <section className="legal-summary legal-prose"><Markdown text={parsed.summary} /></section>}
        <div className="legal-mobile-contents"><Button variant="outline" className="legal-contents-toggle" aria-expanded={expanded} aria-controls="legal-mobile-list" onClick={() => setExpanded(value => !value)}>On this page <ChevronDown /></Button><nav id="legal-mobile-list" aria-label="On this page" hidden={!expanded}>{contents}</nav></div>
      </header>
      <div className="legal-columns">
        <aside className="legal-sidebar"><nav aria-label="On this page"><p className="legal-mono">On this page</p>{contents}</nav></aside>
        <article className="legal-prose" aria-label="Legal document"><LegalContext.Provider value={true}>{populated ? <Markdown text={parsed.content} /> : children}</LegalContext.Provider></article>
      </div>
    </main>
    <SiteFooter />
    {backToTop && <Button variant="outline" className="legal-back-top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}><ArrowUp />Back to top</Button>}
  </div>;
}