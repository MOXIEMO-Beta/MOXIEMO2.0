import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

export type BrandKitData = {
  siteName: string;
  websiteUrl: string;
  logo?: string; // url or data url
  colors: { hex: string; rgb: string; role: string }[];
  fonts: { heading: string; body: string };
  imagery: string[];
};

const C = {
  coral: "#FF6B5C",
  ink: "#15171C",
  paper: "#F7F5F1",
  white: "#FFFFFF",
  muted: "#7a7e8c",
  border: "#e4e5ea",
};

const s = StyleSheet.create({
  page: { padding: 48, backgroundColor: C.paper, color: C.ink, fontFamily: "Helvetica", fontSize: 10 },
  eyebrow: { fontSize: 9, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 14 },
  h1: { fontSize: 28, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  h2: { fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 10, marginTop: 18 },
  sub: { fontSize: 11, color: C.muted, marginBottom: 18 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.white, padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  swatch: { width: "30%", borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.white, overflow: "hidden", marginBottom: 10 },
  swatchColor: { height: 70 },
  swatchMeta: { padding: 10 },
  swatchRole: { fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  swatchHex: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold" },
  swatchRgb: { fontSize: 9, color: C.muted, marginTop: 2 },
  fontName: { fontSize: 14, color: C.ink, fontFamily: "Helvetica-Bold" },
  fontSpec: { fontSize: 20, color: C.ink, marginTop: 8 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 24, fontSize: 9, color: C.muted, textAlign: "center" },
  pill: { backgroundColor: C.ink, color: C.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 9, marginRight: 6, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  summaryLine: { fontSize: 10, color: C.ink, marginBottom: 4 },
});

function Footer() {
  return (
    <Text style={s.footer} fixed>
      Built with MOXIEMO · buildwithmoxiemo.com · Join Beta 2.0
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

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={{ padding: 0, backgroundColor: C.ink, color: C.white }}>
        <View style={{ padding: 56, height: "100%", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 10, color: C.coral, letterSpacing: 2.5, fontFamily: "Helvetica-Bold", marginBottom: 18 }}>
              BRAND KIT
            </Text>
            <Text style={{ fontSize: 40, fontFamily: "Helvetica-Bold", color: C.white, marginBottom: 14, lineHeight: 1.05 }}>
              {data.siteName || safeHost}
            </Text>
            <Text style={{ fontSize: 13, color: "#cfd1d8" }}>{safeHost}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: "#cfd1d8", marginBottom: 6 }}>Prepared by</Text>
            <Text style={{ fontSize: 14, color: C.white, fontFamily: "Helvetica-Bold" }}>MOXIEMO</Text>
            <Text style={{ fontSize: 10, color: C.coral, marginTop: 4 }}>buildwithmoxiemo.com</Text>
          </View>
        </View>
      </Page>

      {/* Logo */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>LOGO</Text>
        <Text style={s.h1}>Your mark.</Text>
        <Text style={s.sub}>Give it room to breathe. Keep clear space around it equal to the height of the mark itself.</Text>
        <View style={s.card}>
          {data.logo ? (
            <View style={{ alignItems: "center", paddingVertical: 30 }}>
              <Image src={data.logo} style={{ maxWidth: 280, maxHeight: 140, objectFit: "contain" }} />
            </View>
          ) : (
            <Text style={{ color: C.muted, textAlign: "center", padding: 40 }}>No logo provided.</Text>
          )}
        </View>
        <Text style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>
          Use on solid backgrounds with enough contrast. Do not stretch, recolor, or crop the mark.
        </Text>
        <Footer />
      </Page>

      {/* Colors */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>COLOR PALETTE</Text>
        <Text style={s.h1}>Your colors.</Text>
        <Text style={s.sub}>Lead with your primary. Build with your secondary. Accent for moments that need attention.</Text>
        <View style={s.row}>
          {data.colors.map((c) => (
            <View key={c.hex} style={s.swatch} wrap={false}>
              <View style={[s.swatchColor, { backgroundColor: c.hex }]} />
              <View style={s.swatchMeta}>
                <Text style={s.swatchRole}>{(c.role || "").toUpperCase()}</Text>
                <Text style={s.swatchHex}>{c.hex}</Text>
                <Text style={s.swatchRgb}>{c.rgb}</Text>
              </View>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* Fonts */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>TYPOGRAPHY</Text>
        <Text style={s.h1}>Your fonts.</Text>
        <Text style={s.sub}>One for headlines. One for body. Keep it consistent and the rest gets easier.</Text>
        <View style={s.card}>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>HEADING</Text>
          <Text style={s.fontName}>{data.fonts.heading}</Text>
          <Text style={s.fontSpec}>The quick brown fox jumps over the lazy dog.</Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 8 }}>Find it at fonts.google.com or your foundry.</Text>
        </View>
        <View style={s.card}>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>BODY</Text>
          <Text style={s.fontName}>{data.fonts.body}</Text>
          <Text style={{ fontSize: 12, color: C.ink, marginTop: 8, lineHeight: 1.5 }}>
            The quick brown fox jumps over the lazy dog. Good body type is invisible. It carries the reader without asking for attention.
          </Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 8 }}>Find it at fonts.google.com or your foundry.</Text>
        </View>
        <Footer />
      </Page>

      {/* Imagery */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>IMAGERY DIRECTION</Text>
        <Text style={s.h1}>Your visual feel.</Text>
        <Text style={s.sub}>Use this when you brief a photographer, choose stock, or pick a Canva template.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
          {data.imagery.map((w) => (
            <Text key={w} style={s.pill}>{w.toUpperCase()}</Text>
          ))}
        </View>
        <View style={s.card}>
          {data.imagery.map((w) => (
            <Text key={w} style={{ fontSize: 11, color: C.ink, marginBottom: 8, lineHeight: 1.5 }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{w[0].toUpperCase() + w.slice(1)}: </Text>
              {imageryDescriptions[w] || "Use as a guide for tone and styling."}
            </Text>
          ))}
          {data.imagery.length === 0 && (
            <Text style={{ color: C.muted }}>No imagery direction selected.</Text>
          )}
        </View>
        <Footer />
      </Page>

      {/* Summary */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>QUICK USE</Text>
        <Text style={s.h1}>Paste-ready summary.</Text>
        <Text style={s.sub}>Everything in one place. Copy what you need into Figma, Canva, or your editor of choice.</Text>
        <View style={s.card}>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>COLORS</Text>
          {data.colors.map((c) => (
            <Text key={c.hex} style={s.summaryLine}>
              {c.role}: {c.hex} · {c.rgb}
            </Text>
          ))}
        </View>
        <View style={s.card}>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>FONTS</Text>
          <Text style={s.summaryLine}>Heading: {data.fonts.heading}</Text>
          <Text style={s.summaryLine}>Body: {data.fonts.body}</Text>
        </View>
        <View style={s.card}>
          <Text style={{ fontSize: 8, color: C.coral, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>IMAGERY</Text>
          <Text style={s.summaryLine}>{data.imagery.join(", ") || "—"}</Text>
        </View>
        <View style={{ marginTop: 24, padding: 16, backgroundColor: C.ink, borderRadius: 10 }}>
          <Text style={{ fontSize: 10, color: C.coral, letterSpacing: 2, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>NEXT</Text>
          <Text style={{ fontSize: 14, color: C.white, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
            This is the look. MOXIEMO builds the rest.
          </Text>
          <Text style={{ fontSize: 10, color: "#cfd1d8", lineHeight: 1.5 }}>
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