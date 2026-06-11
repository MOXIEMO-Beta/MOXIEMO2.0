import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

export type BrandKitData = {
  siteName: string;
  websiteUrl: string;
  logo?: string; // url or data url
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

      {/* Logo — editorial frame */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>01  ·  LOGO</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{safeHost.toUpperCase()}</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ fontSize: 36, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your mark.
        </Text>
        <Text style={s.sub}>The signature you sign every piece of work with.</Text>

        <View
          style={{
            backgroundColor: secondary,
            height: 340,
            borderRadius: 4,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          {/* clear-space ticks */}
          <View style={{ position: "absolute", top: 24, left: 24, width: 22, height: 1, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", top: 24, left: 24, width: 1, height: 22, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", top: 24, right: 24, width: 22, height: 1, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", top: 24, right: 24, width: 1, height: 22, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", bottom: 24, left: 24, width: 22, height: 1, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", bottom: 24, left: 24, width: 1, height: 22, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", bottom: 24, right: 24, width: 22, height: 1, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />
          <View style={{ position: "absolute", bottom: 24, right: 24, width: 1, height: 22, backgroundColor: contrastOn(secondary), opacity: 0.35 }} />

          {data.logo ? (
            <Image src={data.logo} style={{ maxWidth: 320, maxHeight: 200, objectFit: "contain" }} />
          ) : (
            <Text style={{ color: contrastOn(secondary), opacity: 0.6, fontFamily: bodyFam, fontSize: 12 }}>
              No logo provided.
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", marginTop: 22, gap: 24 }}>
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
              USE WELL
            </Text>
            <Text style={{ fontSize: 10, color: C.ink, lineHeight: 1.55, fontFamily: bodyFam }}>
              Place on solid backgrounds with enough contrast. Do not stretch, recolor, or crop the mark.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* Colors — full-bleed color fields */}
      <Page size="A4" style={{ padding: 0, backgroundColor: C.paper, color: C.ink }}>
        <View style={{ padding: 48, paddingBottom: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={s.eyebrow}>02  ·  COLOR</Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{data.colors.length} TONES</Text>
          </View>
          <View style={s.divider} />
          <Text style={{ fontSize: 36, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
            Your colors.
          </Text>
          <Text style={s.sub}>Lead with primary. Build with secondary. Accent for moments that need attention.</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 48 }}>
          {(() => {
            const cols = data.colors.slice(0, 6);
            const n = cols.length || 1;
            // First color = hero (full width). Rest in a grid of 2 columns.
            return cols.map((c, i) => {
              const ink = contrastOn(c.hex);
              const isHero = i === 0;
              const width = isHero ? "100%" : "50%";
              const height = isHero ? 200 : 150;
              return (
                <View
                  key={c.hex + i}
                  style={{
                    width,
                    height,
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
                    <Text style={{ fontSize: isHero ? 28 : 18, color: ink, fontFamily: headingFam, letterSpacing: -0.4 }}>
                      {c.hex.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 9, color: ink, opacity: 0.85, marginTop: 4, fontFamily: bodyFam }}>
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

      {/* Typography — display specimen */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>03  ·  TYPOGRAPHY</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>TWO FAMILIES</Text>
        </View>
        <View style={s.divider} />

        {/* Heading hero */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              HEADING  ·  {data.fonts.heading.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>Aa  Bb  Cc  123</Text>
          </View>
          <View style={{ backgroundColor: primary, padding: 28, borderRadius: 4 }}>
            <Text style={{ fontSize: 56, color: coverInk, fontFamily: headingFam, lineHeight: 1.0, letterSpacing: -1.5 }}>
              Make it
            </Text>
            <Text style={{ fontSize: 56, color: coverInk, fontFamily: headingFam, lineHeight: 1.0, letterSpacing: -1.5 }}>
              unmistakable.
            </Text>
          </View>
        </View>

        {/* Body specimen */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold" }}>
              BODY  ·  {data.fonts.body.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>Aa  Bb  Cc  123</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 16 }}>
            <Text style={{ fontSize: 14, color: C.ink, fontFamily: bodyFam, lineHeight: 1.55 }}>
              Good body type is invisible. It carries the reader without asking for attention. Use it for paragraphs, captions, and anything that needs to be read rather than admired. Keep line length comfortable. Keep weight consistent. Let the heading do the shouting.
            </Text>
            <Text style={{ fontSize: 10, color: C.muted, fontFamily: bodyFam, marginTop: 14, lineHeight: 1.55 }}>
              Find it at fonts.google.com or your foundry. Pair it only with the heading above.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>

      {/* Imagery — editorial fields */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <Text style={s.eyebrow}>04  ·  IMAGERY</Text>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>VISUAL DIRECTION</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ fontSize: 36, color: C.ink, fontFamily: headingFam, marginBottom: 6, letterSpacing: -0.8 }}>
          Your visual feel.
        </Text>
        <Text style={s.sub}>Use this when you brief a photographer, choose stock, or pick a template.</Text>

        {data.imagery.length === 0 ? (
          <Text style={{ color: C.muted, fontFamily: bodyFam }}>No imagery direction selected.</Text>
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
                    padding: 20,
                    marginBottom: 10,
                    borderRadius: 4,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  wrap={false}
                >
                  <Text style={{ fontSize: 10, color: ink, opacity: 0.7, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, width: 32 }}>
                    0{i + 1}
                  </Text>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 18 }}>
                    <Text style={{ fontSize: 28, color: ink, fontFamily: headingFam, letterSpacing: -0.6, width: 150 }}>
                      {w[0].toUpperCase() + w.slice(1)}.
                    </Text>
                    <Text style={{ flex: 1, fontSize: 11, color: ink, fontFamily: bodyFam, lineHeight: 1.5, opacity: 0.92 }}>
                      {imageryDescriptions[w] || "Use as a guide for tone and styling."}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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