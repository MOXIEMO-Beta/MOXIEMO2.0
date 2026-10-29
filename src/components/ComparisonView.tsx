import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ROWS,
  MOXIEMO,
  COMPARISONS,
  Comparison,
  CellValue,
} from "@/data/comparisons";

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

function Cell({ value }: { value: CellValue }) {
  if (value === "yes") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B5C]/12 text-[#FF6B5C]">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#15171C]/8 text-[#15171C]/45">
        <span className="block h-[2px] w-3 rounded-full bg-current" aria-hidden />
        <span className="sr-only">No</span>
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15171C]/8 px-2.5 py-1 text-xs font-semibold text-[#15171C]/70">
        <span className="block h-2 w-2 rounded-full bg-[#15171C]/45" aria-hidden />
        Partial
      </span>
    );
  }
  return (
    <span className="block max-w-[18ch] text-xs font-medium leading-snug text-[#15171C]/70">
      {value}
    </span>
  );
}

function SectionBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {heading}
      </h3>
      <p className="text-lg leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

export function ComparisonView({ comparison }: { comparison: Comparison }) {
  const canonicalPath = `/compare/${comparison.slug}`;

  useEffect(() => {
    const prev = document.title;
    const title = "MOXIEMO | Built on strategy. Powered to execute.";
    document.title = title;
    const url = `https://buildwithmoxiemo.com${canonicalPath}`;
    setMeta("name", "description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward and creates the work with your approval. MOXIE, your growth companion, makes sure it happens.");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward and creates the work with your approval. MOXIE, your growth companion, makes sure it happens.");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", "MOXIEMO is a strategy-led AI marketing system. It finds what moves your brand forward and creates the work with your approval. MOXIE, your growth companion, makes sure it happens.");
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "article");
    setLink("canonical", url);
    return () => {
      document.title = prev;
    };
  }, [comparison, canonicalPath]);

  // Group rows by group preserving order
  const groups: { group: string; rows: typeof ROWS }[] = [];
  for (const row of ROWS) {
    const g = groups.find((x) => x.group === row.group);
    if (g) g.rows.push(row);
    else groups.push({ group: row.group, rows: [row] });
  }

  return (
    <article className="bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-10 text-center md:pb-28 md:pt-14">
          <div className="mb-6 inline-block rounded-full bg-accent-soft px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-accent md:text-sm">
            Compare
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground md:text-6xl lg:text-7xl">
            {comparison.heroHeadline}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {comparison.heroSubhead}
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[#FF6B5C] px-7 font-semibold text-white hover:bg-[#FF6B5C]/90"
          >
            <Link to="/founding">
              Join as a Founding Member <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-b border-border bg-[#F7F5F1]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            MOXIEMO vs {comparison.competitor}, side by side
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#15171C]/10 bg-white">
            {/* Header */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-[#15171C]/10 bg-[#15171C] px-4 py-4 text-white md:px-6">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Capability
              </div>
              <div className="text-center text-sm font-bold tracking-tight md:text-base">
                MOXIEMO
              </div>
              <div className="text-center text-sm font-bold tracking-tight md:text-base">
                {comparison.competitor}
              </div>
            </div>

            {groups.map((g) => (
              <div key={g.group}>
                <div className="border-b border-[#15171C]/10 bg-[#F7F5F1] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#15171C]/70 md:px-6">
                  {g.group}
                </div>
                {g.rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-[#15171C]/8 px-4 py-4 last:border-b-0 md:px-6"
                  >
                    <div className="text-sm font-medium text-foreground md:text-[15px]">
                      {row.label}
                    </div>
                    <div className="flex justify-center">
                      <Cell value={MOXIEMO[row.id]} />
                    </div>
                    <div className="flex justify-center">
                      <Cell value={comparison.values[row.id] ?? "no"} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[#15171C]/50">
            Verify competitor pricing and features before relying on this comparison.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
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

      {/* Narrative */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl space-y-14 px-6 py-20">
          <SectionBlock heading={`How ${comparison.competitor} works`} body={comparison.sections.howCompetitor} />
          <SectionBlock heading="How MOXIEMO works" body={comparison.sections.howMoxiemo} />
          <SectionBlock heading="The honest difference" body={comparison.sections.honestDifference} />
          <SectionBlock heading="The honest limitation of each" body={comparison.sections.honestLimitation} />
          <SectionBlock heading="Where MOXIEMO fits" body={comparison.sections.whereItFits} />
        </div>
      </section>

      {/* Continue Reading */}
      <section className="border-b border-border bg-[#F7F5F1]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Continue Reading
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {COMPARISONS.filter((c) => c.slug !== comparison.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/compare/${c.slug}`}
                className="group block rounded-2xl border border-[#15171C]/10 bg-white p-6 transition-colors hover:border-[#FF6B5C]/40 hover:bg-white"
              >
                <div className="mb-3 inline-block rounded-full bg-[#FF6B5C]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B5C]">
                  Comparison
                </div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    MOXIEMO vs {c.competitor}
                  </h3>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#15171C]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#FF6B5C]" />
                </div>
                <p className="text-sm leading-relaxed text-[#15171C]/65">{c.oneLiner}</p>
              </Link>
            ))}
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
