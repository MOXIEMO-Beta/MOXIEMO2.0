import jsPDF from "jspdf";
import { toast } from "sonner";
import logoUrl from "@/assets/moxie-logo-full.png";

/**
 * Data-driven PDF export. Reads directly from the strategy object so every
 * section is included regardless of which tab is currently mounted.
 *
 * Visual language mirrors the editorial Studio SB / MOXIE brand audit
 * reference: cream paper background, large serif display headlines,
 * pill-shaped eyebrow tags, sage-green bordered callout cards, gold accents.
 */

type StrategyLike = any;

const COLORS = {
  // Editorial palette inspired by the Studio SB reference.
  ink: [22, 28, 38] as const,        // near-black navy for headlines
  body: [45, 52, 64] as const,       // body copy
  muted: [120, 124, 130] as const,
  rule: [214, 208, 192] as const,
  accent: [196, 156, 76] as const,   // gold rule
  sage: [110, 130, 95] as const,     // sage-green left border on cards
  sageSoft: [232, 236, 224] as const,
  coral: [240, 130, 120] as const,   // confidential banner
  coralSoft: [248, 200, 195] as const,
  cream: [244, 240, 226] as const,   // page background
  softCream: [250, 247, 235] as const,
  white: [255, 255, 255] as const,
};

// Spacing scale — single source of truth so vertical rhythm stays consistent.
const SPACING = {
  afterEyebrow: 10,
  afterLabel: 6,
  afterParagraph: 8,
  afterKeyValue: 10,
  afterBulletList: 8,
  afterCallout: 14,
  afterHr: 14,
  beforeHr: 6,
  bulletIndent: 16,
  bulletGap: 4,
  lineHeightRatio: 1.35,
};

interface Ctx {
  pdf: jsPDF;
  pageW: number;
  pageH: number;
  margin: number;
  contentW: number;
  y: number;
  brand: string;
  sectionTitle: string;
  sectionNumber: number;
}

function newPage(ctx: Ctx, sectionTitle?: string) {
  ctx.pdf.addPage();
  if (sectionTitle) ctx.sectionTitle = sectionTitle;
  paintBackground(ctx);
  drawHeader(ctx);
  ctx.y = ctx.margin + 84;
}

/**
 * Append " (cont.)" to a section title, but never stack multiple suffixes.
 */
function contTitle(title: string): string {
  return /\(cont\.\)$/i.test(title) ? title : `${title} (cont.)`;
}

/**
 * jsPDF retains state like charSpace across operations; reset before any
 * text we don't want tracked. Built-in PDF fonts also lack many Unicode
 * glyphs (emoji, smart symbols) — strip those rather than render tofu.
 */
function resetText(pdf: jsPDF) {
  pdf.setCharSpace(0);
}

function safe(text: any): string {
  if (text == null) return "";
  // Replace fancy quotes/dashes/ellipses with ASCII equivalents and strip
  // characters outside the WinAnsi range (emoji, etc) so jsPDF's standard
  // fonts don't render garbage.
  return String(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "—")
    .replace(/\u2026/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

/** Convert camelCase / snake_case keys to nicely capitalised labels. */
function humanize(key: string): string {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

/** Render any value (object, array, primitive) into a readable string. */
function valueToString(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    // Array of primitives → comma list. Array of objects → newline-joined entries.
    if (v.every((x) => typeof x !== "object" || x == null)) return v.filter(Boolean).join(", ");
    return v.map((x) => valueToString(x)).filter(Boolean).join(" · ");
  }
  if (typeof v === "object") {
    return Object.entries(v)
      .filter(([, val]) => val != null && val !== "")
      .map(([k, val]) => `${humanize(k)}: ${valueToString(val)}`)
      .join(" · ");
  }
  return "";
}

function paintBackground(ctx: Ctx) {
  ctx.pdf.setFillColor(...COLORS.cream);
  ctx.pdf.rect(0, 0, ctx.pageW, ctx.pageH, "F");
}

function drawHeader(ctx: Ctx) {
  // Pill-shaped eyebrow tag at the top, matching the "02 | BRAND POSITIONING
  // AUDIT" style from the reference. The body section title is rendered
  // separately by drawDisplayTitle so the header stays minimal.
  const { pdf, margin, brand, sectionTitle, sectionNumber } = ctx;
  const label = `${String(sectionNumber).padStart(2, "0")} | ${(brand + " · " + sectionTitle).toUpperCase()}`;
  drawPillTag(pdf, margin, margin + 24, label);
}

function drawPillTag(pdf: jsPDF, x: number, y: number, label: string) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  // Letter spacing is handled visually via the uppercased label only —
  // jsPDF's setCharSpace can leak into later draws on some platforms, so
  // we avoid it entirely outside this function.
  resetText(pdf);
  const padX = 10;
  const padY = 6;
  const textW = pdf.getTextWidth(label);
  const w = textW + padX * 2;
  const h = 18;
  pdf.setDrawColor(...COLORS.muted);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(x, y - h + padY, w, h, 4, 4, "S");
  pdf.setTextColor(...COLORS.muted);
  pdf.text(label, x + padX, y);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    newPage(ctx, contTitle(ctx.sectionTitle));
  }
}

