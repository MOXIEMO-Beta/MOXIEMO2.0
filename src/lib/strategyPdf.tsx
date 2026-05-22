import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image, pdf, Font,
} from "@react-pdf/renderer";

// ─── Brand tokens ────────────────────────────────────────────────
const C = {
  navy: "#15171C",
  ink: "#262833",
  body: "#3c3f50",
  muted: "#7a7e8c",
  rule: "#e4e5ea",
  cream: "#f7f2eb",
  cardBorder: "#e4e5ea",
  coral: "#FF6B5C",
  coralSoft: "#FFE4E0",
  white: "#ffffff",
  green: "#3fae6a",
};

const LOGO_SRC = `${window.location.origin}/MOXIEMO_Logo_No_background.png`;

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontSize: 10, color: C.body, fontFamily: "Helvetica", backgroundColor: C.cream },
  cover: { padding: 56, backgroundColor: C.navy, color: C.white, height: "100%", justifyContent: "space-between" },
  eyebrow: { fontSize: 9, color: C.coral, letterSpacing: 2.5, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  h1: { fontSize: 28, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 18, letterSpacing: -0.5 },
  card: { borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, padding: 14, marginBottom: 10, backgroundColor: C.white },
  cardLabel: { fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.8, marginBottom: 6 },
  cardLabelMuted: { fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.8, marginBottom: 6 },
  body: { fontSize: 10, color: C.body, lineHeight: 1.5 },
  bodyDark: { fontSize: 11, color: C.ink, lineHeight: 1.5 },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  col: { flex: 1 },
  pill: { backgroundColor: C.coralSoft, color: C.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 9, marginRight: 6, marginBottom: 6 },
  pillCoral: { backgroundColor: C.coral, color: C.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 9, marginRight: 6, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
});

const safe = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(safe).filter(Boolean).join(", ");
  if (typeof v === "object") return v.name || v.title || v.text || v.label || "";
  return "";
};

const Eyebrow = ({ children }: any) => (
  <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, marginBottom: 12 }}>{children}</Text>
);

const SectionPage = ({ label, title, children }: any) => (
  <Page size="A4" style={s.page} wrap>
    <Eyebrow>{label}</Eyebrow>
    <Text style={s.h1}>{title}</Text>
    {children}
    <Text fixed style={{ position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: C.muted, textAlign: "center" }}>
      MOXIEMO Strategic Report · CONFIDENTIAL
    </Text>
  </Page>
);

const KVGrid = ({ items }: { items: Array<[string, string]> }) => (
  <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 10 }}>
    {items.map(([k, v]) => (
      <View key={k} style={{ width: "33.33%", padding: 4 }} wrap={false}>
        <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, padding: 12, backgroundColor: C.white, minHeight: 70 }}>
          <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.8, marginBottom: 6 }}>{k.toUpperCase()}</Text>
          <Text style={{ fontSize: 10, color: C.body, lineHeight: 1.4 }}>{v || "—"}</Text>
        </View>
      </View>
    ))}
  </View>
);

// ─── Cover ───────────────────────────────────────────────────────
const Cover = ({ data }: any) => (
  <Page size="A4" style={{ backgroundColor: C.navy, color: C.white, padding: 0 }}>
    <View style={s.cover}>
      <View>
        <Image src={LOGO_SRC} style={{ width: 160, height: 40, objectFit: "contain" }} />
        <View style={{ width: 60, height: 3, backgroundColor: C.coral, marginTop: 16 }} />
      </View>
      <View>
        <Text style={{ fontSize: 56, fontFamily: "Helvetica-Bold", color: C.white, lineHeight: 1 }}>Strategic</Text>
        <Text style={{ fontSize: 56, fontFamily: "Helvetica-Bold", color: C.coral, lineHeight: 1 }}>Report</Text>
      </View>
      <View>
        <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, marginBottom: 6 }}>PREPARED FOR</Text>
        <Text style={{ fontSize: 22, color: C.white, fontFamily: "Helvetica-Bold" }}>{safe(data?.meta?.preparedFor) || "Founder"}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 3 }}>CONFIDENTIAL</Text>
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{safe(data?.meta?.date)}</Text>
      </View>
    </View>
  </Page>
);

