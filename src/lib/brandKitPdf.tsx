import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

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

        {(() => {
          // Three slots. Always match version to background so nothing disappears.
          const variants: { label: string; caption: string; bg: string; ink: string; src?: string; isReversed?: boolean }[] = [
            { label: "FULL COLOR", caption: "Use on light, neutral surfaces.", bg: C.white, ink: C.ink, src: data.logo },
            { label: "GRAYSCALE", caption: "Use when color is not available.", bg: C.paper, ink: C.ink, src: data.logoGrayscale || data.logo },
            { label: "REVERSED", caption: "Use on dark or brand-colored fields.", bg: primary, ink: coverInk, src: data.logoReversed, isReversed: true },
          ];
          return (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              {variants.map((v, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <View
                    style={{
                      backgroundColor: v.bg,
                      height: 220,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: v.bg === C.white ? 1 : 0,
                      borderColor: C.border,
                      padding: 16,
                      overflow: "hidden",
                    }}
                  >
                    {v.src ? (
                      <Image src={v.src} style={{ maxWidth: 140, maxHeight: 140, objectFit: "contain" }} />
                    ) : (
                      <Text style={{ color: v.ink, opacity: 0.55, fontFamily: bodyFam, fontSize: 9, textAlign: "center" }}>
                        {v.isReversed ? "Add a white version to fill this slot." : "Not provided."}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.8, fontFamily: "Helvetica-Bold", marginTop: 10 }}>
                    {v.label}
                  </Text>
                  <Text style={{ fontSize: 9, color: C.muted, marginTop: 3, fontFamily: bodyFam, lineHeight: 1.45 }}>
                    {v.caption}
                  </Text>
                </View>
              ))}
            </View>
          );
        })()}

        <View style={{ flexDirection: "row", marginTop: 26, gap: 24, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              CLEAR SPACE
            </Text>
            <Text style={{ fontSize: 10, color: C.ink, lineHeight: 1.55, fontFamily: bodyFam }}>
              Keep clear space around the mark equal to its own height. Let it breathe so it reads as a signature, not a sticker.
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              MATCH THE BACKGROUND
            </Text>
            <Text style={{ fontSize: 10, color: C.ink, lineHeight: 1.55, fontFamily: bodyFam }}>
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
        <View style={{ marginBottom: 18 }}>
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

        {/* Imagery direction */}
        <View style={{ borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
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
                return (
                  <View
                    key={w + i}
                    style={{
                      backgroundColor: bg,
                      padding: 14,
                      marginBottom: 8,
                      borderRadius: 4,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    wrap={false}
                  >
                    <Text style={{ fontSize: 9, color: ink, opacity: 0.7, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, width: 28 }}>
                      0{i + 1}
                    </Text>
                    <Text style={{ fontSize: 22, color: ink, fontFamily: headingFam, letterSpacing: -0.5, width: 130 }}>
                      {w[0].toUpperCase() + w.slice(1)}.
                    </Text>
                    <Text style={{ flex: 1, fontSize: 10, color: ink, fontFamily: bodyFam, lineHeight: 1.5, opacity: 0.92 }}>
                      {imageryDescriptions[w] || "Use as a guide for tone and styling."}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <Footer />
      </Page>

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

          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginTop: 8 }}>
            {data.images.slice(0, 6).map((src, i) => (
              <View
                key={i}
                style={{
                  width: "50%",
                  padding: 4,
                }}
                wrap={false}
              >
                <View style={{ backgroundColor: secondary, height: 200, borderRadius: 4, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                  <Image src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </View>
              </View>
            ))}
          </View>
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