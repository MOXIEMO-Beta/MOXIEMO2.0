import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { AuditResponse, AuditSection } from "@/components/audit/BrandAuditReport";

const C = {
  coral: "#FF6B5C",
  ink: "#15171C",
  paper: "#F7F5F1",
  white: "#FFFFFF",
  muted: "#7a7e8c",
  border: "#e4e5ea",
  good: "#047857",
  warn: "#B45309",
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

function tierColor(tier: string) {
  const t = (tier || "").toLowerCase();
  if (t.includes("dialed")) return { bg: "#ECFDF5", fg: C.good, br: "#A7F3D0" };
  if (t.includes("developing")) return { bg: "#F1F5F9", fg: C.ink, br: "#E2E8F0" };
  if (t.includes("risk")) return { bg: "#FFFBEB", fg: C.warn, br: "#FDE68A" };
  if (t.includes("critical")) return { bg: "#FFE9E6", fg: C.coral, br: "#FFCFC8" };
  return { bg: "#F1F5F9", fg: C.ink, br: "#E2E8F0" };
}

function scoreBand(score: number) {
  if (score >= 80) return "Dialed in";
  if (score >= 60) return "Developing";
  if (score >= 40) return "At risk";
  return "Critical gap";
}

const s = StyleSheet.create({
  page: { padding: 48, backgroundColor: C.paper, color: C.ink, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.5 },
  card: { backgroundColor: C.white, borderWidth: 2, borderColor: C.border, borderRadius: 10, padding: 20, marginBottom: 16 },
  eyebrow: { fontSize: 8, color: C.muted, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  h1: { fontSize: 26, color: C.ink, fontFamily: "Helvetica-Bold", letterSpacing: -0.6, marginBottom: 4 },
  h2: { fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  small: { fontSize: 9, color: C.muted },
  body: { fontSize: 11, color: C.ink, lineHeight: 1.5 },
  groupLabel: { fontSize: 9, color: C.muted, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 10 },
  chip: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  pillMuted: { fontSize: 8, color: C.muted, backgroundColor: C.paper, borderColor: C.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  pillCoral: { fontSize: 8, color: C.coral, backgroundColor: "#FFE9E6", borderColor: "#FFCFC8", borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 22, fontSize: 8, color: C.muted, textAlign: "center", letterSpacing: 1 },
});

function Footer() {
  return <Text style={s.footer} fixed>BRAND AUDIT  ·  POWERED BY MOXIEMO  ·  BUILDWITHMOXIEMO.COM</Text>;
}

function pickSections(all: AuditSection[], order: string[]) {
  return order
    .map((label) => all.find((x) => x.label?.toLowerCase() === label.toLowerCase()))
    .filter(Boolean) as AuditSection[];
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

      <Text style={s.eyebrow}>WHAT IS WORKING</Text>
      <Text style={{ ...s.body, marginBottom: 8 }}>{sec.whats_working}</Text>

      <Text style={s.eyebrow}>WHAT IS HOLDING YOU BACK</Text>
      <Text style={{ ...s.body, marginBottom: 8 }}>{sec.whats_holding_back}</Text>

      {sec.evidence?.length > 0 && (
        <>
          <Text style={s.eyebrow}>WHAT WE LOOKED AT</Text>
          <View style={{ marginBottom: 8 }}>
            {sec.evidence.map((e, i) => (
              <Text key={i} style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>•  {e}</Text>
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

      <Text style={{ ...s.eyebrow, color: C.coral }}>WHAT I WOULD DO FIRST</Text>
      <Text style={{ ...s.body, marginBottom: 10 }}>{sec.fix_first}</Text>

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

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Verdict */}
        <View style={{ ...s.card, alignItems: "center", padding: 28 }}>
          <Text style={s.eyebrow}>BRAND AUDIT SCORE</Text>
          <Text style={{ fontSize: 64, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: -2, marginBottom: 4 }}>
            {data.brand_audit_score}
            <Text style={{ fontSize: 22, color: C.muted, fontFamily: "Helvetica" }}> / 100</Text>
          </Text>
          <Text style={{ ...s.chip, color: tierColor(band).fg, backgroundColor: tierColor(band).bg, borderColor: tierColor(band).br, marginBottom: 12 }}>{band}</Text>
          <Text style={{ fontSize: 14, color: C.ink, textAlign: "center", lineHeight: 1.4, fontFamily: "Helvetica-Bold" }}>{r.verdict}</Text>
          <Text style={{ fontSize: 8, color: C.muted, marginTop: 14, textAlign: "center" }}>
            Powered by MOXIEMO, the growth system that builds your brand and your go-to-market.
          </Text>
        </View>

        {/* What we found */}
        <View style={s.card}>
          <Text style={s.eyebrow}>WHAT WE FOUND</Text>
          <View style={{ marginTop: 6 }}>
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 4 }}>BRAND</Text>
            <Text style={s.body}>{r.what_we_found?.brand_name || "—"}</Text>
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>WHAT YOU DO</Text>
            <Text style={s.body}>{r.what_we_found?.what_you_do || "—"}</Text>
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>WHO YOU SERVE</Text>
            <Text style={s.body}>{r.what_we_found?.who_you_serve || "—"}</Text>
            <Text style={{ ...s.small, fontFamily: "Helvetica-Bold", marginTop: 6 }}>COMPETITORS</Text>
            <Text style={s.body}>{(r.what_we_found?.competitors || []).join(", ") || "—"}</Text>
          </View>
        </View>
        <Footer />
      </Page>

      {foundation.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.groupLabel}>YOUR BRAND FOUNDATION</Text>
          {foundation.map((sec) => <SectionBlock key={sec.label} sec={sec} />)}
          <Footer />
        </Page>
      )}

      {showup.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.groupLabel}>HOW YOUR BRAND SHOWS UP</Text>
          {showup.map((sec) => <SectionBlock key={sec.label} sec={sec} />)}
          <Footer />
        </Page>
      )}

      <Page size="A4" style={s.page}>
        {r.competitive_read && r.competitive_read.trim() && (
          <View style={s.card}>
            <Text style={s.h2}>How you stack up</Text>
            <Text style={s.body}>{r.competitive_read}</Text>
          </View>
        )}

        {r.priority_fixes?.length > 0 && (
          <View style={s.card}>
            <Text style={s.h2}>What I would fix first</Text>
            <Text style={{ ...s.small, marginBottom: 10 }}>Your founder to-do list, ranked.</Text>
            {[...r.priority_fixes].sort((a, b) => a.rank - b.rank).map((p) => (
              <View key={p.rank} style={{ flexDirection: "row", gap: 10, marginBottom: 12, borderTopWidth: 1, borderTopColor: C.paper, paddingTop: 10 }} wrap={false}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.coral, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: C.white, fontFamily: "Helvetica-Bold", fontSize: 11 }}>{p.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...s.body, fontFamily: "Helvetica-Bold" }}>{p.move}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <Text style={s.pillMuted}>{p.section}</Text>
                    <Text style={s.pillCoral}>{p.agent}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ ...s.card, alignItems: "center", padding: 28 }}>
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
  const name = data.report?.what_we_found?.brand_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
  a.download = `${name}-brand-audit.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}