// ─── 01 Overview ─────────────────────────────────────────────────
const Overview = ({ data }: any) => {
  const p = data?.positioning || {};
  const b = p.breakdown || {};
  const a = data?.archetype || {};
  return (
    <SectionPage label="01 · STRATEGIC OVERVIEW" title="Positioning & Archetype">
      {p.statement && (
        <View style={{ backgroundColor: C.navy, padding: 18, borderRadius: 10, marginBottom: 14 }} wrap={false}>
          <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2, marginBottom: 8 }}>POSITIONING</Text>
          <Text style={{ fontSize: 14, color: C.white, lineHeight: 1.5, fontFamily: "Helvetica-Bold" }}>{safe(p.statement)}</Text>
        </View>
      )}
      <KVGrid items={[["Who", safe(b.who)], ["Problem", safe(b.problem)], ["Solution", safe(b.solution)]]} />
      <KVGrid items={[["Result", safe(b.result)], ["Method", safe(b.method)], ["Transformation", safe(b.transformation)]]} />
      {a.primary && (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>ARCHETYPE</Text>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 }}>
            {safe(a.primary)}{a.secondary ? <Text style={{ fontSize: 12, color: C.muted, fontFamily: "Helvetica" }}>  ·  {safe(a.secondary)}</Text> : null}
          </Text>
          {a.description && <Text style={s.body}>{safe(a.description)}</Text>}
        </View>
      )}
      {a.values?.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardLabel}>VALUES</Text>
          <View style={s.pillsWrap}>
            {a.values.map((v: any, i: number) => <Text key={i} style={s.pill}>{safe(v)}</Text>)}
          </View>
        </View>
      )}
    </SectionPage>
  );
};

