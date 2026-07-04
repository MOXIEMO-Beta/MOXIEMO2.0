import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font, pdf } from "@react-pdf/renderer";
import { deriveEnrichment } from "./brandKitEnrichment";

// Disable auto-hyphenation across the whole PDF. Prevents mid-word breaks
// like "op-erationally" inside card body copy.
Font.registerHyphenationCallback((word) => [word]);

// Convert an image URL / data URL to a desaturated (true grayscale) data URL
// using a canvas. Runs in the browser at PDF-generation time.
async function toGrayscaleDataUrl(src: string): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Native canvas filter — supported in all evergreen browsers.
    (ctx as any).filter = "grayscale(100%)";
    ctx.drawImage(img, 0, 0);
    // Fallback pixel pass in case filter was ignored.
    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        px[i] = px[i + 1] = px[i + 2] = g;
      }
      ctx.putImageData(data, 0, 0);
    } catch {
      // cross-origin taint — filter path still applied.
    }
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export type BrandKitData = {
  siteName: string;
  websiteUrl: string;
  logo?: string; // url or data url
  logoGrayscale?: string; // optional dark/mono version
  logoReversed?: string; // optional white/reversed version
  colors: { hex: string; rgb: string; role: string }[];
  fonts: { heading: string; body: string };
  imagery: string[];
  images?: string[]; // optional user-uploaded image data URLs
  // Optional strategic content — populated from the generated brand_kit row.
  // When present, the PDF adds Archetype, Voice, ICP, Messages, and Pillars
  // pages so the export matches the live in-app Brand Kit view.
  kit?: {
    brand_name?: string;
    archetype?: { primary?: string; secondary?: string; description?: string };
    voice?: { attributes?: string[]; never_use?: string[] };
    icp?: { revenue_floor?: string; business_type?: string; core_pain?: string; transformation?: string };
    key_messages?: string[];
    pillars?: { primary?: string; supporting?: string[] };
    positioning?: { statement?: string; who?: string; problem?: string; solution?: string; result?: string };
    values?: { name?: string; filter?: string }[];
    tone?: {
      words_to_use?: string[];
      words_to_avoid?: string[];
      tone_by_platform?: { platform?: string; descriptor?: string }[];
    };
  } | null;
  // Optional strategy.enhanced_foundation for deriving enrichment when the
  // kit_json lacks the newer positioning/values/tone fields.
  enhancedFoundation?: any;
};

const C = {
  coral: "#FF6B5C",
  ink: "#15171C",
  paper: "#F7F5F1",
  white: "#FFFFFF",
  muted: "#7a7e8c",
  border: "#e4e5ea",
};

// Map extracted font family name to the closest built-in PDF font.
// @react-pdf ships Helvetica, Times-Roman, and Courier reliably without registration.
const SERIF_HINTS = [
  "serif", "playfair", "merriweather", "lora", "garamond", "georgia",
  "times", "didot", "bodoni", "caslon", "baskerville", "cormorant",
  "libre", "crimson", "spectral", "fraunces", "eb garamond",
];
function pickFamily(name: string, bold = false): string {
  const n = (name || "").toLowerCase();
  const isSerif = SERIF_HINTS.some((h) => n.includes(h));
  if (isSerif) return bold ? "Times-Bold" : "Times-Roman";
  return bold ? "Helvetica-Bold" : "Helvetica";
}

// Compute contrast color (ink or white) for a given hex background.
function contrastOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return C.ink;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? C.ink : C.white;
}