/**
 * Force a page break unless we have at least `needed` pts of room. Used to
 * keep a label + its first content line together so headings never get
 * orphaned at the bottom of a page.
 */
function keepTogether(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    newPage(ctx, contTitle(ctx.sectionTitle));
  }
}

function drawHr(ctx: Ctx) {
  ctx.y += SPACING.beforeHr;
  ensureSpace(ctx, 8);
  ctx.pdf.setDrawColor(...COLORS.rule);
  ctx.pdf.setLineWidth(0.5);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin + ctx.contentW, ctx.y);
  ctx.y += SPACING.afterHr;
}

function drawSectionTitle(ctx: Ctx, title: string) {
  ensureSpace(ctx, 30);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(16);
  ctx.pdf.setTextColor(...COLORS.ink);
  ctx.pdf.text(title, ctx.margin, ctx.y);
  ctx.y += 20;
}

/**
 * Large serif display headline at the top of a section, mirroring the
 * Playfair-style headlines in the reference report. Uses jsPDF's built-in
 * Times serif so we don't need to bundle a custom font.
 */
function drawDisplayTitle(ctx: Ctx, title: string) {
  ensureSpace(ctx, 80);
  resetText(ctx.pdf);
  ctx.pdf.setFont("times", "bold");
  ctx.pdf.setFontSize(30);
  ctx.pdf.setTextColor(...COLORS.ink);
  const lines = ctx.pdf.splitTextToSize(safe(title), ctx.contentW);
  const lineH = 30 * 1.15;
  for (const ln of lines) {
    ctx.pdf.text(ln, ctx.margin, ctx.y + 24);
    ctx.y += lineH;
  }
  ctx.y += 12;
}

function drawEyebrow(ctx: Ctx, text: string) {
  // Sage-green uppercase mini eyebrow for sub-section labels.
  keepTogether(ctx, 60);
  resetText(ctx.pdf);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(8.5);
  ctx.pdf.setTextColor(...COLORS.sage);
  // Simulate tracking by inserting a thin space between letters, which
  // avoids jsPDF's setCharSpace state leaking into subsequent draws.
  const tracked = safe(text).toUpperCase().split("").join("\u2009");
  ctx.pdf.text(tracked, ctx.margin, ctx.y);
  ctx.y += SPACING.afterEyebrow + 6;
}

function drawLabel(ctx: Ctx, text: string) {
  // Serif sub-headline, matching "This includes:" / "The Core Opportunity"
  // style from the reference.
  keepTogether(ctx, 40);
  resetText(ctx.pdf);
  ctx.pdf.setFont("times", "bold");
  ctx.pdf.setFontSize(14);
  ctx.pdf.setTextColor(...COLORS.ink);
  ctx.pdf.text(safe(text), ctx.margin, ctx.y);
  ctx.y += SPACING.afterLabel + 10;
}

function drawText(ctx: Ctx, text: string, opts: { size?: number; color?: readonly [number, number, number]; bold?: boolean; italic?: boolean; indent?: number; lineGap?: number } = {}) {
  if (!text) return;
  const size = opts.size ?? 10;
  const color = opts.color ?? COLORS.body;
  const indent = opts.indent ?? 0;
  const lineGap = opts.lineGap ?? SPACING.afterParagraph;
  resetText(ctx.pdf);
  ctx.pdf.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
  ctx.pdf.setFontSize(size);
  ctx.pdf.setTextColor(...color);
  const maxW = ctx.contentW - indent;
  const lines = ctx.pdf.splitTextToSize(safe(text), maxW);
  const lineH = size * SPACING.lineHeightRatio;
  // Keep the first 2 lines together with the previous element so single-line
  // labels don't get stranded above a page break.
  keepTogether(ctx, Math.min(lines.length, 2) * lineH);
  for (const line of lines) {
    if (ctx.y + lineH > ctx.pageH - ctx.margin) {
      newPage(ctx, contTitle(ctx.sectionTitle));
      // Reset font after page break (header changes it).
      resetText(ctx.pdf);
      ctx.pdf.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
      ctx.pdf.setFontSize(size);
      ctx.pdf.setTextColor(...color);
    }
    ctx.pdf.text(line, ctx.margin + indent, ctx.y);
    ctx.y += lineH;
  }
  ctx.y += lineGap;
}