// ─── 02 Voice ────────────────────────────────────────────────────
const Voice = ({ data }: any) => {
  const v = data?.voice || {};
  const tone = v.toneByChannel || {};
  return (
    <SectionPage label="02 · VOICE & BRAND IDENTITY" title="How You Sound">
      {v.attributes?.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={s.cardLabel}>VOICE ATTRIBUTES</Text>
          <View style={s.pillsWrap}>
            {v.attributes.map((a: any, i: number) => <Text key={i} style={s.pillCoral}>{safe(a)}</Text>)}
          </View>
        </View>
      )}
      <View style={s.row}>
        <View style={[s.card, s.col]} wrap={false}>
          <Text style={[s.cardLabel, { color: C.green }]}>USE</Text>
          <Text style={s.body}>{(v.useWords || []).map(safe).filter(Boolean).join(", ") || "—"}</Text>
        </View>
        <View style={[s.card, s.col]} wrap={false}>
          <Text style={s.cardLabel}>AVOID</Text>
          <Text style={s.body}>{(v.avoidWords || []).map(safe).filter(Boolean).join(", ") || "—"}</Text>
        </View>
      </View>
      {v.exampleLine && (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>VOICE EXAMPLE</Text>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Oblique", color: C.ink, lineHeight: 1.5 }}>&ldquo;{safe(v.exampleLine)}&rdquo;</Text>
        </View>
      )}
      {v.neverSoundLike && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabelMuted}>NEVER SOUND LIKE</Text>
          <Text style={s.body}>{safe(v.neverSoundLike)}</Text>
        </View>
      )}
      {Object.keys(tone).length > 0 && (
        <View>
          <Text style={[s.cardLabel, { marginBottom: 8 }]}>TONE BY CHANNEL</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
            {Object.entries(tone).map(([ch, t]) => (
              <View key={ch} style={{ width: "33.33%", padding: 4 }} wrap={false}>
                <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, padding: 12, backgroundColor: C.white }}>
                  <Text style={[s.cardLabel, { fontSize: 8 }]}>{ch.toUpperCase()}</Text>
                  <Text style={s.body}>{safe(t)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </SectionPage>
  );
};

// ─── 03 Content ──────────────────────────────────────────────────
const Content = ({ data }: any) => {
  const cs = data?.contentStrategy || {};
  const pillars: any[] = cs.pillars || [];
  const quarters: any[] = cs.quarters || [];
  return (
    <SectionPage label="03 · CONTENT STRATEGY" title="What You Publish">
      {pillars.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardLabel}>CONTENT PILLARS</Text>
          {pillars.map((p, i) => {
            const name = typeof p === "string" ? p : (p?.name || p?.title || "");
            const desc = typeof p === "object" ? p?.description : "";
            return (
              <View key={i} style={{ flexDirection: "row", marginTop: i ? 8 : 0, paddingTop: i ? 8 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: C.rule }} wrap={false}>
                <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: C.coralSoft, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                  <Text style={{ fontSize: 10, color: C.coral, fontFamily: "Helvetica-Bold" }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink }}>{safe(name)}</Text>
                  {desc ? <Text style={[s.body, { marginTop: 2 }]}>{safe(desc)}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {quarters.map((q, i) => (
        <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>{(q.label || `Q${i + 2}`).toUpperCase()}</Text>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 }}>{safe(q.theme)}</Text>
          {q.arc ? <Text style={[s.body, { marginBottom: 6 }]}>{safe(q.arc)}</Text> : null}
          {q.cta ? <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold" }}>CTA · {safe(q.cta)}</Text> : null}
          {q.metric ? <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>METRIC · {safe(q.metric)}</Text> : null}
        </View>
      ))}
    </SectionPage>
  );
};

// ─── 03B Calendar ────────────────────────────────────────────────
const Calendar = ({ data }: any) => {
  const entries: any[] = data?.calendar || [];
  const colorFor = (t: string = "") => {
    const x = t.toLowerCase();
    if (x.includes("email")) return C.navy;
    if (x.includes("podcast") || x.includes("video")) return C.green;
    return C.coral;
  };
  return (
    <SectionPage label="03B · 30-DAY CONTENT CALENDAR" title="Next 30 Days">
      <View style={{ flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.rule, marginBottom: 4 }} fixed>
        <Text style={{ width: 60, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>DATE</Text>
        <Text style={{ width: 40, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>DAY</Text>
        <Text style={{ width: 70, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>CHANNEL</Text>
        <Text style={{ width: 90, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>FORMAT</Text>
        <Text style={{ flex: 1, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>TOPIC</Text>
      </View>
      {entries.map((e, i) => (
        <View key={i} style={{ flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.rule, borderLeftWidth: 2, borderLeftColor: colorFor(e?.type), paddingLeft: 8 }} wrap={false}>
          <Text style={{ width: 58, fontSize: 9, color: C.ink, fontFamily: "Helvetica-Bold" }}>{safe(e.date)}</Text>
          <Text style={{ width: 40, fontSize: 9, color: C.muted }}>{safe(e.dayName)}</Text>
          <Text style={{ width: 70, fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold" }}>{safe(e.channel)}</Text>
          <Text style={{ width: 90, fontSize: 9, color: C.body }}>{safe(e.type)}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: C.body }}>{safe(e.title)}</Text>
        </View>
      ))}
    </SectionPage>
  );
};

// ─── 04 Channels & Metrics ───────────────────────────────────────
const ChannelsMetrics = ({ data }: any) => {
  const ch = data?.channels || {};
  const met = data?.metrics || {};
  const goals: any[] = met.businessGoals || [];
  const bh = met.brandHealth || {};
  const n = (x: any) => { const v = Number(x) || 0; return v > 10 ? v / 10 : v; };
  const aa = n(bh.archetypeAlignment);
  const vc = n(bh.voiceConsistency);
  return (
    <SectionPage label="04 · CHANNELS & METRICS" title="Where & How We Measure">
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 8 }}>
        {(["primary", "secondary", "tertiary"] as const).map((tier) => {
          const c = ch[tier]; if (!c) return null;
          return (
            <View key={tier} style={{ width: "33.33%", padding: 4 }} wrap={false}>
              <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, padding: 12, backgroundColor: C.white, minHeight: 110 }}>
                <Text style={[s.cardLabel, { fontSize: 8 }]}>{tier.toUpperCase()}</Text>
                <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginVertical: 4 }}>{safe(c.name)}</Text>
                {c.freq ? <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{safe(c.freq)}</Text> : null}
                {(c.bullets || []).slice(0, 4).map((b: string, i: number) => (
                  <Text key={i} style={{ fontSize: 9, color: C.body, lineHeight: 1.4 }}>• {safe(b)}</Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      {goals.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>BUSINESS GOALS</Text>
          {goals.map((g, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: C.rule }}>
              <Text style={s.body}>{safe(g.label || g.goal || g.name)}</Text>
              <Text style={{ fontSize: 10, color: C.coral, fontFamily: "Helvetica-Bold" }}>{safe(g.value || g.target)}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={s.card} wrap={false}>
        <Text style={s.cardLabel}>BRAND HEALTH</Text>
        {[["Archetype Alignment", aa], ["Voice Consistency", vc]].map(([label, val]: any) => (
          <View key={label} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 10, color: C.ink, fontFamily: "Helvetica-Bold" }}>{label}</Text>
              <Text style={{ fontSize: 10, color: C.coral, fontFamily: "Helvetica-Bold" }}>{val.toFixed(1)} / 10</Text>
            </View>
            <View style={{ height: 6, backgroundColor: C.rule, borderRadius: 3 }}>
              <View style={{ width: `${(val / 10) * 100}%`, height: "100%", backgroundColor: C.coral, borderRadius: 3 }} />
            </View>
          </View>
        ))}
      </View>
    </SectionPage>
  );
};

// ─── 05 Competitive Positioning ──────────────────────────────────
const Competitive = ({ data }: any) => {
  const cp = data?.competitive || data?.positioning?.competitive || null;
  if (!cp || (Array.isArray(cp) && !cp.length) || (typeof cp === "object" && !Object.keys(cp).length)) return null;
  const items: any[] = Array.isArray(cp) ? cp : Object.entries(cp).map(([k, v]) => ({ label: k, value: v }));
  return (
    <SectionPage label="05 · COMPETITIVE POSITIONING" title="How You Stand Out">
      {items.map((it, i) => (
        <View key={i} style={s.card} wrap={false}>
          <Text style={s.cardLabel}>{String(it.label || it.name || `Point ${i + 1}`).toUpperCase()}</Text>
          <Text style={s.body}>{safe(it.value || it.description || it.text || it)}</Text>
        </View>
      ))}
    </SectionPage>
  );
};

// ─── 06 Action Plan ──────────────────────────────────────────────
const ActionPlan = ({ data }: any) => {
  const ap = data?.actionPlan || {};
  const weeks: any[] = ap.weeks || [];
  const r = ap.ongoingRoutine || {};
  const wColors = [C.coral, C.navy, C.green, C.muted];
  return (
    <SectionPage label="06 · ACTION PLAN" title="What To Do Next">
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 8 }}>
        {weeks.map((w, i) => {
          const color = wColors[i % wColors.length];
          return (
            <View key={i} style={{ width: "50%", padding: 4 }} wrap={false}>
              <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, backgroundColor: C.white, overflow: "hidden" }}>
                <View style={{ backgroundColor: color, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: C.white, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 1.8 }}>{String(w.week || w.label || `WEEK ${i + 1}`).toUpperCase()}</Text>
                </View>
                <View style={{ padding: 12 }}>
                  <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 6 }}>{safe(w.theme)}</Text>
                  {(w.tasks || []).map((t: any, j: number) => (
                    <Text key={j} style={{ fontSize: 9, color: C.body, lineHeight: 1.4, marginBottom: 2 }}>• {typeof t === "string" ? t : (t.title || t.task || safe(t))}</Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={s.card}>
        <Text style={s.cardLabel}>ONGOING ROUTINE</Text>
        {(["daily", "weekly", "monthly"] as const).map((tier, i) => {
          const block = r[tier]; if (!block) return null;
          const tasks: any[] = Array.isArray(block) ? block : block.tasks || [];
          return (
            <View key={tier} style={{ flexDirection: "row", paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.rule }} wrap={false}>
              <Text style={{ width: 80, fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 }}>{tier.toUpperCase()}</Text>
              <View style={{ flex: 1 }}>
                {tasks.map((t, j) => {
                  let text = "", time = "";
                  if (Array.isArray(t)) { text = t[0] || ""; time = t[1] || ""; }
                  else if (typeof t === "string") text = t;
                  else if (t) { text = t.title || t.task || ""; time = t.time || t.duration || ""; }
                  return (
                    <View key={j} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={s.body}>{text}</Text>
                      {time ? <Text style={{ fontSize: 9, color: C.muted }}>{time}</Text> : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </SectionPage>
  );
};

// ─── Back Cover ──────────────────────────────────────────────────
const BackCover = ({ data }: any) => {
  const firstName = String(data?.meta?.preparedFor || "Founder").trim().split(/\s+/)[0];
  return (
    <Page size="A4" style={{ backgroundColor: C.navy, color: C.white, padding: 0 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 56 }}>
        <Image src={LOGO_SRC} style={{ width: 180, height: 46, objectFit: "contain", marginBottom: 36 }} />
        <Text style={{ fontSize: 18, color: C.white, textAlign: "center", marginBottom: 14, fontFamily: "Helvetica-Bold" }}>
          Built with MOXIEMO
        </Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 20 }}>
          Your AI Chief Marketing Officer
        </Text>
        <Text style={{ fontSize: 14, color: C.coral, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>buildwithmoxiemo.com</Text>
        <View style={{ width: 50, height: 2, backgroundColor: C.coral, marginBottom: 36 }} />
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textAlign: "center", letterSpacing: 1 }}>
          This report was generated exclusively for {firstName}. CONFIDENTIAL.
        </Text>
      </View>
    </Page>
  );
};

// ─── Document ────────────────────────────────────────────────────
export const StrategyDocument = ({ data }: { data: any }) => (
  <Document title="MOXIEMO Strategic Report" author="MOXIEMO">
    <Cover data={data} />
    <Overview data={data} />
    <Voice data={data} />
    <Content data={data} />
    <Calendar data={data} />
    <ChannelsMetrics data={data} />
    <Competitive data={data} />
    <ActionPlan data={data} />
    <BackCover data={data} />
  </Document>
);

export async function downloadStrategyPdf(data: any, filename: string) {
  const blob = await pdf(<StrategyDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
