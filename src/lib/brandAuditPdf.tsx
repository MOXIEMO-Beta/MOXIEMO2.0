import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Polygon, Line, pdf } from "@react-pdf/renderer";
import type { AuditResponse, AuditSection, GapHero } from "@/components/audit/BrandAuditReport";

// Design tokens — match the Strategy and Kit PDFs.
const C = {
  coral: "#FF6B5C",
  coralSoft: "#FFE4E0",
  ink: "#15171C",
  paper: "#F7F5F1",
  white: "#FFFFFF",
  muted: "#7a7e8c",
  border: "#e4e5ea",
  green: "#3fae6a",
  amber: "#B45309",
  red: "#B12C1C",
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
  if (score >= 80) return "Dialed in";
  if (score >= 60) return "Developing";
  if (score >= 40) return "At risk";
  return "Critical gap";
}

type Status = "strong" | "atRisk" | "critical" | "unknown";

function scoreStatus(score: number): Status {
  if (score >= 70) return "strong";
  if (score >= 45) return "atRisk";
  if (score >= 0) return "critical";
  return "unknown";
}

function statusHex(s: Status): string {
  if (s === "strong") return C.green;
  if (s === "atRisk") return "#F59E0B";
  if (s === "critical") return "#EF4444";
  return "#94A3B8";
}

function statusPill(s: Status): { bg: string; fg: string; br: string } {
  if (s === "strong") return { bg: "#EAF7EE", fg: "#237A44", br: "#BEE5CC" };
  if (s === "atRisk") return { bg: "#FFF5E1", fg: "#8B5A00", br: "#F5D999" };
  if (s === "critical") return { bg: "#FDECEA", fg: C.red, br: "#F6C3BC" };
  return { bg: "#F1F5F9", fg: C.ink, br: C.border };
}

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 44, backgroundColor: C.paper, color: C.ink, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.5 },
  cover: { padding: 56, backgroundColor: C.ink, color: C.white, height: "100%", justifyContent: "space-between" },
  eyebrow: { fontSize: 8, color: C.coral, letterSpacing: 2.4, fontFamily: "Helvetica-Bold", marginBottom: 8, textTransform: "uppercase" },
  eyebrowMuted: { fontSize: 8, color: C.muted, letterSpacing: 2.4, fontFamily: "Helvetica-Bold", marginBottom: 8, textTransform: "uppercase" },
  h1: { fontSize: 22, color: C.ink, fontFamily: "Helvetica-Bold", letterSpacing: -0.4, marginBottom: 4 },
  h2: { fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  body: { fontSize: 10.5, color: C.ink, lineHeight: 1.55 },
  bodySoft: { fontSize: 10.5, color: C.body ?? "#3c3f50", lineHeight: 1.55 },
  small: { fontSize: 9, color: C.muted },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 16, marginBottom: 12 },
  chip: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, textTransform: "uppercase", letterSpacing: 1.2 },
  footer: { position: "absolute", left: 44, right: 44, bottom: 22, fontSize: 8, color: C.muted, textAlign: "center", letterSpacing: 1.4, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
});

function Footer() {
  return <Text style={s.footer} fixed>Brand Audit  ·  Powered by MOXIEMO  ·  buildwithmoxiemo.com</Text>;
}

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((x) => x.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
}

function fallbackGapHero(report: any, score: number): GapHero {
  const positioning = (report?.sections || []).find((x: any) => x?.label === "Positioning & Differentiation");
  const focus = (report?.advisor_overview?.focus ?? "").split(/(?<=[.!?])\s+/)[0] ?? "";
  const firstFix = report?.priority_fixes?.[0]?.move ?? "";
  return {
    strategy_says: "Your strategy is not documented in MOXIEMO yet, so the audit reads your site on its own terms.",
    site_says: positioning?.whats_holding_back?.trim() || report?.verdict?.trim() || `Your site scores ${score}/100 on this pass.`,
    gap_verdict: focus?.trim() || firstFix?.trim() || "Close the gap between what you know and what your brand says first.",
  };
}

