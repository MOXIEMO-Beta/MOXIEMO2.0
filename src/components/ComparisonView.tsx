import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  comparisonGroups,
  Competitor,
  Mark,
} from "@/data/compareData";

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

function MarkCell({ mark }: { mark: Mark }) {
  if (mark === "yes") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B5C]/12 text-[#FF6B5C]">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (mark === "no") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#15171C]/8 text-[#15171C]/55">
        <X className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (mark === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15171C]/8 px-2.5 py-1 text-xs font-semibold text-[#15171C]/70">
        <Minus className="h-3 w-3" /> Partial
      </span>
    );
  }
  return <span className="text-xs font-medium text-[#15171C]/40">n/a</span>;
}

export function ComparisonView({ competitor }: { competitor: Competitor }) {
  const canonicalPath = `/compare/${competitor.slug}`;

  useEffect(() => {
    const prev = document.title;
    document.title = competitor.metaTitle;
    const url = `https://buildwithmoxiemo.com${canonicalPath}`;
    setMeta("name", "description", competitor.metaDescription);
    setMeta("property", "og:title", competitor.metaTitle);
    setMeta("property", "og:description", competitor.metaDescription);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "article");
    setLink("canonical", url);
    return () => {
      document.title = prev;
    };
  }, [competitor, canonicalPath]);

  return (
    <article className="bg-background">
      {/* INTERNAL: verified={String(competitor.verified)} */}
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <div className="mb-6 inline-block rounded-full bg-accent-soft px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-accent md:text-sm">
            Compare
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground md:text-6xl lg:text-7xl">
            {competitor.heroHeadline}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {competitor.heroSubhead}
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[#FF6B5C] px-7 font-semibold text-white hover:bg-[#FF6B5C]/90"
          >
            <Link to="/founding">
              Start free, no credit card required <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="border-b border-border bg-[#F7F5F1]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-[#15171C]/45">
            Placeholder — beta quotes coming soon
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-dashed border-[#15171C]/15 bg-white/60 p-6 text-sm text-[#15171C]/50"
              >
                Beta quote {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            MOXIEMO vs {competitor.name}, feature by feature
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-border bg-[#F7F5F1] px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#15171C]/60 md:grid-cols-[2fr_auto_auto] md:px-8">
              <div>Capability</div>
              <div className="w-20 text-center md:w-28">MOXIEMO</div>
              <div className="w-20 text-center md:w-28">{competitor.name}</div>
            </div>
            {comparisonGroups.map((group) => (
              <div key={group.heading}>
                <div className="border-b border-border bg-[#F7F5F1]/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6B5C] md:px-8">
                  {group.heading}
                </div>
                {group.rows.map((row) => {
                  const moxiemoMark: Mark = competitor.moxiemoOverrides?.[row.id] ?? "yes";
                  const compMark: Mark = competitor.marks[row.id] ?? "no";
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[2fr_auto_auto] md:px-8"
                    >
                      <div className="text-sm text-foreground md:text-base">
                        {row.label}
                        {row.note && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-[#15171C]/8 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#15171C]/55">
                            {row.note}
                          </span>
                        )}
                      </div>
                      <div className="flex w-20 justify-center md:w-28">
                        <MarkCell mark={moxiemoMark} />
                      </div>
                      <div className="flex w-20 justify-center md:w-28">
                        <MarkCell mark={compMark} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative */}
      <section className="border-b border-border bg-[#F7F5F1]">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            The core difference
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
            {competitor.narrative.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            <Link to="/pricing" className="font-semibold text-[#FF6B5C] underline-offset-4 hover:underline">
              See pricing
            </Link>
            <span className="text-[#15171C]/30">·</span>
            <Link to="/founding" className="font-semibold text-[#FF6B5C] underline-offset-4 hover:underline">
              Join the Founding Round
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to build a go-to-market that actually sounds like you?
          </h2>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-foreground px-7 font-semibold text-background hover:bg-foreground/90"
          >
            <Link to="/founding">
              Join as a Founding Member <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </article>
  );
}