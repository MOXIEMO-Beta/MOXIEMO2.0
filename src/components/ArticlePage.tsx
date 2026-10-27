import { useEffect, useState, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export interface ArticleSection {
  id: string;
  tocLabel: string;
  heading: string;
  body: ReactNode;
}

export interface ArticleCTA {
  text: string;
  buttonLabel: string;
  href: string;
}

export interface ArticlePageProps {
  eyebrow: string;
  title: string;
  dek: string;
  sections: ArticleSection[];
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  cta: ArticleCTA;
  extraCtas?: ArticleCTA[];
}

function pad(n: number) {
  return String(n + 1).padStart(2, "0");
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function ArticlePage({
  eyebrow,
  title,
  dek,
  sections,
  metaTitle,
  metaDescription,
  canonicalPath,
  cta,
  extraCtas,
}: ArticlePageProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const previousTitle = useRef<string>("");

  useEffect(() => {
    previousTitle.current = document.title;
    document.title = "MOXIEMO | Built on strategy. Powered to execute.";

    const canonicalUrl = `https://buildwithmoxiemo.com${canonicalPath}`;
    setMeta("name", "description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward, creates the work with your approval, and MOXIE makes sure it happens.");
    setMeta("property", "og:title", "MOXIEMO | Built on strategy. Powered to execute.");
    setMeta("property", "og:description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward, creates the work with your approval, and MOXIE makes sure it happens.");
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", "article");
    setMeta("name", "twitter:title", "MOXIEMO | Built on strategy. Powered to execute.");
    setMeta("name", "twitter:description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward, creates the work with your approval, and MOXIE makes sure it happens.");
    setLink("canonical", canonicalUrl);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: metaDescription,
      mainEntityOfPage: canonicalUrl,
      author: { "@type": "Organization", name: "MOXIEMO" },
      publisher: { "@type": "Organization", name: "MOXIEMO" },
    });
    ld.setAttribute("data-article-jsonld", canonicalPath);
    document.head.appendChild(ld);

    return () => {
      document.title = previousTitle.current;
      ld.remove();
    };
  }, [metaTitle, metaDescription, canonicalPath, title]);

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const handleJump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(id);
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lg:hidden mb-8 rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground"
              aria-expanded={mobileOpen}
            >
              <span>Jump to</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileOpen && (
              <ol className="px-4 pb-4 space-y-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={handleJump(s.id)}
                      className={`flex gap-3 ${activeId === s.id ? "text-accent" : "text-foreground/80"}`}
                    >
                      <span className="tabular-nums text-muted-foreground">
                        {pad(i)}
                      </span>
                      <span>{s.tocLabel}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-12">
            <aside className="hidden lg:block">
              <nav aria-label="Table of contents" className="sticky top-28">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4 font-semibold">
                  Contents
                </div>
                <ol className="space-y-2.5 text-sm">
                  {sections.map((s, i) => {
                    const active = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={handleJump(s.id)}
                          className={`group flex gap-3 leading-snug transition-colors ${
                            active
                              ? "text-accent"
                              : "text-foreground/70 hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`tabular-nums text-xs pt-0.5 ${
                              active ? "text-accent" : "text-muted-foreground"
                            }`}
                          >
                            {pad(i)}
                          </span>
                          <span>{s.tocLabel}</span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </aside>

            <article className="max-w-[68ch]">
              <span className="inline-block rounded-full bg-accent/10 text-accent uppercase font-bold px-3 py-1 text-xs tracking-wider mb-5">
                {eyebrow}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.02em] leading-[1.15] text-foreground mb-6">
                {title}
              </h1>
              <p className="text-lg text-foreground/75 leading-relaxed mb-8">
                {dek}
              </p>
              <div className="h-px bg-border w-full mb-12" />

              <div
                className="space-y-14"
                style={{ fontSize: 17, lineHeight: 1.8 }}
              >
                {sections.map((s, i) => (
                  <section key={s.id} id={s.id} className="scroll-mt-28">
                    <div className="text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3 tabular-nums">
                      {pad(i)}
                    </div>
                    <h2 className="text-2xl md:text-[1.7rem] font-bold tracking-[-0.01em] leading-[1.25] text-foreground mb-5">
                      {s.heading}
                    </h2>
                    <div className="text-foreground/85 space-y-5">{s.body}</div>
                  </section>
                ))}
              </div>

              <div className="mt-20 rounded-2xl border border-border bg-card p-8 md:p-10">
                <p className="text-lg md:text-xl text-foreground leading-snug mb-6 font-semibold tracking-[-0.01em]">
                  {cta.text}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white h-12 px-7 rounded-full font-semibold"
                  >
                    <Link to={cta.href}>
                      {cta.buttonLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {extraCtas?.map((c) => (
                    <Button
                      key={c.href}
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 px-7 rounded-full font-semibold"
                    >
                      <Link to={c.href}>
                        {c.buttonLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function ArticleP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function ArticleH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-bold text-foreground text-lg mt-6 mb-3">{children}</h3>
  );
}

export function ArticleList({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2">{children}</ul>;
}
