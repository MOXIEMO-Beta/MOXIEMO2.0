import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Polygon, Line, pdf } from "@react-pdf/renderer";
import type { AuditResponse, AuditSection } from "@/components/audit/BrandAuditReport";
import { composeSituationRead } from "@/components/audit/BrandAuditReport";

const C = {
  coral: "#FF6B5C",
  ink: "#15171C",
  paper: "#F7F5F1",
  white: "#FFFFFF",
  muted: "#7a7e8c",
  border: "#e4e5ea",
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

type TierKey = "dialed" | "developing" | "risk" | "critical" | "unknown";

function tierKey(tier: string): TierKey {
  const t = (tier || "").toLowerCase();
  if (t.includes("dialed")) return "dialed";
  if (t.includes("developing")) return "developing";
  if (t.includes("risk")) return "risk";
  if (t.includes("critical")) return "critical";
  return "unknown";
}

const TIER: Record<TierKey, { hex: string; bg: string; br: string; fg: string }> = {
  dialed:     { hex: "#10b981", bg: "#ECFDF5", br: "#A7F3D0", fg: "#047857" },
  developing: { hex: "#f59e0b", bg: "#FFFBEB", br: "#FDE68A", fg: "#B45309" },
  risk:       { hex: "#f97316", bg: "#FFF7ED", br: "#FED7AA", fg: "#C2410C" },
  critical:   { hex: "#ef4444", bg: "#FFE9E6", br: "#FFCFC8", fg: C.coral },
  unknown:    { hex: "#94a3b8", bg: "#F1F5F9", br: "#E2E8F0", fg: C.ink },
};

function tierColor(tier: string) {
  return TIER[tierKey(tier)];
}

function scoreBand(score: number) {
  if (score >= 80) return "Dialed in";
  if (score >= 60) return "Developing";
  if (score >= 40) return "At risk";
  return "Critical gap";
}

function paragraphs(text: string): string[] {
  return (text || "")
    .split(/\n{2,}|(?<=[.!?])\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
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

function AdvisorOverviewPdf({
  overview,
  stage,
  posture,
  brand,
  whatYouDo,
  whoYouServe,
  competitors,
  sections,
}: {
  overview?: AuditResponse["report"]["advisor_overview"];
  stage?: string | null;
  posture?: string | null;
  brand?: string;
  whatYouDo?: string;
  whoYouServe?: string;
  competitors?: string[];
  sections?: AuditSection[];
}) {
  const ao = overview ?? {};
  const stageLabel = (ao.stage_label && ao.stage_label.trim()) || prettyStage(stage);
  const postureLabel = (ao.posture_label && ao.posture_label.trim()) || prettyPosture(posture);
  const strengths = Array.isArray(ao.strengths)
    ? ao.strengths.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const focus = (ao.focus ?? "").trim();
  const futureLevers = (ao.future_levers ?? "").trim();
  const read = composeSituationRead({
    read: ao.read,
    brand,
    whatYouDo,
    whoYouServe,
    competitors,
    strengths,
    stageLabel,
    postureLabel,
    sections,
  });
  if (!read && strengths.length === 0 && !focus && !futureLevers) return null;
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
        {stageLabel ? (
          <Text style={{ ...s.chip, color: C.ink, backgroundColor: C.paper, borderColor: C.border }}>{stageLabel.toUpperCase()}</Text>
        ) : null}
        {postureLabel ? (
          <Text style={{ ...s.chip, color: C.ink, backgroundColor: C.paper, borderColor: C.border }}>{postureLabel.toUpperCase()}</Text>
        ) : null}
      </View>
      {read ? <Text style={{ ...s.body, fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>{read}</Text> : null}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>WORKING IN YOUR FAVOR</Text>
          {strengths.length > 0 ? (
            strengths.map((str, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 4 }}>
                <Text style={{ color: "#10b981", fontSize: 11, marginRight: 6 }}>{"\u2022"}</Text>
                <Text style={{ ...s.body, flex: 1 }}>{str}</Text>
              </View>
            ))
          ) : (
            <Text style={s.notProvided}>Not provided</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...s.eyebrow, color: C.coral }}>WHAT MATTERS MOST NOW</Text>
          {focus ? <Text style={{ ...s.body, marginBottom: 6 }}>{focus}</Text> : <Text style={s.notProvided}>Not provided</Text>}
          {futureLevers ? <Text style={{ ...s.small }}>{futureLevers}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 48, backgroundColor: C.paper, color: C.ink, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.5 },
  card: { backgroundColor: C.white, borderWidth: 2, borderColor: C.border, borderRadius: 10, padding: 16, marginBottom: 12 },
  eyebrow: { fontSize: 8, color: C.muted, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  h1: { fontSize: 26, color: C.ink, fontFamily: "Helvetica-Bold", letterSpacing: -0.6, marginBottom: 4 },
  h2: { fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  small: { fontSize: 9, color: C.muted },
  evidence: { fontSize: 9, color: "#5A5F6B", marginBottom: 2 },
  evidenceLabel: { fontSize: 8, color: "#5A5F6B", letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  body: { fontSize: 11, color: C.ink, lineHeight: 1.5 },
  notProvided: { fontSize: 11, color: C.muted, fontStyle: "italic" },
  groupLabel: { fontSize: 9, color: C.muted, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 8 },
  chip: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  pillMuted: { fontSize: 8, color: C.muted, backgroundColor: C.paper, borderColor: C.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  pillCoral: { fontSize: 8, color: C.coral, backgroundColor: "#FFE9E6", borderColor: "#FFCFC8", borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  footer: { position: "absolute", left: 36, right: 36, bottom: 18, fontSize: 8, color: C.muted, textAlign: "center", letterSpacing: 1 },
});

function Footer() {
  return <Text style={s.footer} fixed>BRAND AUDIT  ·  POWERED BY MOXIEMO  ·  BUILDWITHMOXIEMO.COM</Text>;
}

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((x) => x.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
}

function cleanDomain(input: string): string {
  let s = (input || "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  return s;
}

function fieldOrNotProvided(value: string | null | undefined) {
  const v = (value ?? "").trim();
  if (!v || v === "—") return <Text style={s.notProvided}>Not provided</Text>;
  return <Text style={s.body}>{v}</Text>;
}

function RingGauge({ score, tier }: { score: number; tier: string }) {
  const size = 130;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  const color = TIER[tierKey(tier)].hex;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#ECEAE4" strokeWidth={stroke} fill="none" />
      <Circle
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
    </Svg>
  );
}

function Radar({ sections, size = 240 }: { sections: AuditSection[]; size?: number }) {
  const n = sections.length;
  if (n < 3) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, v: number) => {
    const r = (Math.max(0, Math.min(100, v)) / 100) * radius;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const polyPoints = sections
    .map((sec, i) => point(i, sec.score).join(","))
    .join(" ");
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f, idx) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const r = f * radius;
          return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`;
        }).join(" ");
        return (
          <Polygon key={idx} points={pts} stroke="#E4E1DA" strokeWidth={0.5} fill="none" />
        );
      })}
      {sections.map((_, i) => {
        const [x, y] = point(i, 100);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E4E1DA" strokeWidth={0.5} />;
      })}
      <Polygon points={polyPoints} fill={C.coral} fillOpacity={0.28} stroke={C.coral} strokeWidth={1.5} />
      {sections.map((sec, i) => {
        const [x, y] = point(i, sec.score);
        return <Circle key={i} cx={x} cy={y} r={2.5} fill={C.coral} />;
      })}
    </Svg>
  );
}

function AtAGlance({ sections }: { sections: AuditSection[] }) {
  return (
    <View>
      {sections.map((sec) => {
        const tc = tierColor(sec.tier);
        const pct = Math.max(0, Math.min(100, sec.score));
        return (
          <View key={sec.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }} wrap={false}>
            <Text style={{ fontSize: 10, color: C.ink, width: 160 }}>{sec.label}</Text>
            <View style={{ flex: 1, height: 6, backgroundColor: "#ECEAE4", borderRadius: 3 }}>
              <View style={{ width: `${pct}%`, height: 6, backgroundColor: tc.hex, borderRadius: 3 }} />
            </View>
            <Text style={{ fontSize: 10, color: C.ink, fontFamily: "Helvetica-Bold", width: 22, textAlign: "right" }}>{sec.score}</Text>
            <Text style={{ ...s.chip, color: tc.fg, backgroundColor: tc.bg, borderColor: tc.br, width: 70, textAlign: "center" }}>{sec.tier}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SectionBlock({ sec }: { sec: AuditSection }) {
  const tc = tierColor(sec.tier);
  return (
    <View style={s.card} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 14, color: C.ink, fontFamily: "Helvetica-Bold" }}>{sec.label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold", marginRight: 6 }}>{sec.score}</Text>
          <Text style={{ ...s.chip, color: tc.fg, backgroundColor: tc.bg, borderColor: tc.br }}>{sec.tier}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: "#FFF4F2", borderColor: "#FFCFC8", borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <Text style={{ ...s.eyebrow, color: C.coral }}>WHAT I WOULD DO FIRST</Text>
        <Text style={{ ...s.body, fontFamily: "Helvetica-Bold" }}>{sec.fix_first}</Text>
      </View>

      <Text style={s.eyebrow}>WHAT IS WORKING</Text>
      <Text style={{ ...s.body, marginBottom: 8 }}>{sec.whats_working}</Text>

      <Text style={s.eyebrow}>WHAT IS HOLDING YOU BACK</Text>
      <Text style={{ ...s.body, marginBottom: 8 }}>{sec.whats_holding_back}</Text>

      {sec.evidence?.length > 0 && (
        <>
          <Text style={s.evidenceLabel}>WHAT WE LOOKED AT</Text>
          <View style={{ marginBottom: 8 }}>
            {sec.evidence.map((e, i) => (
              <Text key={i} style={s.evidence}>{`\u2022  ${e}`}</Text>
            ))}
          </View>
        </>
      )}

      {sec.competitor_framing && sec.competitor_framing.trim() && (
        <View style={{ backgroundColor: C.paper, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, marginBottom: 8 }}>
          <Text style={s.eyebrow}>COMPETITOR FRAMING</Text>
          <Text style={s.body}>{sec.competitor_framing}</Text>
        </View>
      )}

      <View style={{ flexDirection: "row" }}>
        <Text style={s.pillMuted}>Handled by {sec.agent} inside MOXIEMO.</Text>
      </View>
    </View>
  );
}

function AuditDoc({ data }: { data: AuditResponse }) {
  const r = data.report;
  const band = scoreBand(data.brand_audit_score);
  const foundation = pickSections(r.sections || [], FOUNDATION_ORDER);
  const showup = pickSections(r.sections || [], SHOWUP_ORDER);
  const allSections = [...foundation, ...showup];

  const inputs = data.inputs ?? null;
  const found = r.what_we_found ?? ({} as typeof r.what_we_found);
  const brand = (inputs?.brand_name ?? found?.brand_name ?? "").trim();
  const whatYouDo = (inputs?.what_you_do ?? found?.what_you_do ?? "").trim();
  const whoYouServe = (inputs?.who_you_serve ?? found?.who_you_serve ?? "").trim();
  const competitorList = (
    (inputs?.competitors && inputs.competitors.length > 0
      ? inputs.competitors
      : found?.competitors) || []
  ).filter((c): c is string => typeof c === "string" && c.trim().length > 0);
  const competitorDisplay = Array.from(new Set(competitorList.map(cleanDomain).filter(Boolean)));

  // Same derivation as the web report
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

  const tc = tierColor(band);
  const verdictParas = paragraphs(r.verdict);

  return (
    <Document>
      {/* Page 1: hero + verdict + at-a-glance + radar + what we found */}
      <Page size="A4" style={s.page}>
        <View style={s.card}>
          <View style={{ flexDirection: "row", gap: 18, alignItems: "center", marginBottom: 14 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={s.eyebrow}>BRAND AUDIT SCORE</Text>
              <RingGauge score={data.brand_audit_score} tier={band} />
              <Text style={{ fontSize: 18, color: C.ink, fontFamily: "Helvetica-Bold", marginTop: -78 }}>
                {data.brand_audit_score}
              </Text>
              <Text style={{ fontSize: 8, color: C.muted, marginTop: 56, letterSpacing: 1 }}>/ 100</Text>
              <Text style={{ ...s.chip, color: tc.fg, backgroundColor: tc.bg, borderColor: tc.br, marginTop: 8 }}>{band}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...s.body, fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
                {verdictParas.length > 0 ? verdictParas.join(" ") : r.verdict}
              </Text>
              <Text style={{ fontSize: 8, color: C.muted, marginTop: 8 }}>
                Powered by MOXIEMO, the growth system that builds your brand and your go-to-market.
              </Text>
            </View>
          </View>
        </View>

        <AdvisorOverviewPdf
          overview={r.advisor_overview}
          stage={data.stage}
          posture={data.posture}
          brand={brand}
          whatYouDo={whatYouDo}
          whoYouServe={whoYouServe}
          competitors={competitorDisplay}
          sections={allSections}
        />

        {allSections.length > 0 && (
          <View style={s.card}>
            <Text style={s.h2}>At a glance</Text>
            <Text style={{ ...s.small, marginBottom: 10 }}>Eight sections, one quick read.</Text>
            <AtAGlance sections={allSections} />
          </View>
        )}


        <View style={s.card}>
          <Text style={s.eyebrow}>WHAT WE FOUND</Text>
          <View style={{ marginTop: 6 }}>
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 4 }}>BRAND</Text>
            {fieldOrNotProvided(brand)}
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>WHAT YOU DO</Text>
            {fieldOrNotProvided(whatYouDo)}
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>WHO YOU SERVE</Text>
            {fieldOrNotProvided(whoYouServe)}
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>COMPETITORS</Text>
            {competitorDisplay.length > 0
              ? <Text style={s.body}>{competitorDisplay.join(", ")}</Text>
              : <Text style={s.notProvided}>Not provided</Text>}
          </View>
        </View>
        <Footer />
      </Page>

      {allSections.length >= 3 && (
        <Page size="A4" style={s.page}>
          <View style={s.card}>
            <Text style={s.h2}>Brand health radar</Text>
            <Text style={{ ...s.small, marginBottom: 12 }}>The shape of your strengths and gaps.</Text>
            <View style={{ alignItems: "center", marginVertical: 8 }}>
              <Radar sections={allSections} size={360} />
            </View>
          </View>
          <Footer />
        </Page>
      )}

      {/* Section detail flows continuously; cards never split (wrap=false). */}
      <Page size="A4" style={s.page}>
        {foundation.length > 0 && (
          <>
            <View wrap={false} minPresenceAhead={120}>
              <Text style={s.groupLabel}>YOUR BRAND FOUNDATION</Text>
            </View>
            {foundation.map((sec) => <SectionBlock key={sec.label} sec={sec} />)}
          </>
        )}
        {showup.length > 0 && (
          <>
            <View wrap={false} minPresenceAhead={120}>
              <Text style={s.groupLabel}>HOW YOUR BRAND SHOWS UP</Text>
            </View>
            {showup.map((sec) => <SectionBlock key={sec.label} sec={sec} />)}
          </>
        )}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        {r.competitive_read && r.competitive_read.trim() && (
          <View style={s.card} wrap={false}>
            <Text style={s.h2}>How you stack up</Text>
            {paragraphs(r.competitive_read).map((p, i) => (
              <Text key={i} style={{ ...s.body, marginBottom: 8 }}>{p}</Text>
            ))}
          </View>
        )}

        {derivedPriorities.length > 0 && (
          <View style={s.card} wrap={false}>
            <Text style={s.h2}>What I would fix first</Text>
            <Text style={{ ...s.small, marginBottom: 10 }}>Your founder to-do list, ranked.</Text>
            {derivedPriorities.map((p) => (
              <View key={p.rank} style={{ flexDirection: "row", gap: 10, marginBottom: 12, borderTopWidth: 1, borderTopColor: C.paper, paddingTop: 10 }} wrap={false}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.coral, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: C.white, fontFamily: "Helvetica-Bold", fontSize: 11 }}>{p.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...s.body, fontFamily: "Helvetica-Bold" }}>{p.move}</Text>
                  <Text style={{ ...s.small, marginTop: 4 }}>{p.section}{p.agent ? `  ·  ${p.agent}` : ""}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...s.card, alignItems: "center", padding: 24 }} wrap={false}>
          {r.handoff_cta && (
            <Text style={{ fontSize: 14, color: C.ink, textAlign: "center", marginBottom: 16, fontFamily: "Helvetica-Bold", lineHeight: 1.4 }}>
              {r.handoff_cta}
            </Text>
          )}
          <View style={{ backgroundColor: C.coral, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999 }}>
            <Text style={{ color: C.white, fontFamily: "Helvetica-Bold", fontSize: 12 }}>Start with MOXIEMO</Text>
          </View>
        </View>
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