import { Button } from "@/components/ui/button";
import { downloadAuditPdf } from "@/lib/brandAuditPdf";
import { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────
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

export type GapHero = {
  strategy_says: string;
  site_says: string;
  gap_verdict: string;
};

export type AuditReport = {
  verdict: string;
  model_type: string;
  what_we_found?: {
    brand_name?: string;
    what_you_do?: string;
    who_you_serve?: string;
    competitors?: string[];
  };
  sections: AuditSection[];
  competitive_read?: string;
  priority_fixes?: { rank: number; move: string; agent: string; section: string }[];
  handoff_cta?: string;
  advisor_overview?: {
    stage_label?: string;
    posture_label?: string;
    read?: string;
    strengths?: string[];
    focus?: string;
    future_levers?: string;
  } | null;
  gap_hero?: GapHero | null;
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
  /** Optional. Full name of the signed-in user for the PDF cover "Prepared for" line. */
  prepared_for?: string | null;
};

// ─── Design tokens (matches Strategy + Kit PDFs) ─────────────────────
// Fonts: Space Grotesk (headings), Inter (body).
// Coral #FF6B5C, ink #15171C, paper #F7F5F1.
const HEADING = "'Space Grotesk', 'Inter', sans-serif";
const BODY = "'Inter', system-ui, sans-serif";
const CORAL = "#FF6B5C";
const INK = "#15171C";
const PAPER = "#F7F5F1";
const MUTED = "#7a7e8c";
const BORDER = "#e4e5ea";

// Status: strong = green, at risk = amber, critical gap = red.
type Status = "strong" | "atRisk" | "critical" | "unknown";

function scoreStatus(score: number): Status {
  if (score >= 70) return "strong";
  if (score >= 45) return "atRisk";
  if (score >= 0) return "critical";
  return "unknown";
}

function tierStatus(tier: string): Status {
  const t = (tier || "").toLowerCase();
  if (t.includes("dialed") || t.includes("developing")) return "strong";
  if (t.includes("risk") || t.includes("developing")) return "atRisk";
  if (t.includes("critical")) return "critical";
  return "unknown";
}

function overallLabel(score: number): string {
  if (score >= 80) return "Dialed in";
  if (score >= 60) return "Developing";
  if (score >= 40) return "At risk";
  return "Critical gap";
}

function statusColor(s: Status): string {
  if (s === "strong") return "#3fae6a";
  if (s === "atRisk") return "#f59e0b";
  if (s === "critical") return "#ef4444";
  return "#94a3b8";
}

function statusPill(s: Status): { bg: string; fg: string; br: string } {
  if (s === "strong") return { bg: "#EAF7EE", fg: "#237a44", br: "#BEE5CC" };
  if (s === "atRisk") return { bg: "#FFF5E1", fg: "#8B5A00", br: "#F5D999" };
  if (s === "critical") return { bg: "#FDECEA", fg: "#B12C1C", br: "#F6C3BC" };
  return { bg: "#F1F5F9", fg: INK, br: BORDER };
}

// ─── Section ordering (grounded-8 kept intact) ───────────────────────
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

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((s) => s.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
}

function sectionAnchor(label: string) {
  return "section-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Client-side gap-hero fallback for legacy audits missing gap_hero on the row.
function fallbackGapHero(report: AuditReport, score: number): GapHero {
  const positioning = (report.sections || []).find((s) => s.label === "Positioning & Differentiation");
  const firstFix = report.priority_fixes?.[0]?.move ?? "";
  const focus = (report.advisor_overview?.focus ?? "").split(/(?<=[.!?])\s+/)[0] ?? "";
  return {
    strategy_says:
      "Your strategy is not documented in MOXIEMO yet, so the audit reads your site on its own terms.",
    site_says:
      positioning?.whats_holding_back?.trim() ||
      report.verdict?.trim() ||
      `Your site scores ${score}/100 on this pass.`,
    gap_verdict:
      focus?.trim() ||
      firstFix?.trim() ||
      "Close the gap between what you know and what your brand says first.",
  };
}

// ─── Gap Hero (Part C) ───────────────────────────────────────────────
function GapHero({
  gap,
  strongest,
  weakest,
}: {
  gap: GapHero;
  strongest: AuditSection | null;
  weakest: AuditSection | null;
}) {
  return (
    <section aria-labelledby="gap-hero-heading" style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase" }}>
          00 · The Gap
        </div>
        <h2 id="gap-hero-heading" style={{ fontFamily: HEADING, fontSize: 28, fontWeight: 700, color: INK, margin: "6px 0 0" }}>
          Strategy vs. Presence
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div
          style={{
            background: "#FFF4F2",
            border: `1px solid #FFCFC8`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: CORAL, textTransform: "uppercase", marginBottom: 8 }}>
            Your Strategy Says
          </div>
          <p style={{ fontFamily: HEADING, fontSize: 17, fontWeight: 500, color: INK, lineHeight: 1.45, margin: 0 }}>
            {gap.strategy_says}
          </p>
        </div>
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, textTransform: "uppercase", marginBottom: 8 }}>
            Your Site Says
          </div>
          <p style={{ fontFamily: HEADING, fontSize: 17, fontWeight: 500, color: INK, lineHeight: 1.45, margin: 0 }}>
            {gap.site_says}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          borderLeft: `4px solid ${CORAL}`,
          padding: "16px 20px",
          background: "#FFFFFF",
          border: `1px solid ${BORDER}`,
          borderLeftWidth: 4,
        }}
      >
        <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: CORAL, textTransform: "uppercase", marginBottom: 6 }}>
          The Gap
        </div>
        <p style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 600, color: INK, lineHeight: 1.35, margin: 0 }}>
          {gap.gap_verdict}
        </p>
      </div>

      {(strongest || weakest) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
          {strongest && (
            <StatReadout label="Strongest" section={strongest} status="strong" />
          )}
          {weakest && (
            <StatReadout label="Weakest" section={weakest} status={scoreStatus(weakest.score)} />
          )}
        </div>
      )}
    </section>
  );
}