function drawKeyValue(ctx: Ctx, key: string, value: string) {
  if (!value) return;
  // Reserve space for label + at least one line of value so they never split.
  keepTogether(ctx, 36);
  drawText(ctx, key.toUpperCase(), { bold: true, size: 8.5, color: COLORS.muted, lineGap: 2 });
  drawText(ctx, value, { size: 10.5, color: COLORS.body, lineGap: SPACING.afterKeyValue });
}

function drawBullets(ctx: Ctx, items: any[], opts: { bullet?: string } = {}) {
  if (!items?.length) return;
  const bullet = opts.bullet ?? "•";
  const size = 10.5;
  const lineH = size * SPACING.lineHeightRatio;
  const indent = SPACING.bulletIndent;
  for (const it of items) {
    const text = typeof it === "string" ? it : it?.text || it?.task || it?.name || valueToString(it);
    resetText(ctx.pdf);
    ctx.pdf.setFont("helvetica", "normal");
    ctx.pdf.setFontSize(size);
    ctx.pdf.setTextColor(...COLORS.body);
    const lines = ctx.pdf.splitTextToSize(safe(text), ctx.contentW - indent);
    // Keep the bullet's first 2 lines together; long bullets can wrap onto the
    // next page but won't be split immediately after the marker.
    keepTogether(ctx, Math.min(lines.length, 2) * lineH);
    for (let i = 0; i < lines.length; i++) {
      if (ctx.y + lineH > ctx.pageH - ctx.margin) {
        newPage(ctx, contTitle(ctx.sectionTitle));
        resetText(ctx.pdf);
        ctx.pdf.setFont("helvetica", "normal");
        ctx.pdf.setFontSize(size);
        ctx.pdf.setTextColor(...COLORS.body);
      }
      if (i === 0) {
        ctx.pdf.setTextColor(...COLORS.accent);
        ctx.pdf.text(safe(bullet), ctx.margin + 2, ctx.y);
        ctx.pdf.setTextColor(...COLORS.body);
      }
      ctx.pdf.text(lines[i], ctx.margin + indent, ctx.y);
      ctx.y += lineH;
    }
    ctx.y += SPACING.bulletGap;
  }
  ctx.y += SPACING.afterBulletList - SPACING.bulletGap;
}

function drawCallout(ctx: Ctx, text: string) {
  if (!text) return;
  const size = 11;
  const padX = 16;
  const padY = 14;
  const lineH = size * 1.4;
  resetText(ctx.pdf);
  ctx.pdf.setFont("helvetica", "italic");
  ctx.pdf.setFontSize(size);
  const lines = ctx.pdf.splitTextToSize(safe(text), ctx.contentW - padX * 2);
  const available = ctx.pageH - ctx.margin - ctx.y;
  const fullH = lines.length * lineH + padY * 2;

  // If callout is taller than a full page, render it in chunks across pages
  // instead of overflowing off-page.
  if (fullH > ctx.pageH - ctx.margin * 2 - 60) {
    let i = 0;
    while (i < lines.length) {
      const room = ctx.pageH - ctx.margin - ctx.y - padY * 2;
      const fit = Math.max(1, Math.floor(room / lineH));
      const chunk = lines.slice(i, i + fit);
      const h = chunk.length * lineH + padY * 2;
      drawCalloutBox(ctx, chunk, h, padX, padY, lineH);
      i += fit;
      if (i < lines.length) newPage(ctx, contTitle(ctx.sectionTitle));
    }
    return;
  }

  // Normal case: keep the whole callout on one page.
  if (fullH + 8 > available) newPage(ctx, contTitle(ctx.sectionTitle));
  drawCalloutBox(ctx, lines, fullH, padX, padY, lineH);
}

