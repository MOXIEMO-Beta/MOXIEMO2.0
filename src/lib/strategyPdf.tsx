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
      <View style={s.row}>
        {a.brandInspiration?.length > 0 && (
          <View style={[s.card, s.col]} wrap={false}>
            <Text style={s.cardLabel}>BRANDS</Text>
            <Text style={s.body}>{a.brandInspiration.map(safe).filter(Boolean).join(", ")}</Text>
          </View>
        )}
        {a.values?.length > 0 && (
          <View style={[s.card, s.col]} wrap={false}>
            <Text style={s.cardLabel}>VALUES</Text>
            <View style={s.pillsWrap}>
              {a.values.map((v: any, i: number) => <Text key={i} style={s.pill}>{safe(v)}</Text>)}
            </View>
          </View>
        )}
      </View>
      {a.contentApproach && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>CONTENT APPROACH</Text>
          <Text style={s.body}>{safe(a.contentApproach)}</Text>
        </View>
      )}
      <View style={s.row}>
        {a.whyThisFits?.length > 0 && (
          <View style={[s.card, s.col]} wrap={false}>
            <Text style={s.cardLabel}>WHY THIS FITS YOU</Text>
            {a.whyThisFits.map((w: any, i: number) => (
              <Text key={i} style={[s.body, { marginBottom: 3 }]}>• {safe(w)}</Text>
            ))}
          </View>
        )}
        {a.howToApply?.length > 0 && (
          <View style={[s.card, s.col]} wrap={false}>
            <Text style={s.cardLabel}>HOW TO USE THIS</Text>
            {a.howToApply.map((w: any, i: number) => (
              <Text key={i} style={[s.body, { marginBottom: 3 }]}>• {safe(w)}</Text>
            ))}
          </View>
        )}
      </View>
    </SectionPage>
  );
};

// ─── 01B Core Values ─────────────────────────────────────────────
const CoreValues = ({ data }: any) => {
  const values: any[] = data?.coreValues || [];
  if (!values.length) return null;
  return (
    <SectionPage label="01B · CORE VALUES" title="Decision Filters">
      {values.map((v, i) => (
        <View key={i} style={s.card} wrap={false}>
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 6 }}>{safe(v.name)}</Text>
          {v.decisionFilter && (
            <View style={{ backgroundColor: C.coralSoft, padding: 10, borderRadius: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Oblique", color: C.ink }}>&ldquo;{safe(v.decisionFilter)}&rdquo;</Text>
            </View>
          )}
          {v.description && <Text style={[s.body, { marginBottom: 8 }]}>{safe(v.description)}</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: "#eaf7ee" }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green, letterSpacing: 1.5, marginBottom: 4 }}>YES</Text>
              {(v.yesExamples || []).map((y: any, j: number) => (
                <Text key={j} style={{ fontSize: 9, color: C.body, marginBottom: 2 }}>• {safe(y)}</Text>
              ))}
            </View>
            <View style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: "#fdecea" }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.coral, letterSpacing: 1.5, marginBottom: 4 }}>NO</Text>
              {(v.noExamples || []).map((y: any, j: number) => (
                <Text key={j} style={{ fontSize: 9, color: C.body, marginBottom: 2 }}>• {safe(y)}</Text>
              ))}
            </View>
          </View>
        </View>
      ))}
    </SectionPage>
  );
};

