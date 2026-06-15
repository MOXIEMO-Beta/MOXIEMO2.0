import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadAuditPdf } from "@/lib/brandAuditPdf";
import { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

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
  advisor_overview?: {
    stage_label?: string;
    posture_label?: string;
    read?: string;
    strengths?: string[];
    focus?: string;
    future_levers?: string;
  } | null;
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
  stage?: string | null;
  posture?: string | null;
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

function cleanDomain(input: string): string {
  let s = (input || "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  return s;
}

function tierHex(tier: string): string {
  const k = tierKey(tier);
  if (k === "dialed") return "#10b981";
  if (k === "developing") return "#f59e0b";
  if (k === "risk") return "#f97316";
  if (k === "critical") return "#ef4444";
  return "#94a3b8";
}

function RingGauge({ score, tier }: { score: number; tier: string }) {
  const size = 200;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = tierHex(tier);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#ECEAE4" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dy="0.05em"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-[#15171C]"
        style={{ fontSize: 56, fontWeight: 700, fontFamily: "Inter, sans-serif" }}
      >
        {score}
      </text>
      <text
        x="50%"
        y="50%"
        dy="2em"
        textAnchor="middle"
        className="fill-[#7a7e8c]"
        style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", fontFamily: "Inter, sans-serif" }}
      >
        / 100
      </text>
    </svg>
  );
}

function BrandRadar({ sections }: { sections: AuditSection[] }) {
  const data = sections.map((s) => ({
    subject: s.label.replace(" & ", " &\n"),
    score: Math.max(0, Math.min(100, s.score)),
  }));
  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="#E4E1DA" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#15171C", fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="#FF6B5C"
            fill="#FF6B5C"
            fillOpacity={0.28}
            strokeWidth={2}
            dot={{ r: 3, fill: "#FF6B5C" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SideNav({
  foundation,
  showup,
  activeId,
  overallScore,
  overallTier,
}: {
  foundation: AuditSection[];
  showup: AuditSection[];
  activeId: string;
  overallScore: number;
  overallTier: string;
}) {
  const renderGroup = (title: string, items: AuditSection[]) => (
    <div className="mb-6">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9aa0ad] mb-2.5 px-2">
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((s) => {
          const id = sectionAnchor(s.label);
          const active = activeId === id;
          const color = tierHex(s.tier);
          return (
            <li key={s.label}>
              <a
                href={`#${id}`}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-[15px] leading-snug transition-colors ${
                  active
                    ? "bg-[#FFF4F2] text-[#15171C] font-semibold"
                    : "text-[#15171C]/80 hover:bg-[#F0EDE6]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="flex-1 break-words">{s.label}</span>
                <span className="text-[13px] tabular-nums text-[#7a7e8c] shrink-0">{s.score}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const overallMeta = TIER_META[tierKey(overallTier)];
  return (
    <nav className="text-sm">
      <div className="mb-5 px-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9aa0ad]">
          Brand audit
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-[#15171C] tabular-nums">{overallScore}</span>
          <span className="text-[13px] text-[#7a7e8c] tabular-nums">/ 100</span>
        </div>
        <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${overallMeta.pill}`}>
          {overallTier}
        </span>
      </div>
      <a
        href="#top"
        className={`block rounded-lg px-2 py-2 text-[15px] font-medium mb-4 ${
          activeId === "top" ? "bg-[#FFF4F2] text-[#15171C] font-semibold" : "text-[#15171C]/80 hover:bg-[#F0EDE6]"
        }`}
      >
        Overview
      </a>
      {renderGroup("Your brand foundation", foundation)}
      {renderGroup("How your brand shows up", showup)}
      <a
        href="#priority-fixes"
        className={`block rounded-lg px-2 py-2 text-[15px] font-medium ${
          activeId === "priority-fixes" ? "bg-[#FFF4F2] text-[#15171C] font-semibold" : "text-[#15171C]/80 hover:bg-[#F0EDE6]"
        }`}
      >
        What I would fix first
      </a>
    </nav>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  useEffect(() => {
    if (!ids.length) return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids.join("|")]);
  return active;
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
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9aa0ad] mb-2">
              What we looked at
            </div>
            <ul className="text-[13px] text-[#9aa0ad] space-y-1 list-disc pl-5">
              {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
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
                className="group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.4fr)_minmax(120px,1fr)_auto] items-center gap-3 md:gap-4 py-2"
              >
                <span className="text-[15px] text-[#15171C] font-medium group-hover:text-[#FF6B5C] leading-snug break-words">{s.label}</span>
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
    <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8 mb-8 scroll-mt-24" id="at-a-glance">
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

function prettyStage(stage?: string | null): string {
  switch ((stage ?? "").toLowerCase()) {
    case "pre_launch": return "Pre-launch";
    case "early": return "Early";
    case "growing": return "Growing";
    case "established": return "Established";
    default: return "";
  }
}
function prettyPosture(p?: string | null): string {
  switch ((p ?? "").toLowerCase()) {
    case "category_creator": return "Category creator";
    case "founder_led_expertise": return "Founder-led expertise";
    case "service_business": return "Service business";
    case "product_saas": return "Product SaaS";
    case "other": return "Other";
    default: return "";
  }
}

function AdvisorOverview({
  overview,
  stage,
  posture,
}: {
  overview?: AuditReport["advisor_overview"];
  stage?: string | null;
  posture?: string | null;
}) {
  const ao = overview ?? {};
  const stageLabel = (ao.stage_label && ao.stage_label.trim()) || prettyStage(stage);
  const postureLabel = (ao.posture_label && ao.posture_label.trim()) || prettyPosture(posture);
  const strengths = Array.isArray(ao.strengths)
    ? ao.strengths.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const focus = (ao.focus ?? "").trim();
  const futureLevers = (ao.future_levers ?? "").trim();
  const read = (ao.read ?? "").trim();

  // If the model returned absolutely nothing usable, skip rendering.
  if (!read && strengths.length === 0 && !focus && !futureLevers) return null;

  return (
    <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8" id="advisor-overview">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {stageLabel && (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#15171C] bg-[#F0EDE6] border border-[#e4e5ea] rounded-full px-2.5 py-1">
            {stageLabel}
          </span>
        )}
        {stageLabel && postureLabel && <span className="text-[#9aa0ad]">·</span>}
        {postureLabel && (
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#15171C] bg-[#F0EDE6] border border-[#e4e5ea] rounded-full px-2.5 py-1">
            {postureLabel}
          </span>
        )}
      </div>
      {read && <p className="text-[17px] leading-snug text-[#15171C] font-medium mb-6">{read}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-3">
            Working in your favor
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] text-[#15171C] leading-snug">
                  <span
                    className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                    aria-hidden
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[#9aa0ad]">Not provided</p>
          )}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B5C] mb-3">
            What matters most now
          </div>
          {focus ? (
            <p className="text-[15px] text-[#15171C] leading-relaxed mb-3">{focus}</p>
          ) : (
            <p className="text-[14px] text-[#9aa0ad] mb-3">Not provided</p>
          )}
          {futureLevers && (
            <p className="text-[13px] text-[#7a7e8c] leading-relaxed">{futureLevers}</p>
          )}
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
  const allSections = [...foundation, ...showup];

  const inputs = data.inputs ?? null;
  const found = report.what_we_found ?? ({} as AuditReport["what_we_found"]);
  const brand = (inputs?.brand_name ?? found.brand_name ?? "").trim();
  const whatYouDo = (inputs?.what_you_do ?? found.what_you_do ?? "").trim();
  const whoYouServe = (inputs?.who_you_serve ?? found.who_you_serve ?? "").trim();
  const competitorListRaw = (
    (inputs?.competitors && inputs.competitors.length > 0
      ? inputs.competitors
      : found.competitors) || []
  ).filter((c): c is string => typeof c === "string" && c.trim().length > 0);
  const competitorList = Array.from(
    new Set(competitorListRaw.map(cleanDomain).filter(Boolean))
  );

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAuditPdf(data);
    } finally {
      setDownloading(false);
    }
  }

  // Derive ranked priorities. Prefer real priority_fixes with non-empty moves;
  // otherwise build from each section's fix_first, ranked by lowest score.
  const derivedPriorities = useMemo(() => {
    const real = (report.priority_fixes ?? [])
      .map((p) => ({
        rank: p.rank,
        move: (p.move ?? "").trim(),
        section: p.section,
        agent: p.agent,
      }))
      .filter((p) => p.move.length > 0);
    if (real.length >= 3) {
      return real.sort((a, b) => a.rank - b.rank);
    }
    return [...allSections]
      .filter((s) => (s.fix_first ?? "").trim().length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((s, i) => ({
        rank: i + 1,
        move: s.fix_first.trim(),
        section: s.label,
        agent: s.agent,
      }));
  }, [report.priority_fixes, allSections]);

  const sectionIds = useMemo(
    () => ["top", ...allSections.map((s) => sectionAnchor(s.label)), "priority-fixes"],
    [allSections],
  );
  const activeId = useActiveSection(sectionIds);

  const paragraphs = (text: string) =>
    text
      .split(/\n{2,}|(?<=[.!?])\s{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <div id="top" />
      <div className="w-[92%] max-w-[1680px] mx-auto px-2 md:px-4 py-8 md:py-10">
        <div className="flex justify-end mb-6">
          <Button onClick={handleDownload} disabled={downloading} variant="outline" className="border-2">
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-12">
          {/* Sticky left nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <SideNav
                foundation={foundation}
                showup={showup}
                activeId={activeId}
                overallScore={data.brand_audit_score}
                overallTier={band.label}
              />
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-8">
            {/* Hero: ring gauge + verdict */}
            <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-10">
              <div className="grid md:grid-cols-[auto_minmax(0,1fr)] gap-8 md:gap-10 items-center">
                <div className="flex flex-col items-center md:items-start">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-3">
                    Brand audit score
                  </div>
                  <RingGauge score={data.brand_audit_score} tier={band.label} />
                  <div
                    className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border mt-4 ${tierClasses(band.label)}`}
                  >
                    {band.label}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] md:text-[16px] leading-snug text-[#15171C] font-medium mb-5">
                    {paragraphs(report.verdict).join(" ")}
                  </p>
                  <p className="text-[13px] text-[#7a7e8c]">
                    Powered by MOXIEMO, the growth system that builds your brand and your go-to-market.
                  </p>
                </div>
              </div>
            </Card>

            {/* Radar */}
            {allSections.length > 0 && (
              <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#15171C] mb-1">Brand health radar</h2>
                <p className="text-sm text-[#7a7e8c] mb-4">
                  The shape of your strengths and gaps across the eight sections.
                </p>
                <BrandRadar sections={allSections} />
              </Card>
            )}

            {/* Advisor overview */}
            <AdvisorOverview
              overview={report.advisor_overview}
              stage={data.stage}
              posture={data.posture}
            />

            {/* At a glance */}
            {allSections.length > 0 && (
              <AtAGlance all={allSections} score={data.brand_audit_score} />
            )}

            {/* What we found */}
            <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7e8c] mb-4">What we found</h2>
              <dl className="grid md:grid-cols-2 gap-x-10 gap-y-5 text-[15px]">
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

            {/* Foundation */}
            {foundation.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-4">
                  Your brand foundation
                </h2>
                <div className="space-y-6">
                  {foundation.map((s) => <SectionCard key={s.label} s={s} />)}
                </div>
              </section>
            )}

            {/* Show up */}
            {showup.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7e8c] mb-4">
                  How your brand shows up
                </h2>
                <div className="space-y-6">
                  {showup.map((s) => <SectionCard key={s.label} s={s} />)}
                </div>
              </section>
            )}

            {/* How you stack up */}
            {report.competitive_read && report.competitive_read.trim() && (
              <Card className="border-2 rounded-2xl shadow-sm bg-white p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#15171C] mb-5">How you stack up</h2>
                <div className="space-y-4 text-[15px] leading-relaxed text-[#15171C]">
                  {paragraphs(report.competitive_read).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Card>
            )}

            {/* Priority fixes (derived) */}
            {derivedPriorities.length > 0 && (
              <Card
                id="priority-fixes"
                className="scroll-mt-24 border-2 rounded-2xl shadow-md bg-white p-6 md:p-8"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-[#15171C] mb-2">
                  What I would fix first
                </h2>
                <p className="text-sm text-[#7a7e8c] mb-6">Your founder to-do list, ranked.</p>
                <ol className="space-y-4">
                  {derivedPriorities.map((p) => (
                    <li
                      key={p.rank}
                      className="flex gap-4 border-t border-[#ECEAE4] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="shrink-0 text-2xl font-bold text-[#FF6B5C] tabular-nums leading-none w-8 pt-0.5">
                        {p.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] text-[#15171C] font-medium leading-snug">
                          {p.move}
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
                  ))}
                </ol>
              </Card>
            )}

            {/* Handoff */}
            <Card className="border-2 rounded-2xl shadow-sm bg-white p-8 md:p-12 text-center">
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
      </div>
    </div>
  );
}