function StatReadout({ label, section, status }: { label: string; section: AuditSection; status: Status }) {
  const dot = statusColor(status);
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: dot, display: "inline-block" }} />
        {label}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontFamily: HEADING, fontSize: 16, fontWeight: 600, color: INK }}>{section.label}</div>
        <div style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{section.score}</div>
      </div>
    </div>
  );
}

// ─── At A Glance + Radar (Part D) ────────────────────────────────────
function AtAGlanceAndRadar({ foundation, showup }: { foundation: AuditSection[]; showup: AuditSection[] }) {
  const all = [...foundation, ...showup];
  const data = all.map((s) => ({
    subject: s.label.replace(" & ", " &\n"),
    score: Math.max(0, Math.min(100, s.score)),
  }));
  return (
    <section style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, marginBottom: 32 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase" }}>
          01 · At A Glance
        </div>
        <h2 style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: INK, margin: "4px 0 0" }}>
          Eight Sections, One Read
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 28 }} className="brand-audit-glance-grid">
        <div>
          <ListGroup title="Your Brand Foundation" items={foundation} />
          <div style={{ height: 16 }} />
          <ListGroup title="How Your Brand Shows Up" items={showup} />
        </div>
        <div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="78%">
                <PolarGrid stroke="#ECEAE4" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: INK, fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke={CORAL} fill={CORAL} fillOpacity={0.28} strokeWidth={2} dot={{ r: 3, fill: CORAL }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .brand-audit-glance-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function ListGroup({ title, items }: { title: string; items: AuditSection[] }) {
  return (
    <div>
      <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((s, i) => {
          const st = scoreStatus(s.score);
          const dot = statusColor(st);
          return (
            <li
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
              }}
            >
              <a
                href={`#${sectionAnchor(s.label)}`}
                style={{ display: "flex", alignItems: "center", gap: 10, color: INK, textDecoration: "none", flex: 1, minWidth: 0 }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 999, background: dot, flexShrink: 0 }} />
                <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 500 }}>{s.label}</span>
              </a>
              <span style={{ fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{s.score}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Section template (Part E) ───────────────────────────────────────
function SectionCard({ sec, indexLabel }: { sec: AuditSection; indexLabel: string }) {
  const st = scoreStatus(sec.score);
  const pill = statusPill(st);
  const statusText = overallLabel(sec.score);
  return (
    <article
      id={sectionAnchor(sec.label)}
      style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, marginBottom: 20, scrollMarginTop: 96 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase", marginBottom: 4 }}>
            {indexLabel}
          </div>
          <h3 style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>{sec.label}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: HEADING, fontSize: 26, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>{sec.score}</div>
          <span
            style={{
              fontFamily: BODY,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "5px 10px",
              borderRadius: 999,
              background: pill.bg,
              color: pill.fg,
              border: `1px solid ${pill.br}`,
              whiteSpace: "nowrap",
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "#237a44", textTransform: "uppercase", marginBottom: 6 }}>
          What's Working
        </div>
        <p style={{ fontFamily: BODY, fontSize: 14.5, lineHeight: 1.55, color: INK, margin: 0 }}>{sec.whats_working}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "#B12C1C", textTransform: "uppercase", marginBottom: 6 }}>
          What's Holding You Back
        </div>
        <p style={{ fontFamily: BODY, fontSize: 14.5, lineHeight: 1.55, color: INK, margin: 0 }}>{sec.whats_holding_back}</p>
      </div>

      <div
        style={{
          background: "#FFF4F2",
          border: `1px solid #FFCFC8`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontFamily: BODY, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase", marginBottom: 6 }}>
          Fix First
        </div>
        <p style={{ fontFamily: HEADING, fontSize: 16, fontWeight: 500, color: INK, lineHeight: 1.45, margin: 0 }}>
          {sec.fix_first}
        </p>
      </div>

      <p style={{ fontFamily: BODY, fontSize: 11, color: MUTED, marginTop: 14, marginBottom: 0 }}>
        Handled by {sec.agent} inside MOXIEMO.
      </p>
    </article>
  );
}

// ─── Fix First list + CTA (Part F) ───────────────────────────────────
function FixFirstList({ items }: { items: { rank: number; move: string; section: string; agent: string }[] }) {
  return (
    <section id="priority-fixes" style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28, marginBottom: 24, scrollMarginTop: 96 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase" }}>
          What I'd Fix First
        </div>
        <h2 style={{ fontFamily: HEADING, fontSize: 24, fontWeight: 700, color: INK, margin: "4px 0 0" }}>
          Your founder to-do list, ranked.
        </h2>
      </div>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((p, i) => (
          <li
            key={p.rank}
            style={{ display: "flex", gap: 18, padding: "16px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}
          >
            <div style={{ fontFamily: HEADING, fontSize: 26, fontWeight: 700, color: CORAL, minWidth: 32, fontVariantNumeric: "tabular-nums" }}>
              {p.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: HEADING, fontSize: 17, fontWeight: 500, color: INK, lineHeight: 1.4, margin: 0 }}>{p.move}</p>
              <p style={{ fontFamily: BODY, fontSize: 12, color: MUTED, marginTop: 6, marginBottom: 0 }}>
                <a href={`#${sectionAnchor(p.section)}`} style={{ color: MUTED, textDecoration: "none" }}>
                  {p.section}
                </a>
                {p.agent ? ` · ${p.agent}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CtaClose({ handoff }: { handoff?: string }) {
  return (
    <section
      style={{
        background: INK,
        color: "#FFFFFF",
        borderRadius: 14,
        padding: 40,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: CORAL, textTransform: "uppercase", marginBottom: 10 }}>
        Close the Gap
      </div>
      <h2 style={{ fontFamily: HEADING, fontSize: 30, fontWeight: 700, color: "#FFFFFF", margin: "0 0 12px", lineHeight: 1.2 }}>
        Want the full picture?
      </h2>
      <p style={{ fontFamily: BODY, fontSize: 15, color: "rgba(255,255,255,0.75)", margin: "0 auto 22px", maxWidth: 520, lineHeight: 1.55 }}>
        Your audit shows where your website stands. MOXIEMO discovery adds your goals, audience and offer, then builds the plan and the work.
      </p>
      <a
        href="/founding"
        style={{
          display: "inline-block",
          background: CORAL,
          color: "#FFFFFF",
          fontFamily: HEADING,
          fontWeight: 600,
          fontSize: 15,
          padding: "12px 26px",
          borderRadius: 999,
          textDecoration: "none",
        }}
      >
        Claim a first-100 spot
      </a>
      <p style={{ fontFamily: BODY, fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "14px 0 0" }}>
        50% off any plan for our first 100 customers.
      </p>
    </section>
  );
}

function AuditFooter() {
  return (
    <div style={{ textAlign: "center", marginTop: 32, marginBottom: 8, fontFamily: BODY, fontSize: 10, letterSpacing: "0.16em", color: MUTED, textTransform: "uppercase" }}>
      Brand Audit · Powered by MOXIEMO · buildwithmoxiemo.com
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
export function BrandAuditReport({ data }: { data: AuditResponse }) {
  const [downloading, setDownloading] = useState(false);

  const report = data?.report;
  if (!report) return null;

  const foundation = pickSections(report.sections || [], FOUNDATION_ORDER);
  const showup = pickSections(report.sections || [], SHOWUP_ORDER);
  const allSections = [...foundation, ...showup];

  const gap = report.gap_hero && report.gap_hero.gap_verdict
    ? report.gap_hero
    : fallbackGapHero(report, data.brand_audit_score);

  const sortedByScore = [...allSections].sort((a, b) => b.score - a.score);
  const strongest = sortedByScore[0] ?? null;
  const weakest = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  const derivedPriorities = useMemo(() => {
    const real = (report.priority_fixes ?? [])
      .map((p) => ({ rank: p.rank, move: (p.move ?? "").trim(), section: p.section, agent: p.agent }))
      .filter((p) => p.move.length > 0);
    if (real.length >= 3) return real.sort((a, b) => a.rank - b.rank);
    return [...allSections]
      .filter((s) => (s.fix_first ?? "").trim().length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((s, i) => ({ rank: i + 1, move: s.fix_first.trim(), section: s.label, agent: s.agent }));
  }, [report.priority_fixes, allSections]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAuditPdf(data);
    } finally {
      setDownloading(false);
    }
  }

  const foundationStart = 1;
  const showupStart = foundationStart + foundation.length;

  return (
    <div style={{ background: PAPER, minHeight: "100%" }}>
      <div style={{ width: "94%", maxWidth: 1180, margin: "0 auto", padding: "24px 8px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: CORAL, textTransform: "uppercase" }}>
              Brand Audit
            </div>
            <h1 style={{ fontFamily: HEADING, fontSize: 30, fontWeight: 700, color: INK, margin: "4px 0 0", letterSpacing: "-0.01em" }}>
              Where your brand stands. What to fix first.
            </h1>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="outline"
            style={{ borderColor: INK, color: INK, borderRadius: 999, height: 40, fontFamily: HEADING, fontWeight: 600 }}
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </div>

        <GapHero gap={gap} strongest={strongest} weakest={weakest} />

        {allSections.length > 0 && <AtAGlanceAndRadar foundation={foundation} showup={showup} />}

        {foundation.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: MUTED, textTransform: "uppercase", marginBottom: 12 }}>
              02 · Your Brand Foundation
            </div>
            {foundation.map((s, i) => (
              <SectionCard
                key={s.label}
                sec={s}
                indexLabel={`${String(foundationStart + i).padStart(2, "0")} · ${s.label.toUpperCase()}`}
              />
            ))}
          </section>
        )}

        {showup.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: BODY, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: MUTED, textTransform: "uppercase", marginBottom: 12 }}>
              03 · How Your Brand Shows Up
            </div>
            {showup.map((s, i) => (
              <SectionCard
                key={s.label}
                sec={s}
                indexLabel={`${String(showupStart + i).padStart(2, "0")} · ${s.label.toUpperCase()}`}
              />
            ))}
          </section>
        )}

        {derivedPriorities.length > 0 && <FixFirstList items={derivedPriorities} />}

        <CtaClose handoff={report.handoff_cta} />

        <AuditFooter />
      </div>
    </div>
  );
}