// ─── 02 Voice ────────────────────────────────────────────────────
const Voice = ({ data }: any) => {
  const v = data?.voice || {};
  const tonePlatform = v.toneByPlatform || {};
  const examples = v.voiceExamples || {};
  const attrsRich: any[] = v.attributesRich || [];
  return (
    <SectionPage label="02 · VOICE & BRAND IDENTITY" title="How You Sound">
      {attrsRich.length > 0 ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={s.cardLabel}>VOICE ATTRIBUTES</Text>
          {attrsRich.map((a: any, i: number) => (
            <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 2 }}>{safe(a.trait || a.name)}</Text>
              {a.meaning && <Text style={[s.body, { marginBottom: 4 }]}>{safe(a.meaning)}</Text>}
              {a.inPractice && <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>In practice: {safe(a.inPractice)}</Text>}
              {a.example && <Text style={{ fontSize: 10, fontFamily: "Helvetica-Oblique", color: C.ink }}>&ldquo;{safe(a.example)}&rdquo;</Text>}
            </View>
          ))}
        </View>
      ) : v.attributes?.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={s.cardLabel}>VOICE ATTRIBUTES</Text>
          <View style={s.pillsWrap}>
            {v.attributes.map((a: any, i: number) => <Text key={i} style={s.pillCoral}>{safe(a)}</Text>)}
          </View>
        </View>
      )}
      {Array.isArray(v.sentenceStructure) && v.sentenceStructure.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>SENTENCE STRUCTURE</Text>
          {v.sentenceStructure.map((r: any, i: number) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>• {safe(r)}</Text>
          ))}
        </View>
      )}
      {v.fullExample && (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>VOICE EXAMPLE</Text>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Oblique", color: C.ink, lineHeight: 1.5 }}>&ldquo;{safe(v.fullExample)}&rdquo;</Text>
        </View>
      )}
      <View style={s.row}>
        <View style={[s.card, s.col]} wrap={false}>
          <Text style={[s.cardLabel, { color: C.green }]}>WORDS TO USE</Text>
          <View style={s.pillsWrap}>
            {(v.wordsToUse || v.useWords || []).map((w: any, i: number) => (
              <Text key={i} style={s.pillCoral}>{safe(w)}</Text>
            ))}
          </View>
        </View>
        <View style={[s.card, s.col]} wrap={false}>
          <Text style={s.cardLabelMuted}>WORDS TO AVOID</Text>
          <View style={s.pillsWrap}>
            {(v.wordsToAvoid || v.avoidWords || []).map((w: any, i: number) => (
              <Text key={i} style={{ backgroundColor: "#f1f2f4", color: C.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 9, marginRight: 6, marginBottom: 6, textDecoration: "line-through" }}>{safe(w)}</Text>
            ))}
          </View>
        </View>
      </View>
      {Object.keys(tonePlatform).length > 0 && (
        <View>
          <Text style={[s.cardLabel, { marginBottom: 8 }]}>TONE BY PLATFORM</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
            {Object.entries(tonePlatform).map(([ch, t]: [string, any]) => {
              const tone = typeof t === "string" ? t : (t?.tone ?? t?.mode ?? "");
              const mode = typeof t === "object" ? t?.mode : "";
              const ex   = typeof t === "object" ? t?.example : "";
              return (
                <View key={ch} style={{ width: "33.33%", padding: 4 }} wrap={false}>
                  <View style={{ borderWidth: 1, borderColor: C.cardBorder, borderRadius: 8, padding: 12, backgroundColor: C.white, minHeight: 100 }}>
                    <Text style={[s.cardLabel, { fontSize: 8 }]}>{ch.toUpperCase()}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 2 }}>{safe(tone)}</Text>
                    {mode && <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{safe(mode)}</Text>}
                    {ex && <Text style={{ fontSize: 9, fontFamily: "Helvetica-Oblique", color: C.body }}>&ldquo;{safe(ex)}&rdquo;</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
      {Object.keys(examples).length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={[s.cardLabel, { marginBottom: 8 }]}>VOICE EXAMPLES</Text>
          {Object.entries(examples).map(([key, ex]: [string, any]) => (
            <View key={key} style={s.card} wrap={false}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.coral, letterSpacing: 1.5, marginBottom: 6 }}>{key.replace(/([A-Z])/g, " $1").toUpperCase()}</Text>
              {ex?.good && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 8, color: C.green, fontFamily: "Helvetica-Bold" }}>GOOD</Text>
                  <Text style={{ fontSize: 10, color: C.ink, fontFamily: "Helvetica-Oblique" }}>&ldquo;{safe(ex.good)}&rdquo;</Text>
                </View>
              )}
              {ex?.bad && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold" }}>BAD</Text>
                  <Text style={{ fontSize: 10, color: C.muted, fontFamily: "Helvetica-Oblique", textDecoration: "line-through" }}>&ldquo;{safe(ex.bad)}&rdquo;</Text>
                </View>
              )}
              {ex?.why && <Text style={{ fontSize: 9, color: C.body }}>{safe(ex.why)}</Text>}
            </View>
          ))}
        </View>
      )}
      {Array.isArray(v.neverSoundLikeRich) && v.neverSoundLikeRich.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={[s.cardLabel, { marginBottom: 8 }]}>NEVER SOUND LIKE</Text>
          {v.neverSoundLikeRich.map((n: any, i: number) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 }}>{safe(n.style || n.name)}</Text>
              {n.example && <Text style={{ fontSize: 10, color: C.muted, fontFamily: "Helvetica-Oblique", marginBottom: 3 }}>&ldquo;{safe(n.example)}&rdquo;</Text>}
              {n.why && <Text style={{ fontSize: 9, color: C.body }}>{safe(n.why)}</Text>}
            </View>
          ))}
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
        <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]}>
          <Text style={s.cardLabel}>{(q.label || `Q${i + 2}`).toUpperCase()}</Text>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 4 }}>{safe(q.theme)}</Text>
          {q.arc ? <Text style={[s.body, { marginBottom: 6 }]}>{safe(q.arc)}</Text> : null}
          {q.rationale ? (
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 2 }}>WHY THIS QUARTER</Text>
              <Text style={s.body}>{safe(q.rationale)}</Text>
            </View>
          ) : null}
          {Array.isArray(q.contentTopics) && q.contentTopics.length > 0 && (
            <View style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 4 }}>CONTENT TOPICS</Text>
              {q.contentTopics.map((t: any, j: number) => (
                <View key={j} style={{ marginBottom: 3 }} wrap={false}>
                  <Text style={{ fontSize: 9, color: C.ink, fontFamily: "Helvetica-Bold" }}>W{t.week ?? j + 1}: {safe(t.topic)}</Text>
                  {t.keyMessage && <Text style={{ fontSize: 9, color: C.body, lineHeight: 1.4 }}>{safe(t.keyMessage)}</Text>}
                </View>
              ))}
            </View>
          )}
          {q.metric ? <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>METRIC · {safe(q.metric)}</Text> : null}
          {q.cta ? <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold" }}>CTA · {safe(q.cta)}</Text> : null}
          {q.businessGoal ? <Text style={{ fontSize: 9, color: C.muted }}>BUSINESS GOAL · {safe(q.businessGoal)}</Text> : null}
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
  const leadSources: any[] = met.leadSources || [];
  const qual = met.qualification || {};
  const cp = met.contentPerformance || {};
  const bh = met.brandHealth || {};
  const n = (x: any) => { const v = Number(x) || 0; return v > 10 ? v / 10 : v; };
  const aa = n(bh.archetypeAlignment);
  const vc = n(bh.voiceConsistency);
  return (
    <SectionPage label="04 · CHANNELS & METRICS" title="Where & How We Measure">
      {(["primary", "secondary", "tertiary"] as const).map((tier) => {
        const c = ch[tier]; if (!c) return null;
        const tb = c.timeBreakdown || {};
        return (
          <View key={tier} style={s.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={[s.cardLabel, { fontSize: 8 }]}>{tier.toUpperCase()} · {safe(c.fullName ?? c.name)}</Text>
              {c.freq && <Text style={{ fontSize: 9, color: C.muted }}>{safe(c.freq)}</Text>}
            </View>
            {c.tone && <Text style={[s.body, { marginBottom: 6 }]}>{safe(c.tone)}</Text>}
            {Array.isArray(c.rationale) && c.rationale.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                {c.rationale.map((r: any, i: number) => (
                  <Text key={i} style={{ fontSize: 9, color: C.body, lineHeight: 1.4 }}>• {safe(r)}</Text>
                ))}
              </View>
            )}
            {Array.isArray(c.contentTypes) && c.contentTypes.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 3 }}>CONTENT TYPES</Text>
                {c.contentTypes.map((t: any, i: number) => (
                  <Text key={i} style={{ fontSize: 9, color: C.body }}>• {safe(t)}</Text>
                ))}
              </View>
            )}
            {Array.isArray(c.schedule) && c.schedule.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 3 }}>POSTING SCHEDULE</Text>
                {c.schedule.map((p: any, i: number) => (
                  <Text key={i} style={{ fontSize: 9, color: C.body }}>• {safe(p.day)}{p.time ? ` · ${safe(p.time)}` : ""} — {safe(p.type)}{p.example ? `: ${safe(p.example)}` : ""}</Text>
                ))}
              </View>
            )}
            {c.metrics && Object.keys(c.metrics).length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 8, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 3 }}>TARGET METRICS</Text>
                {Object.entries(c.metrics).filter(([_, v]) => v).map(([k, v]) => (
                  <Text key={k} style={{ fontSize: 9, color: C.body }}>• {k.replace(/([A-Z])/g, " $1")}: {safe(v)}</Text>
                ))}
              </View>
            )}
            {(c.hrs || Object.keys(tb).length > 0) && (
              <View>
                <Text style={{ fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 3 }}>TIME COMMITMENT {c.hrs ? `· ${safe(c.hrs)}` : ""}</Text>
                {Object.entries(tb).filter(([_, v]) => v).map(([k, v]) => (
                  <Text key={k} style={{ fontSize: 9, color: C.body }}>• {k.replace(/([A-Z])/g, " $1")}: {safe(v)}</Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
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
      {leadSources.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>PROJECTED LEAD SOURCES</Text>
          {leadSources.map((l: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: i ? 1 : 0, borderTopColor: C.rule }}>
              <Text style={s.body}>{safe(l.source)}</Text>
              <Text style={{ fontSize: 10, color: C.coral, fontFamily: "Helvetica-Bold" }}>{safe(l.percentage)}% · {safe(l.perWeek)}/wk</Text>
            </View>
          ))}
        </View>
      )}
      {Object.keys(qual).length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>LEAD QUALIFICATION MIX</Text>
          {(["highFit", "mediumFit", "lowFit"] as const).map((k) => {
            const q: any = qual[k]; if (!q) return null;
            const label = k === "highFit" ? "High Fit" : k === "mediumFit" ? "Medium Fit" : "Low Fit";
            return (
              <View key={k} style={{ paddingVertical: 4, borderTopWidth: k !== "highFit" ? 1 : 0, borderTopColor: C.rule }}>
                <Text style={{ fontSize: 10, color: C.ink, fontFamily: "Helvetica-Bold" }}>{label} · {safe(q.percentage)}%</Text>
                {q.definition && <Text style={{ fontSize: 9, color: C.body, lineHeight: 1.4 }}>{safe(q.definition)}</Text>}
              </View>
            );
          })}
        </View>
      )}
      {Object.keys(cp).length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>CONTENT PERFORMANCE TARGETS</Text>
          {Object.entries(cp).map(([channel, m]: [string, any]) => (
            <View key={channel} style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink }}>{channel.toUpperCase()}</Text>
              {Object.entries(m || {}).map(([k, v]) => (
                <Text key={k} style={{ fontSize: 9, color: C.body }}>• {k.replace(/([A-Z])/g, " $1")}: {safe(v)}</Text>
              ))}
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
  const cp = data?.competitive || {};
  const has = cp.headline || cp.landscape || cp.differentiators?.length || cp.competitiveAdvantages?.length || cp.doNotCompeteOn?.length || cp.antiClient || cp.alternatives || cp.whyYouWin;
  if (!has) return null;
  return (
    <SectionPage label="05 · COMPETITIVE POSITIONING" title="How You Stand Out">
      {cp.headline && (
        <View style={{ backgroundColor: C.navy, padding: 14, borderRadius: 8, marginBottom: 10 }} wrap={false}>
          <Text style={{ fontSize: 9, color: C.coral, fontFamily: "Helvetica-Bold", letterSpacing: 2, marginBottom: 4 }}>YOUR POSITION</Text>
          <Text style={{ fontSize: 12, color: C.white, fontFamily: "Helvetica-Bold", lineHeight: 1.5 }}>{safe(cp.headline)}</Text>
        </View>
      )}
      {cp.landscape && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>MARKET GAP</Text>
          <Text style={s.body}>{safe(cp.landscape)}</Text>
        </View>
      )}
      {Array.isArray(cp.differentiators) && cp.differentiators.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>DIFFERENTIATORS</Text>
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.rule, paddingBottom: 4 }}>
            <Text style={{ flex: 1, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 }}>FACTOR</Text>
            <Text style={{ flex: 2, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 }}>YOU</Text>
            <Text style={{ flex: 2, fontSize: 8, color: C.muted, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 }}>COMPETITORS</Text>
          </View>
          {cp.differentiators.map((d: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.rule }} wrap={false}>
              <Text style={{ flex: 1, fontSize: 9, color: C.ink, fontFamily: "Helvetica-Bold" }}>{safe(d.factor)}</Text>
              <Text style={{ flex: 2, fontSize: 9, color: C.body }}>{safe(d.you)}</Text>
              <Text style={{ flex: 2, fontSize: 9, color: C.muted }}>{safe(d.competitors)}</Text>
            </View>
          ))}
        </View>
      )}
      {Array.isArray(cp.competitiveAdvantages) && cp.competitiveAdvantages.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>COMPETITIVE ADVANTAGES</Text>
          {cp.competitiveAdvantages.map((a: any, i: number) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>• {safe(a)}</Text>
          ))}
        </View>
      )}
      {Array.isArray(cp.doNotCompeteOn) && cp.doNotCompeteOn.length > 0 && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabelMuted}>WHAT YOU DON'T COMPETE ON</Text>
          {cp.doNotCompeteOn.map((a: any, i: number) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>• {safe(a)}</Text>
          ))}
        </View>
      )}
      {cp.antiClient && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>WHO IS NOT YOUR IDEAL CLIENT</Text>
          <Text style={s.body}>{safe(cp.antiClient)}</Text>
        </View>
      )}
      {cp.alternatives && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>WHAT ARE THE ALTERNATIVES</Text>
          <Text style={s.body}>{safe(cp.alternatives)}</Text>
        </View>
      )}
      {cp.whyYouWin && (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>WHEN A CLIENT CHOOSES YOU</Text>
          <Text style={s.body}>{safe(cp.whyYouWin)}</Text>
        </View>
      )}
    </SectionPage>
  );
};

