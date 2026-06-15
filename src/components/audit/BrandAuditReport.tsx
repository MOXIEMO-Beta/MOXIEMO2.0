import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadAuditPdf } from "@/lib/brandAuditPdf";
import { useState } from "react";

export type AuditSection = {
  label: string;
  score: number;
  tier: string;
  whats_working: string;
  whats_holding_back: string;
  evidence: string[];
  competitor_framing?: string;
  fix_first: string;
  agent: string;
};

export type AuditReport = {
  verdict: string;
  model_type: string;
  what_we_found: {
    brand_name: string;
    what_you_do: string;
    who_you_serve: string;
    competitors: string[];
  };
  sections: AuditSection[];
  competitive_read: string;
  priority_fixes: { rank: number; move: string; agent: string; section: string }[];
  handoff_cta: string;
};

export type AuditResponse = {
  status: "ready" | "review" | string;
  brand_audit_score: number;
  report: AuditReport;
  inputs?: {
    brand_name?: string | null;
    what_you_do?: string | null;
    who_you_serve?: string | null;
    competitors?: string[] | null;
    url?: string | null;
  } | null;
};

const FOUNDATION_ORDER = [
  "Positioning & Differentiation",
  "Messaging & Voice",
  "Brand Story",
  "Purpose & Values",
];
const SHOWUP_ORDER = [
  "Visual Identity",
  "The Face of the Brand",
  "Content & Consistency",
  "Findability & Search",
];

function scoreBand(score: number) {
  if (score >= 80) return { label: "Dialed in", tone: "good" as const };
  if (score >= 60) return { label: "Developing", tone: "neutral" as const };
  if (score >= 40) return { label: "At risk", tone: "warn" as const };
  return { label: "Critical gap", tone: "bad" as const };
}

type TierKey = "dialed" | "developing" | "risk" | "critical" | "unknown";

function tierKey(tier: string): TierKey {
  const t = (tier || "").toLowerCase();
  if (t.includes("dialed")) return "dialed";
  if (t.includes("developing")) return "developing";
  if (t.includes("risk")) return "risk";
  if (t.includes("critical")) return "critical";
  return "unknown";
}