function drawCalloutBox(ctx: Ctx, lines: string[], boxH: number, padX: number, padY: number, lineH: number) {
  // Sage-green bordered card on a soft sage tint, matching the reference
  // "callout" pattern (e.g. The Core Opportunity card).
  ctx.pdf.setFillColor(...COLORS.sageSoft);
  ctx.pdf.rect(ctx.margin, ctx.y, ctx.contentW, boxH, "F");
  ctx.pdf.setDrawColor(...COLORS.sage);
  ctx.pdf.setLineWidth(3);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin, ctx.y + boxH);
  ctx.pdf.setFont("helvetica", "italic");
  ctx.pdf.setFontSize(11);
  ctx.pdf.setTextColor(...COLORS.ink);
  let ty = ctx.y + padY + 8;
  for (const ln of lines) {
    ctx.pdf.text(ln, ctx.margin + padX, ty);
    ty += lineH;
  }
  ctx.y += boxH + SPACING.afterCallout;
}

function asArray(v: any): any[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

// ---------- Section renderers ----------

function renderOverview(ctx: Ctx, s: StrategyLike) {
  ctx.sectionNumber = 1;
  newPage(ctx, "Strategic Overview");
  drawDisplayTitle(ctx, "Strategic Overview");

  if (s.positioning_statement) {
    drawEyebrow(ctx, "Positioning statement");
    drawText(ctx, s.positioning_statement, { size: 14, color: COLORS.ink, lineGap: 10 });
  }

  const ef = s.enhanced_foundation || {};
  const breakdown = ef.positioningBreakdown || {};
  const breakdownPairs: [string, string][] = [
    ["Who", breakdown.idealClient],
    ["Problem", breakdown.painPoint],
    ["Solution", breakdown.uniqueApproach],
    ["Result", breakdown.outcome],
    ["Method", breakdown.method],
    ["Transformation", breakdown.transformation],
  ].filter(([, v]) => !!v) as [string, string][];

  if (breakdownPairs.length) {
    drawLabel(ctx, "Breakdown");
    for (const [k, v] of breakdownPairs) drawKeyValue(ctx, k, v);
  }

  const variations = ef.positioningVariations || {};
  if (variations.short || variations.tweet || variations.elevator) {
    drawLabel(ctx, "Variations");
    if (variations.short) drawKeyValue(ctx, "Short", variations.short);
    if (variations.tweet) drawKeyValue(ctx, "Tweet", variations.tweet);
    if (variations.elevator) drawKeyValue(ctx, "Elevator", variations.elevator);
  }

  const a = ef.brandArchetype;
  if (a) {
    drawHr(ctx);
    drawEyebrow(ctx, "Brand archetype");
    // Skip the emoji icon — built-in PDF fonts can't render it.
    drawText(ctx, a.name || "", { size: 18, bold: true, color: COLORS.ink, lineGap: 4 });
    if (a.secondary) drawText(ctx, `Secondary: ${a.secondary}`, { size: 9, color: COLORS.muted, lineGap: 8 });
    if (a.description) drawText(ctx, a.description, { size: 11 });
    if (a.exampleBrands?.length) drawKeyValue(ctx, "Brands", asArray(a.exampleBrands).join(", "));
    if (a.coreValues?.length) drawKeyValue(ctx, "Values", asArray(a.coreValues).join(", "));
    if (a.contentApproach) drawKeyValue(ctx, "Content approach", a.contentApproach);
    if (a.whyThisFits?.length) { drawLabel(ctx, "Why this fits you"); drawBullets(ctx, a.whyThisFits); }
    if (a.howToApply?.length) { drawLabel(ctx, "How to use this"); drawBullets(ctx, a.howToApply, { bullet: ">" }); }
  }

  drawHr(ctx);
  drawEyebrow(ctx, "Audience snapshot");
  drawKeyValue(ctx, "Ideal client", s.ideal_client);
  drawKeyValue(ctx, "Pain point", s.pain_point);
  drawKeyValue(ctx, "Transformation", s.transformation);

  const cv = ef.coreValues || [];
  if (cv.length) {
    drawHr(ctx);
    drawEyebrow(ctx, "Core values & decision filters");
    cv.forEach((v: any, i: number) => {
      drawText(ctx, `${String(i + 1).padStart(2, "0")}  ${v.name || "Value"}`, { size: 13, bold: true, color: COLORS.ink, lineGap: 4 });
      if (v.decisionFilter) drawCallout(ctx, `Decision filter: ${v.decisionFilter}`);
      if (v.description) drawText(ctx, v.description, { color: COLORS.body });
      if (v.yesExamples?.length) { drawText(ctx, "Yes:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, v.yesExamples, { bullet: "+" }); }
      if (v.noExamples?.length) { drawText(ctx, "No:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, v.noExamples, { bullet: "x" }); }
      ctx.y += 4;
    });
  }

  if (s.success_definition || s.business_goal) {
    drawHr(ctx);
    drawEyebrow(ctx, "Success & business");
    drawKeyValue(ctx, "Success definition", s.success_definition);
    drawKeyValue(ctx, "Business goal", s.business_goal);
  }
}

function renderVoice(ctx: Ctx, s: StrategyLike) {
  ctx.sectionNumber = 2;
  newPage(ctx, "Voice & Brand");
  drawDisplayTitle(ctx, "Voice & Brand Identity");
  const ef = s.enhanced_foundation || {};
  const v = ef.voiceGuidelines || {};

  if (s.voice_attributes?.length) {
    drawEyebrow(ctx, "Voice attributes");
    drawText(ctx, asArray(s.voice_attributes).join(" · "), { size: 12, color: COLORS.ink });
  }

  if (v.sentenceStructure) {
    drawLabel(ctx, "Sentence structure");
    if (typeof v.sentenceStructure === "string") drawText(ctx, v.sentenceStructure);
    else {
      Object.entries(v.sentenceStructure).forEach(([k, val]) => {
        // Rules / examples are often arrays — render arrays as bulleted lists
        // instead of comma-joined strings so each rule reads cleanly.
        if (Array.isArray(val)) {
          drawText(ctx, humanize(k).toUpperCase(), { bold: true, size: 8.5, color: COLORS.muted, lineGap: 2 });
          drawBullets(ctx, val);
        } else {
          drawKeyValue(ctx, humanize(k), valueToString(val));
        }
      });
    }
  }

  if (v.vocabulary) {
    drawLabel(ctx, "Vocabulary");
    if (v.vocabulary.use?.length) drawKeyValue(ctx, "Use", asArray(v.vocabulary.use).join(", "));
    if (v.vocabulary.avoid?.length) drawKeyValue(ctx, "Avoid", asArray(v.vocabulary.avoid).join(", "));
  }

  if (v.toneByPlatform) {
    drawLabel(ctx, "Tone by platform");
    Object.entries(v.toneByPlatform).forEach(([p, t]: any) =>
      drawKeyValue(ctx, humanize(p), typeof t === "string" ? t : (t?.tone || valueToString(t)))
    );
  }

  if (v.examples?.length) {
    drawLabel(ctx, "Voice examples");
    v.examples.forEach((ex: any) => {
      if (ex.context) drawText(ctx, ex.context, { bold: true, size: 10, color: COLORS.ink, lineGap: 2 });
      if (ex.text) drawCallout(ctx, ex.text);
    });
  }

  if (v.neverSoundLike?.length) {
    drawLabel(ctx, "Never sound like");
    v.neverSoundLike.forEach((n: any) => {
      const example = typeof n === "string" ? n : (n.example || "");
      if (example) drawText(ctx, `x  ${example}`, { color: COLORS.body, lineGap: 2 });
      if (n.why) drawText(ctx, `Why: ${n.why}`, { size: 9, color: COLORS.muted, indent: SPACING.bulletIndent });
    });
  } else if (s.anti_positioning) {
    drawLabel(ctx, "Anti-positioning");
    drawText(ctx, s.anti_positioning, { italic: true });
  }
}

function renderContent(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const themes = ef.quarterlyThemes || [];
  const calendar = ef.contentCalendar || [];
  if (!themes.length && !calendar.length && !(s.content_pillars?.length)) return;

  ctx.sectionNumber = 3;
  newPage(ctx, "Content Strategy");
  drawDisplayTitle(ctx, "Content Strategy & Calendar");

  if (s.content_pillars?.length) {
    drawEyebrow(ctx, "Content pillars");
    drawBullets(ctx, asArray(s.content_pillars));
  }

  if (themes.length) {
    drawEyebrow(ctx, "Quarterly themes");
    themes.forEach((t: any, i: number) => {
      drawText(ctx, `${t.quarter || `Q${i + 1}`} · ${t.theme || ""}`, { size: 13, bold: true, color: COLORS.ink, lineGap: 3 });
      if (t.overview) drawText(ctx, t.overview);
      if (t.strategicRationale) {
        drawText(ctx, "Why this quarter", { bold: true, size: 8.5, color: COLORS.muted, lineGap: 2 });
        drawText(ctx, t.strategicRationale);
      }
      if (t.contentTopics?.length) {
        drawText(ctx, "Topics — 12 weeks", { bold: true, size: 8.5, color: COLORS.muted, lineGap: 2 });
        t.contentTopics.forEach((c: any) => {
          const week = c.week ? `Week ${String(c.week).padStart(2, "0")} — ` : "";
          const topic = c.topic || c.keyMessage || "";
          drawText(ctx, `${week}${topic}`, { color: COLORS.ink, bold: true, size: 10, lineGap: 1 });
          const meta = [c.angle, c.contentType].filter(Boolean).join(" · ");
          if (meta) drawText(ctx, meta, { size: 9, color: COLORS.muted, lineGap: 2 });
          if (c.keyMessage && c.topic) drawText(ctx, c.keyMessage, { size: 9.5, lineGap: 6 });
        });
      }
      if (t.contentMix) {
        drawText(ctx, "Content mix:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 });
        Object.entries(t.contentMix).filter(([, v]) => v).forEach(([k, v]) => drawKeyValue(ctx, humanize(k), valueToString(v)));
      }
      if (t.successMetric) drawKeyValue(ctx, "Success metric", t.successMetric);
      if (t.cta) drawKeyValue(ctx, "Call to action", t.cta);
      ctx.y += 4;
    });
  }

  if (calendar.length) {
    drawHr(ctx);
    drawEyebrow(ctx, "30-day content calendar");
    calendar.slice(0, 60).forEach((item: any) => {
      const head = [
        item.day && (item.date ? `${item.day} · ${item.date}` : item.day),
        item.platform,
        item.format || item.contentType,
      ].filter(Boolean).join("  ·  ");
      if (head) drawText(ctx, head, { bold: true, size: 9.5, color: COLORS.ink, lineGap: 2 });
      const topic = item.topic || item.title || item.keyMessage;
      if (topic) drawText(ctx, topic, { size: 10.5, lineGap: 2 });
      const meta = [item.theme, item.angle].filter(Boolean).join(" · ");
      if (meta) drawText(ctx, meta, { size: 9, color: COLORS.muted, lineGap: 2 });
      if (item.notes) drawText(ctx, item.notes, { size: 9, color: COLORS.muted, lineGap: 8 });
      else ctx.y += 6;
    });
  }
}

function renderChannels(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const cs = ef.channelStrategy;
  if (!cs) return;

  ctx.sectionNumber = 4;
  newPage(ctx, "Channels");
  drawDisplayTitle(ctx, "Channel Strategy");

  (["primary", "secondary", "tertiary"] as const).forEach((tier) => {
    const ch = cs[tier];
    if (!ch || typeof ch === "string") return;
    drawEyebrow(ctx, `${tier} channel`);
    drawText(ctx, ch.platform || tier, { size: 14, bold: true, color: COLORS.ink, lineGap: 3 });
    if (ch.rationale) {
      // Rationale can be a string OR an array of bullet points.
      if (Array.isArray(ch.rationale)) drawBullets(ctx, ch.rationale);
      else drawText(ctx, String(ch.rationale), { italic: true, color: COLORS.body });
    }

    if (ch.contentStrategy && typeof ch.contentStrategy === "object") {
      drawLabel(ctx, "Content strategy");
      Object.entries(ch.contentStrategy).forEach(([k, v]) => {
        if (v == null || v === "") return;
        if (Array.isArray(v)) {
          if (v.every((x) => typeof x === "string")) drawKeyValue(ctx, humanize(k), v.join(", "));
          else { drawText(ctx, humanize(k).toUpperCase(), { bold: true, size: 8.5, color: COLORS.muted, lineGap: 2 }); drawBullets(ctx, v); }
        } else if (typeof v === "object") {
          drawKeyValue(ctx, humanize(k), valueToString(v));
        } else {
          drawKeyValue(ctx, humanize(k), String(v));
        }
      });
    }
    if (ch.postingSchedule) {
      drawLabel(ctx, "Posting schedule");
      if (Array.isArray(ch.postingSchedule)) {
        ch.postingSchedule.forEach((s: any) => {
          const head = [s.day, s.time].filter(Boolean).join(" · ");
          drawText(ctx, head || "Scheduled", { bold: true, size: 9.5, color: COLORS.ink, lineGap: 2 });
          if (s.type) drawText(ctx, s.type, { size: 10, lineGap: 1 });
          if (s.example) drawText(ctx, s.example, { italic: true, size: 9, color: COLORS.muted, lineGap: 6 });
        });
      } else {
        Object.entries(ch.postingSchedule).forEach(([k, v]) => drawKeyValue(ctx, humanize(k), valueToString(v)));
      }
    }
    if (ch.successMetrics) {
      drawLabel(ctx, "Success metrics");
      if (Array.isArray(ch.successMetrics)) drawBullets(ctx, ch.successMetrics);
      else Object.entries(ch.successMetrics).filter(([, v]) => v).forEach(([k, v]) => drawKeyValue(ctx, humanize(k), valueToString(v)));
    }
    if (ch.timeAllocation) {
      drawLabel(ctx, "Time allocation");
      if (typeof ch.timeAllocation === "string") {
        drawText(ctx, ch.timeAllocation);
      } else {
        if (ch.timeAllocation.total) drawKeyValue(ctx, "Total", String(ch.timeAllocation.total));
        if (ch.timeAllocation.breakdown) {
          Object.entries(ch.timeAllocation.breakdown).filter(([, v]) => v).forEach(([k, v]) => drawKeyValue(ctx, humanize(k), valueToString(v)));
        }
      }
    }
    drawHr(ctx);
  });

  if (cs.timeSavings || cs.comparison) {
    drawEyebrow(ctx, "Time savings with MOXIE");
    if (cs.timeSavings) drawText(ctx, typeof cs.timeSavings === "string" ? cs.timeSavings : valueToString(cs.timeSavings));
    if (cs.comparison) drawText(ctx, cs.comparison, { italic: true, color: COLORS.muted });
  }
}

function renderMetrics(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const sm = ef.successMetrics;
  if (!sm) return;

  ctx.sectionNumber = 5;
  newPage(ctx, "Success Metrics");
  drawDisplayTitle(ctx, "Success Metrics");

  if (sm.primary) {
    drawEyebrow(ctx, "Primary goal");
    if (sm.primary.name) drawText(ctx, sm.primary.name, { size: 14, bold: true, color: COLORS.ink });
    if (sm.primary.weeklyTarget) drawKeyValue(ctx, "Weekly target", String(sm.primary.weeklyTarget));
    if (sm.primary.monthlyTarget) drawKeyValue(ctx, "Monthly target", String(sm.primary.monthlyTarget));
  }

  if (sm.leadSources) {
    drawEyebrow(ctx, "Projected lead sources");
    Object.entries(sm.leadSources).forEach(([k, v]: any) => drawKeyValue(ctx, k, typeof v === "object" ? `${v.percentage ?? ""}% — ${v.definition ?? ""}` : String(v)));
  }

  if (sm.leadQualification) {
    drawEyebrow(ctx, "Lead qualification mix");
    Object.entries(sm.leadQualification).forEach(([k, v]: any) => drawKeyValue(ctx, k, typeof v === "object" ? `${v.percentage ?? ""}% — ${v.definition ?? ""}` : String(v)));
  }

  if (sm.contentPerformance) {
    drawEyebrow(ctx, "Content performance");
    Object.entries(sm.contentPerformance).forEach(([k, v]: any) => {
      drawLabel(ctx, k);
      if (typeof v === "object") Object.entries(v).forEach(([k2, v2]) => drawKeyValue(ctx, k2, String(v2)));
      else drawText(ctx, String(v));
    });
  }

  if (sm.businessGoals) {
    drawEyebrow(ctx, "Business goals");
    Object.entries(sm.businessGoals).forEach(([k, v]) => drawKeyValue(ctx, humanize(k), typeof v === "string" ? v : valueToString(v)));
  }

  if (sm.brandHealth) {
    drawEyebrow(ctx, "Brand health");
    Object.entries(sm.brandHealth).forEach(([k, v]: any) => drawKeyValue(ctx, humanize(k), typeof v === "object" ? `${v.score ?? ""}${v.note ? ` — ${v.note}` : ""}` : String(v)));
  }
}

function renderActionPlan(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const plan = ef.actionPlan;
  if (!plan) return;

  ctx.sectionNumber = 6;
  newPage(ctx, "Action Plan");
  drawDisplayTitle(ctx, "Your 4-Week Action Plan");
  const completion = (s.task_completion || {}) as Record<string, boolean>;

  ([plan.week1, plan.week2, plan.week3, plan.week4]).forEach((w, i) => {
    if (!w) return;
    drawEyebrow(ctx, `Week ${i + 1}`);
    if (w.title) drawText(ctx, w.title, { size: 13, bold: true, color: COLORS.ink, lineGap: 6 });
    const tasks = w.tasks || [];
    tasks.forEach((t: any) => {
      const mark = completion[t.id] ? "[x]" : "[ ]";
      const time = t.estimatedTime ? `  (${t.estimatedTime})` : "";
      drawText(ctx, `${mark}  ${t.task}${time}`, { color: COLORS.body, lineGap: 2 });
    });
    ctx.y += 6;
  });

  const r = plan.ongoingRoutine;
  if (r) {
    drawHr(ctx);
    drawEyebrow(ctx, "Ongoing weekly routine");
    (["daily", "weekly", "biweekly", "monthly"] as const).forEach((k) => {
      const item = r[k];
      if (!item?.task) return;
      drawKeyValue(ctx, `${k}${item.time ? ` (${item.time})` : ""}`, item.task);
    });
    if (r.totalTimePerWeek) drawKeyValue(ctx, "Total time / week", r.totalTimePerWeek);
    if (r.comparison) drawText(ctx, r.comparison, { italic: true, color: COLORS.muted });
  }
}

async function loadLogo(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const dims: { w: number; h: number } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch (e) {
    console.warn("Logo load failed", e);
    return null;
  }
}

async function renderCover(ctx: Ctx, _s: StrategyLike, companyName?: string) {
  const { pdf, pageW, pageH, margin } = ctx;

  // Cream paper background (every page in the document uses this).
  pdf.setFillColor(...COLORS.cream);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Centered MOXIE wordmark/logo at the top — matches the reference cover.
  const logo = await loadLogo();
  if (logo) {
    const targetH = 70;
    const targetW = (logo.w / logo.h) * targetH;
    const x = (pageW - targetW) / 2;
    pdf.addImage(logo.dataUrl, "PNG", x, margin + 40, targetW, targetH);
  }

  // Large serif title — split across two lines like the reference.
  pdf.setFont("times", "bold");
  pdf.setFontSize(40);
  pdf.setTextColor(...COLORS.ink);
  const titleY = pageH * 0.42;
  pdf.text("Chief MOXIE Officer", margin, titleY);
  pdf.text("Strategic Report", margin, titleY + 48);

  // "Prepared for" lockup
  const company = (companyName && companyName.trim()) || "Your business";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.ink);
  pdf.text(`Prepared for ${company}`, margin, titleY + 96);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.body);
  pdf.text(
    `Prepared by MOXIE · ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
    margin,
    titleY + 118
  );

  // Coral confidential banner near the bottom — matches the reference.
  const bannerY = pageH - margin - 90;
  const bannerH = 44;
  pdf.setFillColor(...COLORS.coralSoft);
  pdf.rect(margin, bannerY, pageW - margin * 2, bannerH, "F");
  pdf.setDrawColor(...COLORS.coral);
  pdf.setLineWidth(3);
  pdf.line(margin, bannerY, margin, bannerY + bannerH);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setCharSpace(1.2);
  pdf.setTextColor(...COLORS.ink);
  pdf.text(
    `CONFIDENTIAL — Prepared exclusively for ${company.toUpperCase()}. Not for distribution.`,
    margin + 16,
    bannerY + bannerH / 2 + 4
  );
  pdf.setCharSpace(0);
}

export async function exportStrategyPdf(opts: {
  strategy?: StrategyLike;
  fileName?: string;
  brandName?: string;
  companyName?: string;
  // Legacy/no-op — kept for backwards compat with existing callers.
  sections?: { id: string; title: string }[];
}) {
  const { strategy, fileName = "moxie-strategy.pdf", brandName = "MOXIE", companyName } = opts;

  if (!strategy) {
    toast.error("Nothing to export yet");
    return;
  }

  const t = toast.loading("Preparing PDF…");
  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const ctx: Ctx = {
      pdf, pageW, pageH, margin,
      contentW: pageW - margin * 2,
      y: margin,
      brand: brandName,
      sectionTitle: "Overview",
      sectionNumber: 1,
    };

    await renderCover(ctx, strategy, companyName);
    renderOverview(ctx, strategy);
    renderVoice(ctx, strategy);
    renderContent(ctx, strategy);
    renderChannels(ctx, strategy);
    renderMetrics(ctx, strategy);
    renderActionPlan(ctx, strategy);

    // Footer (skip cover) — page number on the right, brand on the left.
    const total = pdf.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      pdf.setPage(p);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setCharSpace(1.2);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(`${p - 1} / ${total - 1}`, pageW - margin, pageH - 22, { align: "right" });
      pdf.text(brandName.toUpperCase() + " · STRATEGIC REPORT", margin, pageH - 22);
      pdf.setCharSpace(0);
    }

    pdf.save(fileName);
    toast.success("PDF downloaded", { id: t });
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("Couldn't generate PDF", { id: t });
  }
}