// ─── 05B Messaging in Every Format ──────────────────────────────
const MessagingFormats = ({ data }: any) => {
  const m = data?.messagingFormats || {};
  if (!m.oneLiner && !m.short && !m.elevator) return null;
  return (
    <SectionPage label="05B · MESSAGING" title="In Every Format">
      {m.oneLiner && (
        <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.coral }]} wrap={false}>
          <Text style={s.cardLabel}>ONE-LINER</Text>
          <Text style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, fontFamily: "Helvetica-Bold" }}>{safe(m.oneLiner)}</Text>
        </View>
      )}
      {m.short && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>SHORT VERSION (160 CHARS)</Text>
          <Text style={s.bodyDark}>{safe(m.short)}</Text>
        </View>
      )}
      {m.elevator && (
        <View style={s.card} wrap={false}>
          <Text style={s.cardLabel}>ELEVATOR PITCH</Text>
          <Text style={s.bodyDark}>{safe(m.elevator)}</Text>
        </View>
      )}
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
    <CoreValues data={data} />
    <Voice data={data} />
    <Content data={data} />
    <Calendar data={data} />
    <ChannelsMetrics data={data} />
    <Competitive data={data} />
    <MessagingFormats data={data} />
    <ActionPlan data={data} />
    <BackCover data={data} />
  </Document>
);

export async function downloadStrategyPdf(data: any, filename: string) {
  // eslint-disable-next-line no-console
  try { console.log('[strategyPdf] data', data); } catch {}
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
