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

function tierClasses(tier: string) {
  const t = (tier || "").toLowerCase();
  if (t.includes("dialed")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (t.includes("developing")) return "bg-slate-100 text-slate-700 border-slate-200";
  if (t.includes("risk")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (t.includes("critical")) return "bg-[#FFE9E6] text-[#FF6B5C] border-[#FFCFC8]";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((s) => s.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
}

function SectionCard({ s }: { s: AuditSection }) {
  return (
    <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <h3 className="text-xl md:text-2xl font-bold text-[#15171C] tracking-tight">{s.label}</h3>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-bold text-[#15171C]">{s.score}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tierClasses(s.tier)}`}>
            {s.tier}
          </span>
        </div>
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-[#15171C]">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">What is working</div>
          <p>{s.whats_working}</p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">What is holding you back</div>
          <p>{s.whats_holding_back}</p>
        </div>
        {s.evidence?.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">What we looked at</div>
            <ul className="text-sm text-[#7a7e8c] space-y-1 list-disc pl-5">
              {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        {s.competitor_framing && s.competitor_framing.trim() && (
          <div className="bg-[#F7F5F1] border border-[#e4e5ea] rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-1.5">Competitor framing</div>
            <p className="text-[15px]">{s.competitor_framing}</p>
          </div>
        )}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B5C] mb-1.5">What I would do first</div>
          <p>{s.fix_first}</p>
        </div>
        <div className="pt-2">
          <span className="inline-block text-xs text-[#7a7e8c] bg-[#F7F5F1] border border-[#e4e5ea] rounded-full px-3 py-1">
            Handled by {s.agent} inside MOXIEMO.
          </span>
        </div>
      </div>
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

        {/* 2. What we found */}
        <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-4">What we found</h2>
          <dl className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-[15px]">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Brand</dt>
              <dd className="text-[#15171C]">{report.what_we_found?.brand_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">What you do</dt>
              <dd className="text-[#15171C]">{report.what_we_found?.what_you_do || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Who you serve</dt>
              <dd className="text-[#15171C]">{report.what_we_found?.who_you_serve || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a7e8c] mb-1">Competitors</dt>
              <dd className="text-[#15171C]">
                {(report.what_we_found?.competitors || []).join(", ") || "—"}
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
            <ol className="space-y-5">
              {[...report.priority_fixes].sort((a, b) => a.rank - b.rank).map((p) => (
                <li key={p.rank} className="flex gap-4 border-t-2 border-[#F7F5F1] pt-5 first:border-t-0 first:pt-0">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#FF6B5C] text-white font-bold flex items-center justify-center">
                    {p.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] text-[#15171C] font-medium leading-snug">{p.move}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-[#7a7e8c] bg-[#F7F5F1] border border-[#e4e5ea] rounded-full px-2.5 py-0.5">
                        {p.section}
                      </span>
                      <span className="text-xs text-[#FF6B5C] bg-[#FFE9E6] border border-[#FFCFC8] rounded-full px-2.5 py-0.5">
                        {p.agent}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
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