const s = StyleSheet.create({
  page: { padding: 48, backgroundColor: C.paper, color: C.ink, fontFamily: "Helvetica", fontSize: 10 },
  eyebrow: { fontSize: 9, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  divider: { height: 1, backgroundColor: C.ink, marginBottom: 24, opacity: 0.9 },
  h1: { fontSize: 32, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 8, letterSpacing: -0.6 },
  sub: { fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 24, fontSize: 8, color: C.muted, textAlign: "center", letterSpacing: 0.5 },
});

function Footer() {
  return (
    <Text style={s.footer} fixed>
      BUILT WITH MOXIEMO  ·  BUILDWITHMOXIEMO.COM  ·  JOIN BETA 2.0
    </Text>
  );
}

const imageryDescriptions: Record<string, string> = {
  clean: "Plenty of white space, balanced and uncluttered.",
  warm: "Soft, human, inviting. Tones that feel lived in.",
  bold: "Strong contrast and confident composition.",
  editorial: "Magazine-quality, considered and intentional.",
  playful: "Energetic, expressive, a little unexpected.",
  refined: "Quiet luxury. Polished without being loud.",
};

const imageryGuide: Record<string, { conveys: string; use: string }> = {
  clean: {
    conveys: "Conveys clarity, confidence, and room to think. Nothing competes for attention.",
    use: "Lead with white space. Let one thing be the focus. Cut anything that does not earn its place.",
  },
  warm: {
    conveys: "Conveys approachability and humanity. It feels lived in, not staged.",
    use: "Choose soft, natural light and real moments over polished perfection. Favor tones that feel inviting.",
  },
  bold: {
    conveys: "Conveys confidence and energy. It does not whisper.",
    use: "Lead with strong color and scale. Make a statement and commit to it.",
  },
  editorial: {
    conveys: "Conveys authority and intention. It looks considered, like a magazine spread.",
    use: "Compose with purpose. Use strong type, generous margins, and imagery that feels curated rather than stock.",
  },
  playful: {
    conveys: "Conveys warmth, humor, and ease. It does not take itself too seriously.",
    use: "Use unexpected color, movement, and a lighter tone. Let personality show.",
  },
  refined: {
    conveys: "Conveys quality and restraint. Every detail looks intentional.",
    use: "Keep it minimal and precise. Let craft and spacing do the work.",
  },
};

function BrandKitDoc({ data }: { data: BrandKitData }) {
  return <BrandKitDocInner data={data} />;
}

function StrategyPages(props: {
  kit: NonNullable<BrandKitData["kit"]>;
  headingFam: string;
  bodyFam: string;
  bodyBoldFam: string;
  primary: string;
  accent: string;
  coverInk: string;
  enrichment?: ReturnType<typeof deriveEnrichment>;
}) {
  const { kit, headingFam, bodyFam, bodyBoldFam, primary, accent, coverInk, enrichment } = props;
  const arche = kit.archetype ?? {};
  const voice = kit.voice ?? {};
  const icp = kit.icp ?? {};
  const messages = Array.isArray(kit.key_messages) ? kit.key_messages : [];
  const pillars = kit.pillars ?? {};
  const supporting = Array.isArray(pillars.supporting) ? pillars.supporting : [];
  const attrs = Array.isArray(voice.attributes) ? voice.attributes : [];
  const nevers = Array.isArray(voice.never_use) ? voice.never_use : [];

  const icpRows: [string, string | undefined][] = [
    ["Revenue floor", icp.revenue_floor],
    ["Business type", icp.business_type],
    ["Core pain", icp.core_pain],
    ["Transformation", icp.transformation],
  ];

  return (
    <>
      {/* Archetype + Voice — one editorial page */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>04  ·  ARCHETYPE & VOICE</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>HOW YOU SOUND</Text>
        </View>
        <View style={s.divider} />

        <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your archetype.
        </Text>
        <Text style={{ fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5, fontFamily: bodyFam }}>
          The story pattern your brand belongs to. Everything else is a downstream expression of this.
        </Text>

        <View style={{ backgroundColor: C.ink, padding: 22, borderRadius: 4, marginBottom: 22 }}>
          <Text style={{ fontSize: 9, color: accent, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>PRIMARY  ·  SECONDARY</Text>
          <Text style={{ fontSize: 30, color: C.white, fontFamily: headingFam, letterSpacing: -0.6, marginBottom: 4 }}>
            {arche.primary || "—"}
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: bodyFam, marginBottom: 14 }}>
            with {arche.secondary || "—"}
          </Text>
          {arche.description ? (
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontFamily: bodyFam, lineHeight: 1.6 }}>
              {arche.description}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>VOICE ATTRIBUTES</Text>
            {attrs.length ? attrs.map((a, i) => (
              <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: accent, backgroundColor: C.white, padding: "8px 12px", marginBottom: 6, borderRadius: 3 }}>
                <Text style={{ fontSize: 11, color: C.ink, fontFamily: bodyBoldFam }}>{a}</Text>
              </View>
            )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Not provided.</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>NEVER USE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {nevers.length ? nevers.map((n, i) => (
                <Text key={i} style={{ fontSize: 10, color: C.muted, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: "3px 10px", textDecoration: "line-through" }}>
                  {n}
                </Text>
              )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Not provided.</Text>}
            </View>
          </View>
        </View>
        <Footer />
      </Page>

      {/* ICP */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>05  ·  IDEAL CLIENT</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>WHO YOU SERVE</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your buyer.
        </Text>
        <Text style={{ fontSize: 11, color: C.muted, marginBottom: 22, lineHeight: 1.5, fontFamily: bodyFam }}>
          The specific human this brand is built for. Use these details to keep every message aimed.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {icpRows.map(([label, value], i) => (
            <View key={label} style={{ width: "50%", padding: 6 }} wrap={false}>
              <View style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16, minHeight: 110 }}>
                <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
                  0{i + 1}  ·  {label.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 13, color: C.ink, fontFamily: bodyBoldFam, lineHeight: 1.45 }}>
                  {value?.trim() ? value : "Not provided."}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* Key messages + Content pillars */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>06  ·  MESSAGES & PILLARS</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>WHAT YOU SAY</Text>
        </View>
        <View style={s.divider} />

        <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your messages.
        </Text>
        <Text style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.5, fontFamily: bodyFam }}>
          Paste-ready copy for bios, pitches, and hero sections. Say these often.
        </Text>
        {messages.length ? messages.map((m, i) => (
          <View key={i} style={{ backgroundColor: C.white, borderLeftWidth: 3, borderLeftColor: accent, borderRadius: 4, padding: "12px 16px", marginBottom: 8 }} wrap={false}>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
              0{i + 1}
            </Text>
            <Text style={{ fontSize: 13, color: C.ink, fontFamily: bodyFam, lineHeight: 1.5 }}>
              {m}
            </Text>
          </View>
        )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Not provided.</Text>}

        <View style={{ marginTop: 26, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.8 }} />
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 3, fontFamily: "Helvetica-Bold" }}>PILLARS</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.8 }} />
        </View>

        <Text style={{ fontSize: 22, color: C.ink, fontFamily: headingFam, marginBottom: 12, letterSpacing: -0.5 }}>
          Your content pillars.
        </Text>

        {pillars.primary ? (
          <View style={{ backgroundColor: primary, padding: 16, borderRadius: 4, marginBottom: 12 }}>
            <Text style={{ fontSize: 8, color: coverInk, opacity: 0.75, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>PRIMARY PILLAR</Text>
            <Text style={{ fontSize: 18, color: coverInk, fontFamily: headingFam, letterSpacing: -0.3 }}>{pillars.primary}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {supporting.length ? supporting.map((p, i) => (
            <Text key={i} style={{ fontSize: 11, color: C.ink, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: "5px 12px" }}>
              {p}
            </Text>
          )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Supporting pillars not provided.</Text>}
        </View>
        <Footer />
      </Page>

      {enrichment ? (
        <EnrichmentPages
          enrichment={enrichment}
          headingFam={headingFam}
          bodyFam={bodyFam}
          bodyBoldFam={bodyBoldFam}
          primary={primary}
          accent={accent}
          coverInk={coverInk}
        />
      ) : null}
    </>
  );
}

function EnrichmentPages({ enrichment, headingFam, bodyFam, bodyBoldFam, primary, accent, coverInk }: {
  enrichment: ReturnType<typeof deriveEnrichment>;
  headingFam: string;
  bodyFam: string;
  bodyBoldFam: string;
  primary: string;
  accent: string;
  coverInk: string;
}) {
  const p = enrichment.positioning;
  const values = enrichment.values ?? [];
  const tone = enrichment.tone ?? { words_to_use: [], words_to_avoid: [], tone_by_platform: [] };
  const posCells: [string, string][] = p
    ? [
        ["Who", p.who || "Not provided."],
        ["Problem", p.problem || "Not provided."],
        ["Solution", p.solution || "Not provided."],
        ["Result", p.result || "Not provided."],
      ]
    : [];

  return (
    <>
      {/* Positioning */}
      {p ? (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>07  ·  POSITIONING</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>WHERE YOU STAND</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>Where you stand.</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5, fontFamily: bodyFam }}>
            The distilled promise of your brand, and the four pieces it rests on.
          </Text>
          {p.statement ? (
            <View style={{ backgroundColor: C.ink, padding: 22, borderRadius: 4, marginBottom: 22 }}>
              <Text style={{ fontSize: 9, color: accent, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>POSITIONING STATEMENT</Text>
              <Text style={{ fontSize: 15, color: C.white, fontFamily: bodyFam, lineHeight: 1.55 }}>{p.statement}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {posCells.map(([label, value], i) => (
              <View key={label} style={{ width: "50%", padding: 6 }} wrap={false}>
                <View style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16, minHeight: 110 }}>
                  <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
                    0{i + 1}  ·  {label.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.ink, fontFamily: bodyBoldFam, lineHeight: 1.5 }}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      ) : null}

      {/* Values */}
      {values.length ? (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>08  ·  VALUES</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>HOW YOU DECIDE</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>How you decide.</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5, fontFamily: bodyFam }}>
            Every value is a decision filter. When you are not sure, ask the question.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {values.map((v, i) => (
              <View key={v.name + i} style={{ width: "50%", padding: 6 }} wrap={false}>
                <View style={{ backgroundColor: C.white, borderLeftWidth: 3, borderLeftColor: accent, borderRadius: 4, padding: 16, minHeight: 120 }}>
                  <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
                    0{i + 1}  ·  VALUE
                  </Text>
                  <Text style={{ fontSize: 15, color: C.ink, fontFamily: headingFam, letterSpacing: -0.3, marginBottom: 8 }}>{v.name}</Text>
                  {v.filter ? (
                    <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam, lineHeight: 1.5, fontStyle: "italic" }}>{v.filter}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      ) : null}

      {/* Tone */}
      {(tone.words_to_use.length || tone.words_to_avoid.length || tone.tone_by_platform.length) ? (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>09  ·  TONE</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>WORDS & RHYTHM</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>Words and rhythm.</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5, fontFamily: bodyFam }}>
            The exact language that carries your voice, and how it shifts across channels.
          </Text>

          <View style={{ flexDirection: "row", gap: 14, marginBottom: 22 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>WORDS TO USE</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {tone.words_to_use.length ? tone.words_to_use.map((w, i) => (
                  <Text key={i} style={{ fontSize: 10, color: accent, backgroundColor: "#FEF1EE", borderRadius: 12, padding: "3px 10px", fontFamily: bodyBoldFam }}>{w}</Text>
                )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Not provided.</Text>}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>WORDS TO AVOID</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {tone.words_to_avoid.length ? tone.words_to_avoid.map((w, i) => (
                  <Text key={i} style={{ fontSize: 10, color: C.muted, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: "3px 10px", textDecoration: "line-through" }}>{w}</Text>
                )) : <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Not provided.</Text>}
              </View>
            </View>
          </View>

          <View style={{ marginTop: 6, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.8 }} />
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 3, fontFamily: "Helvetica-Bold" }}>TONE BY PLATFORM</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.8 }} />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {tone.tone_by_platform.map((t, i) => (
              <View key={t.platform + i} style={{ flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14, minHeight: 100 }} wrap={false}>
                <Text style={{ fontSize: 8, color: accent, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>{t.platform.toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: C.ink, fontFamily: bodyBoldFam, lineHeight: 1.5 }}>{t.descriptor}</Text>
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      ) : null}
    </>
  );
}

function BrandKitDocInner({ data }: { data: BrandKitData }) {
  const safeHost = (() => {
    try {
      return new URL(data.websiteUrl.startsWith("http") ? data.websiteUrl : `https://${data.websiteUrl}`).hostname;
    } catch {
      return data.websiteUrl;
    }
  })();

  // Resolve brand palette with safe fallbacks.
  const primary = data.colors.find((c) => /primary/i.test(c.role))?.hex || data.colors[0]?.hex || C.ink;
  const secondary = data.colors.find((c) => /secondary/i.test(c.role))?.hex || data.colors[1]?.hex || C.paper;
  const accent = data.colors.find((c) => /accent/i.test(c.role))?.hex || data.colors[2]?.hex || C.coral;
  const coverInk = contrastOn(primary);
  const coverMuted = coverInk === C.white ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";

  const headingFam = pickFamily(data.fonts.heading, true);
  const bodyFam = pickFamily(data.fonts.body, false);
  const bodyBoldFam = pickFamily(data.fonts.body, true);

  return (
    <Document>
      {/* Cover — full-bleed primary color */}
      <Page size="A4" style={{ padding: 0, backgroundColor: primary, color: coverInk }}>
        <View style={{ padding: 56, height: "100%", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ fontSize: 10, color: coverInk, letterSpacing: 3, fontFamily: "Helvetica-Bold" }}>
              BRAND KIT
            </Text>
            <Text style={{ fontSize: 9, color: coverMuted, letterSpacing: 1.5, fontFamily: "Helvetica" }}>
              {new Date().getFullYear()}  ·  EDITION 01
            </Text>
          </View>

          <View style={{ alignItems: "center", textAlign: "center" }}>
            <Text
              style={{
                fontSize: 64,
                fontFamily: headingFam,
                color: coverInk,
                lineHeight: 1.02,
                letterSpacing: -1.5,
                marginBottom: 22,
              }}
            >
              {data.siteName || safeHost}
            </Text>
            <View style={{ height: 1, width: 80, backgroundColor: coverInk, opacity: 0.7, marginBottom: 18 }} />
            <Text style={{ fontSize: 12, color: coverInk, letterSpacing: 2, fontFamily: "Helvetica" }}>
              {safeHost.toUpperCase()}
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 8, color: coverMuted, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              PREPARED BY MOXIEMO  ·  BUILDWITHMOXIEMO.COM
            </Text>
          </View>
        </View>
      </Page>

      {/* Logo — three versions, each on a matched background */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>01  ·  LOGO</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{safeHost.toUpperCase()}</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ fontSize: 36, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your mark.
        </Text>
        <Text style={s.sub}>Three versions so it always reads. Match the version to the background.</Text>

        {/* Hero — oversized full-color mark */}
        <View style={{ marginTop: 4 }}>
          <View
            style={{
              backgroundColor: C.paper,
              height: 280,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: C.border,
              padding: 24,
              overflow: "hidden",
            }}
          >
            {data.logo ? (
              <Image src={data.logo} style={{ maxWidth: 360, maxHeight: 230, objectFit: "contain" }} />
            ) : (
              <Text style={{ color: C.muted, fontFamily: bodyFam, fontSize: 10 }}>Logo not provided.</Text>
            )}
          </View>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginTop: 10 }}>
            FULL COLOR  ·  PRIMARY MARK
          </Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 3, fontFamily: bodyFam, lineHeight: 1.45 }}>
            Lead with this version. Use on light, neutral surfaces where the color reads clearly.
          </Text>
        </View>

        {/* Two supporting versions side by side */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
          {[
            { label: "GRAYSCALE", caption: "Use when color is not available.", bg: C.white, ink: C.ink, src: data.logoGrayscale || data.logo, isReversed: false },
            { label: "REVERSED", caption: "Use on dark or brand-colored fields.", bg: primary, ink: coverInk, src: data.logoReversed, isReversed: true },
          ].map((v, i) => (
            <View key={i} style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: v.bg,
                  height: 130,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: v.bg === C.white ? 1 : 0,
                  borderColor: C.border,
                  padding: 14,
                  overflow: "hidden",
                }}
              >
                {v.src ? (
                  <Image src={v.src} style={{ maxWidth: 120, maxHeight: 90, objectFit: "contain" }} />
                ) : (
                  <Text style={{ color: v.ink, opacity: 0.6, fontFamily: bodyFam, fontSize: 9, textAlign: "center" }}>
                    {v.isReversed ? "Add a white version to fill this slot." : "Not provided."}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginTop: 8 }}>
                {v.label}
              </Text>
              <Text style={{ fontSize: 9, color: C.muted, marginTop: 2, fontFamily: bodyFam, lineHeight: 1.45 }}>
                {v.caption}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", marginTop: 18, gap: 24, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              CLEAR SPACE
            </Text>
            <Text style={{ fontSize: 9, color: C.ink, lineHeight: 1.5, fontFamily: bodyFam }}>
              Keep clear space around the mark equal to its own height. Let it breathe so it reads as a signature, not a sticker.
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              MATCH THE BACKGROUND
            </Text>
            <Text style={{ fontSize: 9, color: C.ink, lineHeight: 1.5, fontFamily: bodyFam }}>
              Use the color or grayscale mark on light. Use the reversed mark on dark or saturated brand color. Never place the color mark on a field where it disappears.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* Colors — all swatches on a single composed page */}
      <Page size="A4" style={{ padding: 0, backgroundColor: C.paper, color: C.ink }}>
        <View style={{ padding: 48, paddingBottom: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>02  ·  COLOR</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{data.colors.length} TONES</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 32, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
            Your colors.
          </Text>
          <Text style={s.sub}>Lead with primary. Build with secondary. Accent for moments that need attention.</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 48 }}>
          {(() => {
            // 2-col x 3-row even grid. Every block is the same size.
            const cols = data.colors.slice(0, 6);
            return cols.map((c, i) => {
              const ink = contrastOn(c.hex);
              return (
                <View
                  key={c.hex + i}
                  style={{
                    width: "50%",
                    height: 165,
                    backgroundColor: c.hex,
                    padding: 18,
                    justifyContent: "space-between",
                  }}
                  wrap={false}
                >
                  <Text style={{ fontSize: 8, color: ink, letterSpacing: 2, fontFamily: "Helvetica-Bold", opacity: 0.85 }}>
                    {(c.role || `TONE ${String.fromCharCode(64 + i + 1)}`).toUpperCase()}
                  </Text>
                  <View>
                    <Text style={{ fontSize: 20, color: ink, fontFamily: headingFam, letterSpacing: -0.4 }}>
                      {c.hex.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 9, color: ink, opacity: 0.85, marginTop: 2, fontFamily: bodyFam }}>
                      {c.rgb}
                    </Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>
        <Footer />
      </Page>

      {/* Typography + Imagery direction — combined editorial page */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>03  ·  TYPE & IMAGERY</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>HOW IT FEELS</Text>
        </View>
        <View style={s.divider} />

        {/* Heading hero */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              HEADING  ·  {data.fonts.heading.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>Aa  Bb  Cc  123</Text>
          </View>
          <View style={{ backgroundColor: primary, padding: 22, borderRadius: 4 }}>
            <Text style={{ fontSize: 42, color: coverInk, fontFamily: headingFam, lineHeight: 1.0, letterSpacing: -1.2 }}>
              Make it unmistakable.
            </Text>
          </View>
        </View>

        {/* Body specimen */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              BODY  ·  {data.fonts.body.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>Aa  Bb  Cc  123</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 10 }}>
            <Text style={{ fontSize: 11, color: C.ink, fontFamily: bodyFam, lineHeight: 1.55 }}>
              Good body type is invisible. It carries the reader without asking for attention. Use it for paragraphs, captions, and anything that needs to be read rather than admired.
            </Text>
          </View>
        </View>

        {/* Section break */}
        <View style={{ marginTop: 28, marginBottom: 22, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.9 }} />
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 3, fontFamily: "Helvetica-Bold" }}>·  ·  ·</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.ink, opacity: 0.9 }} />
        </View>

        {/* Imagery direction */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              IMAGERY DIRECTION  ·  YOUR VISUAL FEEL
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>BRIEF WITH THIS</Text>
          </View>

          {data.imagery.length === 0 ? (
            <Text style={{ color: C.muted, fontFamily: bodyFam, fontSize: 10 }}>No imagery direction selected.</Text>
          ) : (
            <View>
              {data.imagery.map((w, i) => {
                const fields = [primary, secondary, accent];
                const bg = fields[i % fields.length];
                const ink = contrastOn(bg);
                const guide = imageryGuide[w] || {
                  conveys: imageryDescriptions[w] || "Use as a guide for tone and styling.",
                  use: "Apply with intention so it carries your feel.",
                };
                return (
                  <View
                    key={w + i}
                    style={{
                      backgroundColor: bg,
                      padding: 14,
                      marginBottom: 8,
                      borderRadius: 4,
                      flexDirection: "row",
                      alignItems: "flex-start",
                    }}
                    wrap={false}
                  >
                    <Text style={{ fontSize: 9, color: ink, opacity: 0.7, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, width: 24, marginTop: 4 }}>
                      0{i + 1}
                    </Text>
                    <View style={{ width: 110 }}>
                      <Text style={{ fontSize: 22, color: ink, fontFamily: headingFam, letterSpacing: -0.5 }}>
                        {w[0].toUpperCase() + w.slice(1)}.
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: ink, fontFamily: bodyFam, lineHeight: 1.5, opacity: 0.95, marginBottom: 4 }}>
                        {guide.conveys}
                      </Text>
                      <Text style={{ fontSize: 9, color: ink, fontFamily: bodyFam, lineHeight: 1.5, opacity: 0.85 }}>
                        <Text style={{ fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>HOW TO USE.  </Text>
                        {guide.use}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <Footer />
      </Page>

      {/* Strategic content pages — Archetype, Voice, ICP, Messages, Pillars.
          Rendered only when the caller passes generated kit content so the
          exported PDF matches the live Brand Kit view section-for-section. */}
      {data.kit && (
        <StrategyPages
          kit={data.kit}
          headingFam={headingFam}
          bodyFam={bodyFam}
          bodyBoldFam={bodyBoldFam}
          primary={primary}
          accent={accent}
          coverInk={coverInk}
          enrichment={deriveEnrichment(data.kit, { enhanced_foundation: data.enhancedFoundation })}
        />
      )}

      {/* Imagery showcase — optional, only when user uploaded images */}
      {data.images && data.images.length > 0 && (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>04  ·  YOUR IMAGERY</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{data.images.length} REFERENCE{data.images.length === 1 ? "" : "S"}</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 30, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
            Your imagery.
          </Text>
          <Text style={s.sub}>The images that carry your brand's feel. Use these as your reference when you create.</Text>

          {(() => {
            const imgs = data.images!.slice(0, 6);
            const n = imgs.length;
            // Choose a grid that always fits one A4 page (~620pt available after header/footer).
            const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
            const rows = Math.ceil(n / cols);
            // Reserve ~210pt for eyebrow, divider, heading, sub, and footer breathing room.
            const available = 560;
            const gap = 8;
            const cellHeight = Math.floor((available - gap * (rows - 1)) / rows);
            const widthPct = `${100 / cols}%`;
            return (
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 8 }}>
                {imgs.map((src, i) => (
                  <View
                    key={i}
                    style={{ width: widthPct, padding: 4 }}
                    wrap={false}
                  >
                    <View
                      style={{
                        backgroundColor: secondary,
                        height: cellHeight,
                        borderRadius: 4,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Image src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </View>
                  </View>
                ))}
              </View>
            );
          })()}
          <Footer />
        </Page>
      )}

      {/* Quote — editorial pull-quote page (intentional breathing room) */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>·  A MOMENT  ·</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>PAUSE</Text>
        </View>
        <View style={s.divider} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: 38,
              color: C.ink,
              fontFamily: headingFam,
              textAlign: "center",
              lineHeight: 1.18,
              letterSpacing: -0.8,
              marginBottom: 36,
            }}
          >
            "Take a deep breath and trust the process."
          </Text>
          <View style={{ height: 1, width: 60, backgroundColor: C.ink, opacity: 0.6, marginBottom: 18 }} />
          <Text style={{ fontSize: 9, color: C.muted, letterSpacing: 3, fontFamily: "Helvetica-Bold" }}>
            KAREE  LAING
          </Text>
        </View>
        <Footer />
      </Page>

      {/* Summary — quick-use */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>05  ·  QUICK USE</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>PASTE READY</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ fontSize: 36, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Everything, in one place.
        </Text>
        <Text style={s.sub}>Copy what you need into Figma, Canva, or your editor of choice.</Text>

        <View style={{ flexDirection: "row", gap: 14, marginTop: 6 }}>
          <View style={{ flex: 1, backgroundColor: C.white, padding: 16, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: primary }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>COLORS</Text>
            {data.colors.map((c) => (
              <View key={c.hex} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ width: 12, height: 12, backgroundColor: c.hex, marginRight: 8 }} />
                <Text style={{ fontSize: 10, color: C.ink, fontFamily: bodyBoldFam }}>{c.hex}</Text>
                <Text style={{ fontSize: 9, color: C.muted, marginLeft: 8, fontFamily: bodyFam }}>{c.role}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1, backgroundColor: C.white, padding: 16, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: accent }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>FONTS</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Heading</Text>
            <Text style={{ fontSize: 14, color: C.ink, fontFamily: headingFam, marginBottom: 10 }}>{data.fonts.heading}</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam }}>Body</Text>
            <Text style={{ fontSize: 14, color: C.ink, fontFamily: bodyBoldFam }}>{data.fonts.body}</Text>
            <View style={{ height: 14 }} />
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>IMAGERY</Text>
            <Text style={{ fontSize: 10, color: C.ink, fontFamily: bodyFam, lineHeight: 1.5 }}>
              {data.imagery.map((w) => w[0].toUpperCase() + w.slice(1)).join(", ") || "—"}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 26, padding: 24, backgroundColor: C.ink, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>WHAT IS NEXT</Text>
          <Text style={{ fontSize: 22, color: C.white, fontFamily: headingFam, marginBottom: 8, letterSpacing: -0.4 }}>
            This is the look. MOXIEMO builds the rest.
          </Text>
          <Text style={{ fontSize: 10, color: "#cfd1d8", lineHeight: 1.55, fontFamily: bodyFam }}>
            Your brand kit is the surface. The strategy, content, and marketing underneath is what we build with you. Join Beta 2.0 at buildwithmoxiemo.com.
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

export async function generateBrandKitPdf(data: BrandKitData): Promise<Blob> {
  return await pdf(<BrandKitDoc data={data} />).toBlob();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}