const TIER_META: Record<TierKey, { pill: string; bar: string; track: string }> = {
  dialed:     { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500", track: "bg-emerald-100" },
  developing: { pill: "bg-amber-50 text-amber-700 border-amber-200",      bar: "bg-amber-500",   track: "bg-amber-100" },
  risk:       { pill: "bg-orange-50 text-orange-700 border-orange-200",   bar: "bg-orange-500",  track: "bg-orange-100" },
  critical:   { pill: "bg-[#FFE9E6] text-[#FF6B5C] border-[#FFCFC8]",     bar: "bg-[#FF6B5C]",   track: "bg-[#FFE9E6]" },
  unknown:    { pill: "bg-slate-100 text-slate-700 border-slate-200",     bar: "bg-slate-400",   track: "bg-slate-100" },
};

function tierClasses(tier: string) {
  return TIER_META[tierKey(tier)].pill;
}

function sectionAnchor(label: string) {
  return "section-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function NotProvided() {
  return <span className="text-[#9aa0ad] italic">Not provided</span>;
}

function textOr(value: string | null | undefined) {
  const v = (value ?? "").trim();
  if (!v || v === "—") return <NotProvided />;
  return <>{v}</>;
}

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((s) => s.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
}

function SectionCard({ s }: { s: AuditSection }) {
  const meta = TIER_META[tierKey(s.tier)];
  return (
    <Card id={sectionAnchor(s.label)} className="scroll-mt-24 border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-[#15171C] tracking-tight">{s.label}</h3>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-bold text-[#15171C]">{s.score}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.pill}`}>
            {s.tier}
          </span>
        </div>
      </div>

      <div className="space-y-6 text-[15px] leading-relaxed text-[#15171C]">
        {/* Action first: visual emphasis */}
        <div className="rounded-xl border-2 border-[#FFCFC8] bg-[#FFF4F2] p-4 md:p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B5C] mb-1.5">What I would do first</div>
          <p className="text-[16px] md:text-[17px] font-medium leading-snug text-[#15171C]">{s.fix_first}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">What is working</div>
            <p>{s.whats_working}</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">What is holding you back</div>
            <p>{s.whats_holding_back}</p>
          </div>
        </div>

        {s.competitor_framing && s.competitor_framing.trim() && (
          <div className="bg-[#F7F5F1] border border-[#e4e5ea] rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">Competitor framing</div>
            <p className="text-[15px]">{s.competitor_framing}</p>
          </div>
        )}

        {s.evidence?.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-[#9aa0ad] hover:text-[#7a7e8c] list-none flex items-center gap-1.5">
              <span className="transition-transform group-open:rotate-90">›</span>
              What we looked at
            </summary>
            <ul className="mt-2 text-[13px] text-[#9aa0ad] space-y-1 list-disc pl-7">
              {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </details>
        )}

        <div className="pt-1">
          <span className="inline-block text-xs text-[#7a7e8c] bg-[#F7F5F1] border border-[#e4e5ea] rounded-full px-3 py-1">
            Handled by {s.agent} inside MOXIEMO.
          </span>
        </div>
      </div>
    </Card>
  );
}

function AtAGlance({ all, score }: { all: AuditSection[]; score: number }) {
  const renderGroup = (title: string, items: AuditSection[]) => (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-3">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((s) => {
          const meta = TIER_META[tierKey(s.tier)];
          const pct = Math.max(0, Math.min(100, s.score));
          return (
            <li key={s.label}>
              <a
                href={`#${sectionAnchor(s.label)}`}
                className="group grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_auto] items-center gap-3 md:gap-4 py-2"
              >
                <span className="text-[15px] text-[#15171C] font-medium group-hover:text-[#FF6B5C] truncate">{s.label}</span>
                <span className={`hidden md:block h-1.5 rounded-full ${meta.track} overflow-hidden`}>
                  <span className={`block h-full ${meta.bar}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="flex items-center gap-2 justify-end">
                  <span className="text-sm font-bold text-[#15171C] tabular-nums w-7 text-right">{s.score}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.pill}`}>{s.tier}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const foundation = pickSections(all, FOUNDATION_ORDER);
  const showup = pickSections(all, SHOWUP_ORDER);

  return (
    <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8 mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-[#15171C] mb-1">At a glance</h2>
      <p className="text-sm text-[#7a7e8c] mb-6">Eight sections, one quick read. Tap any row to jump to the detail.</p>
      <div className="grid md:grid-cols-2 gap-8">
        {renderGroup("Your brand foundation", foundation)}
        {renderGroup("How your brand shows up", showup)}
      </div>
      <p className="sr-only">Overall score {score}</p>
    </Card>
  );
}

export function BrandAuditReport({ data }: { data: AuditResponse }) {
  const [downloading, setDownloading] = useState(false);

  if (data?.status === "review") {
    return (
      <div className="min-h-screen bg-[#F7F5F1] py-16 px-4">
        <Card className="max-w-2xl mx-auto border-2 rounded-2xl bg-white p-10 text-center">
          <h2 className="text-2xl font-bold text-[#15171C] mb-3">Your report is being finalized.</h2>
          <p className="text-[#7a7e8c]">Give it a moment. We are tightening a few things so it reads cleanly.</p>
        </Card>
      </div>
    );
  }

  const report = data?.report;
  if (!report) return null;

  const band = scoreBand(data.brand_audit_score);
  const foundation = pickSections(report.sections || [], FOUNDATION_ORDER);
  const showup = pickSections(report.sections || [], SHOWUP_ORDER);
  const allSections = [...foundation, ...showup];

  const inputs = data.inputs ?? null;
  const found = report.what_we_found ?? ({} as AuditReport["what_we_found"]);
  const brand = (inputs?.brand_name ?? found.brand_name ?? "").trim();
  const whatYouDo = (inputs?.what_you_do ?? found.what_you_do ?? "").trim();
  const whoYouServe = (inputs?.who_you_serve ?? found.who_you_serve ?? "").trim();
  const competitorList = (
    (inputs?.competitors && inputs.competitors.length > 0
      ? inputs.competitors
      : found.competitors) || []
  ).filter((c): c is string => typeof c === "string" && c.trim().length > 0);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAuditPdf(data);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button onClick={handleDownload} disabled={downloading} variant="outline" className="border-2">
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </div>

        {/* 1. Verdict */}
        <Card className="border-2 rounded-2xl shadow-sm bg-white p-8 md:p-12 mb-8 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-4">Brand audit score</div>
          <div className="text-7xl md:text-8xl font-bold text-[#FF6B5C] leading-none mb-2">
            {data.brand_audit_score}
            <span className="text-3xl md:text-4xl text-[#7a7e8c] font-medium"> / 100</span>
          </div>
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border mt-2 mb-6 ${tierClasses(band.label)}`}>
            {band.label}
          </div>
          <p className="text-xl md:text-2xl text-[#15171C] font-medium leading-snug max-w-2xl mx-auto">
            {report.verdict}
          </p>
          <p className="text-xs text-[#7a7e8c] mt-6">
            Powered by MOXIEMO, the growth system that builds your brand and your go-to-market.
          </p>
        </Card>

        {/* At a glance */}
        {allSections.length > 0 && (
          <AtAGlance all={allSections} score={data.brand_audit_score} />
        )}

        {/* 2. What we found */}
        <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-4">What we found</h2>
          <dl className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-[15px]">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Brand</dt>
              <dd className="text-[#15171C]">{textOr(brand)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">What you do</dt>
              <dd className="text-[#15171C]">{textOr(whatYouDo)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Who you serve</dt>
              <dd className="text-[#15171C]">{textOr(whoYouServe)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Competitors</dt>
              <dd className="text-[#15171C]">
                {competitorList.length > 0 ? competitorList.join(", ") : <NotProvided />}
              </dd>
            </div>
          </dl>
        </Card>

        {/* 3. Sections */}
        {foundation.length > 0 && (
          <>
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-4 mt-4">
              Your brand foundation
            </h2>
            <div className="space-y-6 mb-10">
              {foundation.map((s) => <SectionCard key={s.label} s={s} />)}
            </div>
          </>
        )}

        {showup.length > 0 && (
          <>
            <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-4 mt-4">
              How your brand shows up
            </h2>
            <div className="space-y-6 mb-10">
              {showup.map((s) => <SectionCard key={s.label} s={s} />)}
            </div>
          </>
        )}

        {/* 4. How you stack up */}
        {report.competitive_read && report.competitive_read.trim() && (
          <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8 mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#15171C] mb-4">How you stack up</h2>
            <p className="text-[15px] leading-relaxed text-[#15171C] whitespace-pre-line">
              {report.competitive_read}
            </p>
          </Card>
        )}

        {/* 5. Priority fixes */}
        {report.priority_fixes?.length > 0 && (
          <Card className="border-2 rounded-2xl shadow-md bg-white p-6 md:p-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#15171C] mb-2">What I would fix first</h2>
            <p className="text-sm text-[#7a7e8c] mb-6">Your founder to-do list, ranked.</p>
            <ol className="space-y-4">
              {[...report.priority_fixes]
                .sort((a, b) => a.rank - b.rank)
                .map((p) => {
                  const move = (p.move ?? "").trim();
                  return (
                    <li
                      key={p.rank}
                      className="flex gap-4 border-t border-[#ECEAE4] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="shrink-0 text-2xl font-bold text-[#FF6B5C] tabular-nums leading-none w-8 pt-0.5">
                        {p.rank}
                      </div>
                      <div className="flex-1">
                        <p className="text-[16px] text-[#15171C] font-medium leading-snug">
                          {move ? move : <NotProvided />}
                        </p>
                        <p className="text-xs text-[#7a7e8c] mt-1.5">
                          <a
                            href={`#${sectionAnchor(p.section || "")}`}
                            className="hover:text-[#FF6B5C] underline-offset-2 hover:underline"
                          >
                            {p.section}
                          </a>
                          {p.agent ? <span> · {p.agent}</span> : null}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </Card>
        )}

        {/* 6. Handoff */}
        <Card className="border-2 rounded-2xl shadow-sm bg-white p-8 md:p-12 mb-8 text-center">
          {report.handoff_cta && (
            <p className="text-xl md:text-2xl text-[#15171C] font-medium leading-snug mb-6 max-w-2xl mx-auto">
              {report.handoff_cta}
            </p>
          )}
          <a href="/signup">
            <Button className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-8 h-12 text-base font-semibold">
              Start with MOXIEMO
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}