// ─── Radar (client-drawn SVG, coral polygon, light grid) ─────────────
function Radar({ sections, size = 260 }: { sections: AuditSection[]; size?: number }) {
  const n = sections.length;
  if (n < 3) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 30;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, v: number) => {
    const r = (Math.max(0, Math.min(100, v)) / 100) * radius;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const polyPoints = sections.map((sec, i) => point(i, sec.score).join(",")).join(" ");
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f, idx) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const r = f * radius;
          return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`;
        }).join(" ");
        return <Polygon key={idx} points={pts} stroke="#ECEAE4" strokeWidth={0.5} fill="none" />;
      })}
      {sections.map((_, i) => {
        const [x, y] = point(i, 100);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ECEAE4" strokeWidth={0.5} />;
      })}
      <Polygon points={polyPoints} fill={C.coral} fillOpacity={0.28} stroke={C.coral} strokeWidth={1.5} />
      {sections.map((sec, i) => {
        const [x, y] = point(i, sec.score);
        return <Circle key={i} cx={x} cy={y} r={2.5} fill={C.coral} />;
      })}
    </Svg>
  );
}

// ─── PART B — Cover page ────────────────────────────────────────────
function CoverPage({ data, band }: { data: AuditResponse; band: string }) {
  const st = scoreStatus(data.brand_audit_score);
  const pill = statusPill(st);
  const brand = (data.inputs?.brand_name ?? data.report?.what_we_found?.brand_name ?? "").toString().trim();
  const preparedFor = brand || "Founder";
  const dateStr = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return (
    <Page size="A4" style={{ backgroundColor: C.ink, color: C.white, padding: 0 }}>
      <View style={s.cover}>
        <View>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 20, color: C.coral, letterSpacing: 3 }}>MOXIEMO</Text>
          <View style={{ width: 60, height: 3, backgroundColor: C.coral, marginTop: 14 }} />
        </View>
        <View>
          <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.6, marginBottom: 14 }}>BRAND AUDIT</Text>
          <Text style={{ fontSize: 52, fontFamily: "Helvetica-Bold", color: C.white, lineHeight: 1 }}>Where your brand</Text>
          <Text style={{ fontSize: 52, fontFamily: "Helvetica-Bold", color: C.coral, lineHeight: 1 }}>stands today.</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.6, marginBottom: 6 }}>SCORE</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
              <Text style={{ fontSize: 108, fontFamily: "Helvetica-Bold", color: C.white, lineHeight: 1 }}>
                {data.brand_audit_score}
              </Text>
              <Text style={{ fontSize: 20, fontFamily: "Helvetica", color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>/ 100</Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: "row" }}>
              <Text style={{ ...s.chip, color: pill.fg, backgroundColor: pill.bg, borderColor: pill.br }}>{band}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.6, marginBottom: 6 }}>PREPARED FOR</Text>
            <Text style={{ fontSize: 20, color: C.white, fontFamily: "Helvetica-Bold" }}>{preparedFor}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: 14 }}>
          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{dateStr}</Text>
          <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 3 }}>CONFIDENTIAL</Text>
        </View>
      </View>
    </Page>
  );
}

// ─── PART C — Gap hero (PDF) ────────────────────────────────────────
function GapHeroPdf({ gap, strongest, weakest }: { gap: GapHero; strongest: AuditSection | null; weakest: AuditSection | null }) {
  return (
    <View wrap={false}>
      <Text style={s.eyebrow}>00 · The Gap</Text>
      <Text style={s.h1}>Strategy vs. Presence</Text>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <View style={{ flex: 1, backgroundColor: "#FFF4F2", borderColor: "#FFCFC8", borderWidth: 1, borderRadius: 10, padding: 14 }}>
          <Text style={{ ...s.eyebrow, marginBottom: 6 }}>YOUR STRATEGY SAYS</Text>
          <Text style={{ ...s.body, fontFamily: "Helvetica-Bold" }}>{gap.strategy_says}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 10, padding: 14 }}>
          <Text style={{ ...s.eyebrowMuted, marginBottom: 6 }}>YOUR SITE SAYS</Text>
          <Text style={{ ...s.body, fontFamily: "Helvetica-Bold" }}>{gap.site_says}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12, backgroundColor: C.white, borderColor: C.border, borderWidth: 1, borderLeftWidth: 4, borderLeftColor: C.coral, padding: 14 }}>
        <Text style={s.eyebrow}>THE GAP</Text>
        <Text style={{ fontSize: 15, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.4 }}>{gap.gap_verdict}</Text>
      </View>
      {(strongest || weakest) && (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {strongest && <StatReadoutPdf label="Strongest" section={strongest} status="strong" />}
          {weakest && <StatReadoutPdf label="Weakest" section={weakest} status={scoreStatus(weakest.score)} />}
        </View>
      )}
    </View>
  );
}

function StatReadoutPdf({ label, section, status }: { label: string; section: AuditSection; status: Status }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 8, padding: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: statusHex(status) }} />
        <Text style={s.eyebrowMuted}>{label.toUpperCase()}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ fontSize: 12, color: C.ink, fontFamily: "Helvetica-Bold" }}>{section.label}</Text>
        <Text style={{ fontSize: 18, color: C.ink, fontFamily: "Helvetica-Bold" }}>{section.score}</Text>
      </View>
    </View>
  );
}

// ─── PART D — At A Glance + Radar (PDF) ─────────────────────────────
function AtAGlanceRow({ sec }: { sec: AuditSection }) {
  const st = scoreStatus(sec.score);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: C.border }}>
      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: statusHex(st) }} />
      <Text style={{ flex: 1, fontSize: 10.5, color: C.ink }}>{sec.label}</Text>
      <Text style={{ fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold", width: 24, textAlign: "right" }}>{sec.score}</Text>
    </View>
  );
}

function AtAGlanceGroup({ title, items }: { title: string; items: AuditSection[] }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.eyebrowMuted}>{title.toUpperCase()}</Text>
      <View style={{ marginTop: 4 }}>
        {items.map((sec, i) => (
          <View key={sec.label} style={i === 0 ? { borderTopWidth: 0 } : {}}>
            <AtAGlanceRow sec={sec} />
          </View>
        ))}
      </View>
    </View>
  );
}

function AtAGlancePanel({ foundation, showup, allSections }: { foundation: AuditSection[]; showup: AuditSection[]; allSections: AuditSection[] }) {
  return (
    <View style={s.card} wrap={false}>
      <Text style={s.eyebrow}>01 · At A Glance</Text>
      <Text style={s.h1}>Eight Sections, One Read</Text>
      <View style={{ flexDirection: "row", gap: 20, marginTop: 12 }}>
        <View style={{ flex: 1.1 }}>
          <AtAGlanceGroup title="Your Brand Foundation" items={foundation} />
          <AtAGlanceGroup title="How Your Brand Shows Up" items={showup} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Radar sections={allSections} size={260} />
        </View>
      </View>
    </View>
  );
}

// ─── PART E — Section block ─────────────────────────────────────────
function SectionBlock({ sec, indexLabel }: { sec: AuditSection; indexLabel: string }) {
  const st = scoreStatus(sec.score);
  const pill = statusPill(st);
  const statusText = scoreBand(sec.score);
  return (
    <View style={s.card} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>{indexLabel}</Text>
          <Text style={{ fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold" }}>{sec.label}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 18, color: C.ink, fontFamily: "Helvetica-Bold" }}>{sec.score}</Text>
          <Text style={{ ...s.chip, color: pill.fg, backgroundColor: pill.bg, borderColor: pill.br }}>{statusText}</Text>
        </View>
      </View>

      <Text style={{ ...s.eyebrow, color: C.green }}>WHAT'S WORKING</Text>
      <Text style={{ ...s.body, marginBottom: 10 }}>{sec.whats_working}</Text>

      <Text style={{ ...s.eyebrow, color: C.red }}>WHAT'S HOLDING YOU BACK</Text>
      <Text style={{ ...s.body, marginBottom: 12 }}>{sec.whats_holding_back}</Text>

      <View style={{ backgroundColor: "#FFF4F2", borderColor: "#FFCFC8", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 }}>
        <Text style={s.eyebrow}>FIX FIRST</Text>
        <Text style={{ fontSize: 12, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.45 }}>{sec.fix_first}</Text>
      </View>

      <Text style={{ fontSize: 9, color: C.muted }}>Handled by {sec.agent} inside MOXIEMO.</Text>
    </View>
  );
}

// ─── PART F — Fix First list + CTA close ────────────────────────────
function FixFirstListPdf({ items }: { items: { rank: number; move: string; section: string; agent: string }[] }) {
  return (
    <View style={s.card} wrap={false}>
      <Text style={s.eyebrow}>WHAT I'D FIX FIRST</Text>
      <Text style={s.h1}>Your founder to-do list, ranked.</Text>
      <View style={{ marginTop: 10 }}>
        {items.map((p, i) => (
          <View key={p.rank} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.border }} wrap={false}>
            <Text style={{ width: 26, fontSize: 22, color: C.coral, fontFamily: "Helvetica-Bold", lineHeight: 1 }}>{p.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.4 }}>{p.move}</Text>
              <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{p.section}{p.agent ? `  ·  ${p.agent}` : ""}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CtaClosePdf({ handoff }: { handoff?: string }) {
  return (
    <View style={{ backgroundColor: C.ink, borderRadius: 12, padding: 28, alignItems: "center" }} wrap={false}>
      <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.6, marginBottom: 10 }}>CLOSE THE GAP</Text>
      <Text style={{ fontSize: 22, color: C.white, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 10 }}>
        Close the gap with MOXIEMO
      </Text>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 16, maxWidth: 380, lineHeight: 1.55 }}>
        {handoff || "Turn every fix on this page into on-brand strategy, content, and cadence, handled by your MOXIEMO team."}
      </Text>
      <View style={{ backgroundColor: C.coral, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999 }}>
        <Text style={{ color: C.white, fontFamily: "Helvetica-Bold", fontSize: 12 }}>Start with MOXIEMO</Text>
      </View>
    </View>
  );
}

// ─── Document ────────────────────────────────────────────────────────
function AuditDoc({ data }: { data: AuditResponse }) {
  const r = data.report;
  const band = scoreBand(data.brand_audit_score);
  const foundation = pickSections(r.sections || [], FOUNDATION_ORDER);
  const showup = pickSections(r.sections || [], SHOWUP_ORDER);
  const allSections = [...foundation, ...showup];

  const gap: GapHero = (r as any).gap_hero && (r as any).gap_hero.gap_verdict
    ? (r as any).gap_hero
    : fallbackGapHero(r, data.brand_audit_score);

  const sortedByScore = [...allSections].sort((a, b) => b.score - a.score);
  const strongest = sortedByScore[0] ?? null;
  const weakest = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  const realPriorities = (r.priority_fixes ?? [])
    .map((p) => ({ rank: p.rank, move: (p.move ?? "").trim(), section: p.section, agent: p.agent }))
    .filter((p) => p.move.length > 0);
  const derivedPriorities = realPriorities.length >= 3
    ? realPriorities.sort((a, b) => a.rank - b.rank)
    : [...allSections]
        .filter((sec) => (sec.fix_first ?? "").trim().length > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map((sec, i) => ({ rank: i + 1, move: sec.fix_first.trim(), section: sec.label, agent: sec.agent }));

  const foundationStart = 1;
  const showupStart = foundationStart + foundation.length;

  return (
    <Document>
      {/* Page 1 — Cover */}
      <CoverPage data={data} band={band} />

      {/* Page 2 — Gap hero + At A Glance + Radar */}
      <Page size="A4" style={s.page}>
        <GapHeroPdf gap={gap} strongest={strongest} weakest={weakest} />
        {allSections.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <AtAGlancePanel foundation={foundation} showup={showup} allSections={allSections} />
          </View>
        )}
        <Footer />
      </Page>

      {/* Pages 3+ — 8 sections */}
      <Page size="A4" style={s.page}>
        {foundation.length > 0 && (
          <>
            <View wrap={false} minPresenceAhead={140}>
              <Text style={s.eyebrowMuted}>02 · YOUR BRAND FOUNDATION</Text>
            </View>
            {foundation.map((sec, i) => (
              <SectionBlock
                key={sec.label}
                sec={sec}
                indexLabel={`${String(foundationStart + i).padStart(2, "0")} · ${sec.label.toUpperCase()}`}
              />
            ))}
          </>
        )}
        {showup.length > 0 && (
          <>
            <View wrap={false} minPresenceAhead={140}>
              <Text style={s.eyebrowMuted}>03 · HOW YOUR BRAND SHOWS UP</Text>
            </View>
            {showup.map((sec, i) => (
              <SectionBlock
                key={sec.label}
                sec={sec}
                indexLabel={`${String(showupStart + i).padStart(2, "0")} · ${sec.label.toUpperCase()}`}
              />
            ))}
          </>
        )}
        <Footer />
      </Page>

      {/* Last page — Fix First + CTA */}
      <Page size="A4" style={s.page}>
        {derivedPriorities.length > 0 && <FixFirstListPdf items={derivedPriorities} />}
        <CtaClosePdf handoff={r.handoff_cta} />
        <Footer />
      </Page>
    </Document>
  );
}

export async function downloadAuditPdf(data: AuditResponse) {
  const blob = await pdf(<AuditDoc data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const brandSource = (data.inputs?.brand_name ?? data.report?.what_we_found?.brand_name ?? "brand").toString();
  const name = brandSource.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand";
  a.download = `${name}-brand-audit.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}