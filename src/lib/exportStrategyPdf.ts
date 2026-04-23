import jsPDF from "jspdf";
import { toast } from "sonner";
import logoUrl from "@/assets/moxie-logo-full.png";

/**
 * PDF export styled to mirror the MOXIE platform UI:
 * white canvas, ink (#262833) text, coral (#ff6b6b) accents,
 * soft cards with rounded corners, grids of metric tiles, and
 * the same labeling system used in the Strategy tabs.
 *
 * All text uses Helvetica (built-in PDF font) — no serif/Times to
 * avoid the kerning bug that caused "ChiefM OXIE" style breakage.
 */

type StrategyLike = any;

const COLORS = {
  ink: [38, 40, 51] as const,           // #262833 — primary text/headlines
  body: [60, 63, 80] as const,          // #3c3f50 — body copy
  muted: [122, 126, 140] as const,      // #7a7e8c — secondary labels
  rule: [228, 229, 234] as const,       // #e4e5ea — hairline dividers
  cardBorder: [228, 229, 234] as const, // matches --border
  cardBg: [255, 255, 255] as const,
  pageBg: [255, 255, 255] as const,
  surface: [248, 248, 250] as const,    // soft chip background
  coral: [255, 107, 107] as const,      // #ff6b6b — accent
  coralSoft: [255, 230, 230] as const,  // accent-soft
  inkChip: [38, 40, 51] as const,
  white: [255, 255, 255] as const,
};

const SPACING = {
  cardPadX: 18,
  cardPadY: 16,
  cardRadius: 10,
  cardGap: 14,
  afterCard: 14,
  afterSection: 8,
  lineHeightRatio: 1.4,
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

// ---------- Sanitization ----------

function safe(text: any): string {
  if (text == null) return "";
  return String(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022]/g, "*")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

function humanize(key: string): string {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function valueToString(v: any): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== "object" || x == null)) return v.filter(Boolean).join(", ");
    return v.map((x) => valueToString(x)).filter(Boolean).join(" - ");
  }
  if (typeof v === "object") {
    return Object.entries(v)
      .filter(([, val]) => val != null && val !== "")
      .map(([k, val]) => `${humanize(k)}: ${valueToString(val)}`)
      .join(" - ");
  }
  return "";
}

function asArray(v: any): any[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function reset(pdf: jsPDF) {
  pdf.setCharSpace(0);
  pdf.setLineWidth(0.5);
}

// ---------- Page chrome ----------

function paintBackground(ctx: Ctx) {
  ctx.pdf.setFillColor(...COLORS.pageBg);
  ctx.pdf.rect(0, 0, ctx.pageW, ctx.pageH, "F");
}

function drawHeader(ctx: Ctx) {
  const { pdf, margin, sectionTitle, sectionNumber } = ctx;
  reset(pdf);
  // Coral square + section label, like a sidebar item turned into a banner
  pdf.setFillColor(...COLORS.coral);
  pdf.roundedRect(margin, margin, 22, 22, 4, 4, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.white);
  pdf.text(String(sectionNumber).padStart(2, "0"), margin + 11, margin + 15, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.ink);
  pdf.text(safe(sectionTitle.toUpperCase()), margin + 32, margin + 15);

  // Hairline under header
  pdf.setDrawColor(...COLORS.rule);
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 32, ctx.pageW - margin, margin + 32);
}

function newPage(ctx: Ctx, sectionTitle?: string) {
  ctx.pdf.addPage();
  if (sectionTitle) ctx.sectionTitle = sectionTitle;
  paintBackground(ctx);
  drawHeader(ctx);
  ctx.y = ctx.margin + 50;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin - 30) {
    newPage(ctx, ctx.sectionTitle);
  }
}

// ---------- Text primitives ----------

function setFont(pdf: jsPDF, weight: "normal" | "bold" | "italic" = "normal", size = 10, color: readonly [number, number, number] = COLORS.body) {
  reset(pdf);
  pdf.setFont("helvetica", weight);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
}

/** Measure how tall a wrapped block of text will be. */
function measureText(pdf: jsPDF, text: string, width: number, size: number): { lines: string[]; height: number } {
  const lines = pdf.splitTextToSize(safe(text), width);
  return { lines, height: lines.length * size * SPACING.lineHeightRatio };
}

function drawWrapped(pdf: jsPDF, text: string, x: number, y: number, width: number, size: number, weight: "normal" | "bold" | "italic" = "normal", color: readonly [number, number, number] = COLORS.body): number {
  setFont(pdf, weight, size, color);
  const lineH = size * SPACING.lineHeightRatio;
  const lines = pdf.splitTextToSize(safe(text), width);
  let cy = y + size; // first baseline
  for (const ln of lines) {
    pdf.text(ln, x, cy);
    cy += lineH;
  }
  return cy - y - lineH + size * 0.3; // total height used
}

// ---------- Page-level building blocks ----------

/** Big page title — like the Strategy tab heading. */
function drawPageTitle(ctx: Ctx, title: string, subtitle?: string) {
  ensureSpace(ctx, 60);
  setFont(ctx.pdf, "bold", 24, COLORS.ink);
  ctx.pdf.text(safe(title), ctx.margin, ctx.y + 22);
  ctx.y += 30;
  if (subtitle) {
    setFont(ctx.pdf, "normal", 11, COLORS.muted);
    const lines = ctx.pdf.splitTextToSize(safe(subtitle), ctx.contentW);
    for (const ln of lines) {
      ctx.pdf.text(ln, ctx.margin, ctx.y + 11);
      ctx.y += 15;
    }
  }
  ctx.y += 14;
}

/** Small uppercase eyebrow label, like the section captions in the platform. */
function drawEyebrow(ctx: Ctx, text: string) {
  ensureSpace(ctx, 20);
  setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
  ctx.pdf.text(safe(text.toUpperCase()), ctx.margin, ctx.y + 10);
  ctx.y += 18;
}

/** Section header inside a page (e.g. "Brand Archetype"). */
function drawSubhead(ctx: Ctx, text: string) {
  ensureSpace(ctx, 24);
  setFont(ctx.pdf, "bold", 14, COLORS.ink);
  ctx.pdf.text(safe(text), ctx.margin, ctx.y + 14);
  ctx.y += 22;
}

// ---------- Card primitives ----------

interface CardOpts {
  accent?: "coral" | "ink" | "none";
  fill?: readonly [number, number, number];
}

/**
 * Render a content card with a rounded border + optional left accent stripe.
 * The body callback receives a "child ctx" whose width is the card's inner
 * width; everything drawn inside should respect that width.
 *
 * Returns the actual height of the card so the caller can advance ctx.y.
 */
function drawCard(
  ctx: Ctx,
  contentHeight: number,
  draw: (innerX: number, innerY: number, innerW: number) => void,
  opts: CardOpts = {}
) {
  const totalH = contentHeight + SPACING.cardPadY * 2;
  ensureSpace(ctx, totalH + 4);
  const x = ctx.margin;
  const y = ctx.y;
  const w = ctx.contentW;

  // Fill
  ctx.pdf.setFillColor(...(opts.fill ?? COLORS.cardBg));
  ctx.pdf.roundedRect(x, y, w, totalH, SPACING.cardRadius, SPACING.cardRadius, "F");
  // Border
  ctx.pdf.setDrawColor(...COLORS.cardBorder);
  ctx.pdf.setLineWidth(0.6);
  ctx.pdf.roundedRect(x, y, w, totalH, SPACING.cardRadius, SPACING.cardRadius, "S");
  // Accent stripe
  if (opts.accent === "coral") {
    ctx.pdf.setFillColor(...COLORS.coral);
    ctx.pdf.rect(x, y + 6, 3, totalH - 12, "F");
  } else if (opts.accent === "ink") {
    ctx.pdf.setFillColor(...COLORS.ink);
    ctx.pdf.rect(x, y + 6, 3, totalH - 12, "F");
  }

  draw(x + SPACING.cardPadX, y + SPACING.cardPadY, w - SPACING.cardPadX * 2);
  ctx.y = y + totalH + SPACING.afterCard;
}

/** Side-by-side metric tiles (like the Metrics tab dashboard cards). */
function drawMetricGrid(ctx: Ctx, items: { label: string; value: string; sub?: string }[], cols = 2) {
  if (!items.length) return;
  const gap = 10;
  const cellW = (ctx.contentW - gap * (cols - 1)) / cols;
  const cellH = 70;

  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols);
    ensureSpace(ctx, cellH + 6);
    row.forEach((it, j) => {
      const x = ctx.margin + j * (cellW + gap);
      const y = ctx.y;
      ctx.pdf.setFillColor(...COLORS.surface);
      ctx.pdf.roundedRect(x, y, cellW, cellH, 8, 8, "F");
      ctx.pdf.setDrawColor(...COLORS.cardBorder);
      ctx.pdf.setLineWidth(0.5);
      ctx.pdf.roundedRect(x, y, cellW, cellH, 8, 8, "S");

      setFont(ctx.pdf, "bold", 8, COLORS.muted);
      ctx.pdf.text(safe(it.label.toUpperCase()), x + 12, y + 16);
      setFont(ctx.pdf, "bold", 20, COLORS.ink);
      ctx.pdf.text(safe(it.value || "-"), x + 12, y + 40);
      if (it.sub) {
        setFont(ctx.pdf, "normal", 9, COLORS.muted);
        const sub = ctx.pdf.splitTextToSize(safe(it.sub), cellW - 24);
        ctx.pdf.text(sub[0], x + 12, y + 58);
      }
    });
    ctx.y += cellH + gap;
  }
  ctx.y += SPACING.afterSection - gap;
}

/** Two-column key/value list inside a card body. */
function drawKVStack(pdf: jsPDF, x: number, y: number, w: number, items: { k: string; v: string }[]): number {
  let cy = y;
  for (const { k, v } of items) {
    if (!v) continue;
    setFont(pdf, "bold", 8, COLORS.muted);
    pdf.text(safe(k.toUpperCase()), x, cy + 10);
    cy += 14;
    const used = drawWrapped(pdf, v, x, cy, w, 10, "normal", COLORS.body);
    cy += used + 8;
  }
  return cy - y;
}

function measureKVStack(pdf: jsPDF, w: number, items: { k: string; v: string }[]): number {
  let h = 0;
  for (const { k, v } of items) {
    if (!v) continue;
    h += 14;
    const m = measureText(pdf, v, w, 10);
    h += m.height + 8;
    void k;
  }
  return h;
}

/** Bullet list inside a card body. Returns height used. */
function drawBulletsBlock(pdf: jsPDF, x: number, y: number, w: number, items: any[], bullet = "*"): number {
  let cy = y;
  const indent = 14;
  for (const it of items) {
    const txt = typeof it === "string" ? it : (it?.text || it?.task || it?.name || valueToString(it));
    setFont(pdf, "bold", 10, COLORS.coral);
    pdf.text(safe(bullet), x, cy + 10);
    const used = drawWrapped(pdf, txt, x + indent, cy, w - indent, 10, "normal", COLORS.body);
    cy += Math.max(used + 4, 16);
  }
  return cy - y;
}

function measureBulletsBlock(pdf: jsPDF, w: number, items: any[]): number {
  let h = 0;
  const indent = 14;
  for (const it of items) {
    const txt = typeof it === "string" ? it : (it?.text || it?.task || it?.name || valueToString(it));
    const m = measureText(pdf, txt, w - indent, 10);
    h += Math.max(m.height + 4, 16);
  }
  return h;
}

// ---------- High level helpers ----------

/** Hero card — large text on coral-soft background, used for positioning statement etc. */
function drawHeroCard(ctx: Ctx, label: string, body: string) {
  if (!body) return;
  const innerW = ctx.contentW - SPACING.cardPadX * 2;
  const labelH = 14;
  const bodyMeasure = measureText(ctx.pdf, body, innerW, 13);
  drawCard(ctx, labelH + bodyMeasure.height + 4, (x, y, w) => {
    setFont(ctx.pdf, "bold", 8.5, COLORS.coral);
    ctx.pdf.text(safe(label.toUpperCase()), x, y + 10);
    drawWrapped(ctx.pdf, body, x, y + labelH, w, 13, "normal", COLORS.ink);
  }, { fill: COLORS.coralSoft, accent: "coral" });
}

/** Standard "section card" with eyebrow + key/value body. */
function drawKVCard(ctx: Ctx, label: string, items: { k: string; v: string }[]) {
  const filtered = items.filter((it) => !!it.v);
  if (!filtered.length) return;
  const innerW = ctx.contentW - SPACING.cardPadX * 2;
  const labelH = 18;
  const stackH = measureKVStack(ctx.pdf, innerW, filtered);
  drawCard(ctx, labelH + stackH, (x, y, w) => {
    setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
    ctx.pdf.text(safe(label.toUpperCase()), x, y + 10);
    drawKVStack(ctx.pdf, x, y + labelH, w, filtered);
  });
}

/** Card with eyebrow + bullet list. */
function drawListCard(ctx: Ctx, label: string, items: any[], bullet = "*") {
  if (!items?.length) return;
  const innerW = ctx.contentW - SPACING.cardPadX * 2;
  const labelH = 18;
  const blockH = measureBulletsBlock(ctx.pdf, innerW, items);
  drawCard(ctx, labelH + blockH, (x, y, w) => {
    setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
    ctx.pdf.text(safe(label.toUpperCase()), x, y + 10);
    drawBulletsBlock(ctx.pdf, x, y + labelH, w, items, bullet);
  });
}

/** Card with eyebrow + a paragraph of body text. */
function drawTextCard(ctx: Ctx, label: string, body: string) {
  if (!body) return;
  const innerW = ctx.contentW - SPACING.cardPadX * 2;
  const labelH = 18;
  const m = measureText(ctx.pdf, body, innerW, 10.5);
  drawCard(ctx, labelH + m.height, (x, y, w) => {
    setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
    ctx.pdf.text(safe(label.toUpperCase()), x, y + 10);
    drawWrapped(ctx.pdf, body, x, y + labelH, w, 10.5, "normal", COLORS.body);
  });
}

/** Two cards side-by-side (returns when both rendered). */
function drawTwoColumnCards(
  ctx: Ctx,
  left: { label: string; body: string } | null,
  right: { label: string; body: string } | null
) {
  if (!left && !right) return;
  if (left && !right) return drawTextCard(ctx, left.label, left.body);
  if (right && !left) return drawTextCard(ctx, right.label, right.body);

  const gap = 12;
  const colW = (ctx.contentW - gap) / 2;
  const innerW = colW - SPACING.cardPadX * 2;
  const labelH = 18;
  const lH = measureText(ctx.pdf, left!.body, innerW, 10.5).height;
  const rH = measureText(ctx.pdf, right!.body, innerW, 10.5).height;
  const bodyH = Math.max(lH, rH);
  const totalH = labelH + bodyH + SPACING.cardPadY * 2;

  ensureSpace(ctx, totalH + 4);
  [left!, right!].forEach((c, i) => {
    const x = ctx.margin + i * (colW + gap);
    const y = ctx.y;
    ctx.pdf.setFillColor(...COLORS.cardBg);
    ctx.pdf.roundedRect(x, y, colW, totalH, SPACING.cardRadius, SPACING.cardRadius, "F");
    ctx.pdf.setDrawColor(...COLORS.cardBorder);
    ctx.pdf.setLineWidth(0.6);
    ctx.pdf.roundedRect(x, y, colW, totalH, SPACING.cardRadius, SPACING.cardRadius, "S");
    setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
    ctx.pdf.text(safe(c.label.toUpperCase()), x + SPACING.cardPadX, y + SPACING.cardPadY + 10);
    drawWrapped(ctx.pdf, c.body, x + SPACING.cardPadX, y + SPACING.cardPadY + labelH, innerW, 10.5, "normal", COLORS.body);
  });
  ctx.y += totalH + SPACING.afterCard;
}

/** Inline coral pill chips, used for tags/attributes. */
function drawChipRow(ctx: Ctx, chips: string[]) {
  if (!chips?.length) return;
  ensureSpace(ctx, 28);
  let cx = ctx.margin;
  const cy = ctx.y;
  setFont(ctx.pdf, "bold", 9, COLORS.ink);
  for (const c of chips) {
    const label = safe(c);
    const tw = ctx.pdf.getTextWidth(label);
    const w = tw + 18;
    if (cx + w > ctx.margin + ctx.contentW) { ctx.y += 24; }
    ctx.pdf.setFillColor(...COLORS.coralSoft);
    ctx.pdf.roundedRect(cx, ctx.y, w, 20, 10, 10, "F");
    ctx.pdf.setTextColor(...COLORS.ink);
    ctx.pdf.text(label, cx + 9, ctx.y + 13);
    cx += w + 6;
  }
  ctx.y += 28;
}

// ---------- Section renderers ----------

function renderOverview(ctx: Ctx, s: StrategyLike) {
  ctx.sectionNumber = 1;
  newPage(ctx, "Strategic Overview");
  drawPageTitle(ctx, "Strategic Overview", "Your positioning, audience, archetype, and core values.");

  if (s.positioning_statement) {
    drawHeroCard(ctx, "Positioning statement", s.positioning_statement);
  }

  const ef = s.enhanced_foundation || {};
  const breakdown = ef.positioningBreakdown || {};
  const breakdownPairs = [
    { k: "Who", v: breakdown.idealClient },
    { k: "Problem", v: breakdown.painPoint },
    { k: "Solution", v: breakdown.uniqueApproach },
    { k: "Result", v: breakdown.outcome },
    { k: "Method", v: breakdown.method },
    { k: "Transformation", v: breakdown.transformation },
  ].filter((p) => !!p.v);
  if (breakdownPairs.length) drawKVCard(ctx, "Positioning breakdown", breakdownPairs);

  const variations = ef.positioningVariations || {};
  const varItems = [
    { k: "Short", v: variations.short },
    { k: "Tweet", v: variations.tweet },
    { k: "Elevator", v: variations.elevator },
  ].filter((p) => !!p.v);
  if (varItems.length) drawKVCard(ctx, "Variations", varItems);

  const a = ef.brandArchetype;
  if (a) {
    drawSubhead(ctx, "Brand archetype");
    if (a.name) {
      const innerW = ctx.contentW - SPACING.cardPadX * 2;
      const descH = a.description ? measureText(ctx.pdf, a.description, innerW, 10.5).height + 8 : 0;
      const secondaryH = a.secondary ? 14 : 0;
      drawCard(ctx, 28 + secondaryH + descH, (x, y, w) => {
        setFont(ctx.pdf, "bold", 18, COLORS.ink);
        ctx.pdf.text(safe(a.name), x, y + 16);
        let cy = y + 28;
        if (a.secondary) {
          setFont(ctx.pdf, "normal", 9, COLORS.muted);
          ctx.pdf.text(safe(`Secondary: ${a.secondary}`), x, cy + 8);
          cy += 14;
        }
        if (a.description) {
          drawWrapped(ctx.pdf, a.description, x, cy, w, 10.5, "normal", COLORS.body);
        }
      }, { accent: "coral" });
    }
    const archetypeKV = [
      { k: "Brands", v: asArray(a.exampleBrands).join(", ") },
      { k: "Values", v: asArray(a.coreValues).join(", ") },
      { k: "Content approach", v: a.contentApproach || "" },
    ].filter((p) => !!p.v);
    if (archetypeKV.length) drawKVCard(ctx, "Archetype details", archetypeKV);
    if (a.whyThisFits?.length) drawListCard(ctx, "Why this fits you", a.whyThisFits);
    if (a.howToApply?.length) drawListCard(ctx, "How to use this", a.howToApply, ">");
  }

  drawSubhead(ctx, "Audience snapshot");
  drawKVCard(ctx, "Audience", [
    { k: "Ideal client", v: s.ideal_client },
    { k: "Pain point", v: s.pain_point },
    { k: "Transformation", v: s.transformation },
  ]);

  const cv = ef.coreValues || [];
  if (cv.length) {
    drawSubhead(ctx, "Core values & decision filters");
    cv.forEach((v: any, i: number) => {
      const innerW = ctx.contentW - SPACING.cardPadX * 2;
      const titleH = 22;
      const filterH = v.decisionFilter ? measureText(ctx.pdf, `Decision filter: ${v.decisionFilter}`, innerW - 12, 10).height + 18 : 0;
      const descH = v.description ? measureText(ctx.pdf, v.description, innerW, 10.5).height + 8 : 0;
      const yesH = v.yesExamples?.length ? 16 + measureBulletsBlock(ctx.pdf, innerW, v.yesExamples) : 0;
      const noH = v.noExamples?.length ? 16 + measureBulletsBlock(ctx.pdf, innerW, v.noExamples) : 0;
      drawCard(ctx, titleH + filterH + descH + yesH + noH, (x, y, w) => {
        setFont(ctx.pdf, "bold", 8, COLORS.muted);
        ctx.pdf.text(`VALUE ${String(i + 1).padStart(2, "0")}`, x, y + 9);
        setFont(ctx.pdf, "bold", 13, COLORS.ink);
        ctx.pdf.text(safe(v.name || "Value"), x + 60, y + 11);
        let cy = y + titleH;
        if (v.decisionFilter) {
          // Sub-callout inside card
          ctx.pdf.setFillColor(...COLORS.surface);
          const filterText = `Decision filter: ${v.decisionFilter}`;
          const fH = measureText(ctx.pdf, filterText, w - 20, 10).height + 12;
          ctx.pdf.roundedRect(x, cy, w, fH, 6, 6, "F");
          drawWrapped(ctx.pdf, filterText, x + 10, cy + 4, w - 20, 10, "italic", COLORS.ink);
          cy += fH + 6;
        }
        if (v.description) {
          const used = drawWrapped(ctx.pdf, v.description, x, cy, w, 10.5, "normal", COLORS.body);
          cy += used + 8;
        }
        if (v.yesExamples?.length) {
          setFont(ctx.pdf, "bold", 8, COLORS.muted);
          ctx.pdf.text("YES", x, cy + 8);
          cy += 14;
          cy += drawBulletsBlock(ctx.pdf, x, cy, w, v.yesExamples, "+");
        }
        if (v.noExamples?.length) {
          setFont(ctx.pdf, "bold", 8, COLORS.muted);
          ctx.pdf.text("NO", x, cy + 8);
          cy += 14;
          drawBulletsBlock(ctx.pdf, x, cy, w, v.noExamples, "x");
        }
      });
    });
  }

  if (s.success_definition || s.business_goal) {
    drawSubhead(ctx, "Success & business");
    drawTwoColumnCards(ctx,
      s.success_definition ? { label: "Success definition", body: s.success_definition } : null,
      s.business_goal ? { label: "Business goal", body: s.business_goal } : null,
    );
  }
}

function renderVoice(ctx: Ctx, s: StrategyLike) {
  ctx.sectionNumber = 2;
  newPage(ctx, "Voice & Brand");
  drawPageTitle(ctx, "Voice & Brand Identity", "How your brand sounds, what it says, and what it never says.");

  const ef = s.enhanced_foundation || {};
  const v = ef.voiceGuidelines || {};

  if (s.voice_attributes?.length) {
    drawEyebrow(ctx, "Voice attributes");
    drawChipRow(ctx, asArray(s.voice_attributes));
  }

  if (v.sentenceStructure) {
    drawSubhead(ctx, "Sentence structure");
    if (typeof v.sentenceStructure === "string") {
      drawTextCard(ctx, "Style", v.sentenceStructure);
    } else {
      Object.entries(v.sentenceStructure).forEach(([k, val]) => {
        if (Array.isArray(val)) drawListCard(ctx, humanize(k), val);
        else drawTextCard(ctx, humanize(k), valueToString(val));
      });
    }
  }

  if (v.vocabulary) {
    drawSubhead(ctx, "Vocabulary");
    drawTwoColumnCards(ctx,
      v.vocabulary.use?.length ? { label: "Use", body: asArray(v.vocabulary.use).join(", ") } : null,
      v.vocabulary.avoid?.length ? { label: "Avoid", body: asArray(v.vocabulary.avoid).join(", ") } : null,
    );
  }

  if (v.toneByPlatform) {
    drawSubhead(ctx, "Tone by platform");
    const items = Object.entries(v.toneByPlatform).map(([p, t]: any) => ({
      k: humanize(p),
      v: typeof t === "string" ? t : (t?.tone || valueToString(t)),
    }));
    drawKVCard(ctx, "Channels", items);
  }

  if (v.examples?.length) {
    drawSubhead(ctx, "Voice examples");
    v.examples.forEach((ex: any) => {
      if (!ex.text) return;
      const innerW = ctx.contentW - SPACING.cardPadX * 2;
      const ctxH = ex.context ? 16 : 0;
      const tH = measureText(ctx.pdf, `"${ex.text}"`, innerW, 11).height;
      drawCard(ctx, ctxH + tH + 4, (x, y, w) => {
        if (ex.context) {
          setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
          ctx.pdf.text(safe(ex.context.toUpperCase()), x, y + 10);
        }
        drawWrapped(ctx.pdf, `"${ex.text}"`, x, y + ctxH, w, 11, "italic", COLORS.ink);
      }, { accent: "coral" });
    });
  }

  if (v.neverSoundLike?.length) {
    drawSubhead(ctx, "Never sound like");
    v.neverSoundLike.forEach((n: any) => {
      const example = typeof n === "string" ? n : (n.example || "");
      if (!example) return;
      const innerW = ctx.contentW - SPACING.cardPadX * 2;
      const eH = measureText(ctx.pdf, example, innerW, 10.5).height;
      const wH = n.why ? measureText(ctx.pdf, `Why: ${n.why}`, innerW, 9).height + 6 : 0;
      drawCard(ctx, eH + wH, (x, y, w) => {
        drawWrapped(ctx.pdf, example, x, y, w, 10.5, "normal", COLORS.ink);
        if (n.why) drawWrapped(ctx.pdf, `Why: ${n.why}`, x, y + eH + 6, w, 9, "italic", COLORS.muted);
      });
    });
  } else if (s.anti_positioning) {
    drawTextCard(ctx, "Anti-positioning", s.anti_positioning);
  }
}

function renderContent(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const themes = ef.quarterlyThemes || [];
  const calendar = ef.contentCalendar || [];
  if (!themes.length && !calendar.length && !(s.content_pillars?.length)) return;

  ctx.sectionNumber = 3;
  newPage(ctx, "Content Strategy");
  drawPageTitle(ctx, "Content Strategy & Calendar", "Quarterly themes and a 30-day publishing calendar.");

  if (s.content_pillars?.length) {
    drawListCard(ctx, "Content pillars", asArray(s.content_pillars));
  }

  if (themes.length) {
    drawSubhead(ctx, "Quarterly themes");
    themes.forEach((t: any, i: number) => {
      const title = `${t.quarter || `Q${i + 1}`} - ${t.theme || ""}`;
      const innerW = ctx.contentW - SPACING.cardPadX * 2;
      const titleH = 22;
      const overviewH = t.overview ? measureText(ctx.pdf, t.overview, innerW, 10.5).height + 8 : 0;
      const ratH = t.strategicRationale ? 14 + measureText(ctx.pdf, t.strategicRationale, innerW, 10).height + 8 : 0;
      drawCard(ctx, titleH + overviewH + ratH, (x, y, w) => {
        setFont(ctx.pdf, "bold", 14, COLORS.ink);
        ctx.pdf.text(safe(title), x, y + 14);
        let cy = y + titleH;
        if (t.overview) {
          const used = drawWrapped(ctx.pdf, t.overview, x, cy, w, 10.5, "normal", COLORS.body);
          cy += used + 8;
        }
        if (t.strategicRationale) {
          setFont(ctx.pdf, "bold", 8, COLORS.muted);
          ctx.pdf.text("WHY THIS QUARTER", x, cy + 8);
          cy += 14;
          drawWrapped(ctx.pdf, t.strategicRationale, x, cy, w, 10, "italic", COLORS.body);
        }
      }, { accent: "ink" });

      if (t.contentTopics?.length) {
        // Render topics as compact rows in a card
        const innerW2 = ctx.contentW - SPACING.cardPadX * 2;
        let totalH = 18;
        const rows = t.contentTopics.map((c: any) => {
          const week = c.week ? `Week ${String(c.week).padStart(2, "0")}` : "";
          const topic = c.topic || c.keyMessage || "";
          const meta = [c.angle, c.contentType].filter(Boolean).join(" - ");
          const titleH2 = measureText(ctx.pdf, `${week}  ${topic}`, innerW2 - 8, 10).height;
          const metaH = meta ? measureText(ctx.pdf, meta, innerW2 - 8, 9).height + 2 : 0;
          return { week, topic, meta, h: titleH2 + metaH + 8 };
        });
        for (const r of rows) totalH += r.h;
        drawCard(ctx, totalH, (x, y, w) => {
          setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
          ctx.pdf.text("TOPICS - 12 WEEKS", x, y + 10);
          let cy = y + 18;
          for (const r of rows) {
            setFont(ctx.pdf, "bold", 10, COLORS.ink);
            ctx.pdf.text(safe(`${r.week}  ${r.topic}`), x, cy + 10);
            cy += measureText(ctx.pdf, `${r.week}  ${r.topic}`, w, 10).height;
            if (r.meta) {
              setFont(ctx.pdf, "normal", 9, COLORS.muted);
              ctx.pdf.text(safe(r.meta), x, cy + 8);
              cy += measureText(ctx.pdf, r.meta, w, 9).height + 2;
            }
            cy += 6;
          }
        });
      }

      if (t.contentMix) {
        const items = Object.entries(t.contentMix).filter(([, v]) => v).map(([k, v]) => ({ k: humanize(k), v: valueToString(v) }));
        if (items.length) drawKVCard(ctx, "Content mix", items);
      }
      if (t.successMetric || t.cta) {
        drawTwoColumnCards(ctx,
          t.successMetric ? { label: "Success metric", body: t.successMetric } : null,
          t.cta ? { label: "Call to action", body: t.cta } : null,
        );
      }
    });
  }

  if (calendar.length) {
    drawSubhead(ctx, "30-day content calendar");
    // Group items into pairs per row
    const items = calendar.slice(0, 60);
    const gap = 10;
    const colW = (ctx.contentW - gap) / 2;
    const innerW = colW - SPACING.cardPadX * 2;

    for (let i = 0; i < items.length; i += 2) {
      const row = items.slice(i, i + 2);
      // Compute height for each
      const cells = row.map((item: any) => {
        const head = [item.day && (item.date ? `${item.day} - ${item.date}` : item.day), item.platform, item.format || item.contentType].filter(Boolean).join("  -  ");
        const topic = item.topic || item.title || item.keyMessage || "";
        const meta = [item.theme, item.angle].filter(Boolean).join(" - ");
        const headH = head ? measureText(ctx.pdf, head, innerW, 9).height + 4 : 0;
        const tH = topic ? measureText(ctx.pdf, topic, innerW, 10.5).height + 4 : 0;
        const mH = meta ? measureText(ctx.pdf, meta, innerW, 8.5).height + 4 : 0;
        const nH = item.notes ? measureText(ctx.pdf, item.notes, innerW, 8.5).height : 0;
        return { item, head, topic, meta, h: headH + tH + mH + nH };
      });
      const cellH = Math.max(...cells.map((c) => c.h)) + SPACING.cardPadY * 2;
      ensureSpace(ctx, cellH + 4);
      cells.forEach((c, j) => {
        const x = ctx.margin + j * (colW + gap);
        const y = ctx.y;
        ctx.pdf.setFillColor(...COLORS.cardBg);
        ctx.pdf.roundedRect(x, y, colW, cellH, SPACING.cardRadius, SPACING.cardRadius, "F");
        ctx.pdf.setDrawColor(...COLORS.cardBorder);
        ctx.pdf.setLineWidth(0.6);
        ctx.pdf.roundedRect(x, y, colW, cellH, SPACING.cardRadius, SPACING.cardRadius, "S");
        let cy = y + SPACING.cardPadY;
        const innerX = x + SPACING.cardPadX;
        if (c.head) {
          setFont(ctx.pdf, "bold", 8.5, COLORS.coral);
          ctx.pdf.text(safe(c.head.toUpperCase()), innerX, cy + 9);
          cy += measureText(ctx.pdf, c.head, innerW, 9).height + 4;
        }
        if (c.topic) {
          const used = drawWrapped(ctx.pdf, c.topic, innerX, cy, innerW, 10.5, "bold", COLORS.ink);
          cy += used + 4;
        }
        if (c.meta) {
          const used = drawWrapped(ctx.pdf, c.meta, innerX, cy, innerW, 8.5, "italic", COLORS.muted);
          cy += used + 4;
        }
        if (c.item.notes) {
          drawWrapped(ctx.pdf, c.item.notes, innerX, cy, innerW, 8.5, "normal", COLORS.muted);
        }
      });
      ctx.y += cellH + SPACING.cardGap;
    }
  }
}

function renderChannels(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const cs = ef.channelStrategy;
  if (!cs) return;

  ctx.sectionNumber = 4;
  newPage(ctx, "Channels");
  drawPageTitle(ctx, "Channel Strategy", "Where you show up, how often, and what success looks like.");

  (["primary", "secondary", "tertiary"] as const).forEach((tier) => {
    const ch = cs[tier];
    if (!ch || typeof ch === "string") return;

    // Tier header card
    const innerW = ctx.contentW - SPACING.cardPadX * 2;
    const platform = ch.platform || tier;
    const rationale = Array.isArray(ch.rationale) ? null : (ch.rationale ? String(ch.rationale) : "");
    const platH = 22;
    const rH = rationale ? measureText(ctx.pdf, rationale, innerW, 10.5).height + 4 : 0;
    drawCard(ctx, platH + rH, (x, y, w) => {
      setFont(ctx.pdf, "bold", 8, COLORS.coral);
      ctx.pdf.text(safe(`${tier.toUpperCase()} CHANNEL`), x, y + 9);
      setFont(ctx.pdf, "bold", 16, COLORS.ink);
      ctx.pdf.text(safe(platform), x, y + 26);
      if (rationale) drawWrapped(ctx.pdf, rationale, x, y + platH + 4, w, 10.5, "italic", COLORS.body);
    }, { accent: "coral" });

    if (Array.isArray(ch.rationale) && ch.rationale.length) {
      drawListCard(ctx, "Why this channel", ch.rationale);
    }

    if (ch.contentStrategy && typeof ch.contentStrategy === "object") {
      const items: { k: string; v: string }[] = [];
      Object.entries(ch.contentStrategy).forEach(([k, v]: any) => {
        if (v == null || v === "") return;
        if (Array.isArray(v) && v.every((x: any) => typeof x === "string")) items.push({ k: humanize(k), v: v.join(", ") });
        else items.push({ k: humanize(k), v: valueToString(v) });
      });
      if (items.length) drawKVCard(ctx, "Content strategy", items);
    }

    if (ch.postingSchedule) {
      if (Array.isArray(ch.postingSchedule)) {
        const rows = ch.postingSchedule.map((sch: any) => ({
          head: [sch.day, sch.time].filter(Boolean).join(" - "),
          type: sch.type || "",
          example: sch.example || "",
        }));
        let h = 18;
        rows.forEach((r: any) => { h += 14 + (r.type ? 14 : 0) + (r.example ? 14 : 0) + 6; });
        drawCard(ctx, h, (x, y, w) => {
          setFont(ctx.pdf, "bold", 8.5, COLORS.muted);
          ctx.pdf.text("POSTING SCHEDULE", x, y + 10);
          let cy = y + 18;
          rows.forEach((r: any) => {
            setFont(ctx.pdf, "bold", 9.5, COLORS.coral);
            ctx.pdf.text(safe(r.head || "Scheduled"), x, cy + 10);
            cy += 14;
            if (r.type) { setFont(ctx.pdf, "normal", 10, COLORS.ink); ctx.pdf.text(safe(r.type), x, cy + 8); cy += 14; }
            if (r.example) { setFont(ctx.pdf, "italic", 9, COLORS.muted); const lines = ctx.pdf.splitTextToSize(safe(r.example), w); ctx.pdf.text(lines[0], x, cy + 8); cy += 14; }
            cy += 4;
          });
          void w;
        });
      } else {
        const items = Object.entries(ch.postingSchedule).map(([k, v]) => ({ k: humanize(k), v: valueToString(v) }));
        drawKVCard(ctx, "Posting schedule", items);
      }
    }

    if (ch.successMetrics) {
      if (Array.isArray(ch.successMetrics)) {
        drawListCard(ctx, "Success metrics", ch.successMetrics);
      } else {
        const tiles = Object.entries(ch.successMetrics).filter(([, v]) => v).map(([k, v]) => ({
          label: humanize(k),
          value: typeof v === "string" || typeof v === "number" ? String(v) : valueToString(v),
        }));
        if (tiles.length) {
          drawEyebrow(ctx, "Success metrics");
          drawMetricGrid(ctx, tiles, 2);
        }
      }
    }

    if (ch.timeAllocation) {
      if (typeof ch.timeAllocation === "string") {
        drawTextCard(ctx, "Time allocation", ch.timeAllocation);
      } else {
        const tiles: { label: string; value: string }[] = [];
        if (ch.timeAllocation.total) tiles.push({ label: "Total", value: String(ch.timeAllocation.total) });
        if (ch.timeAllocation.breakdown) {
          Object.entries(ch.timeAllocation.breakdown).filter(([, v]) => v).forEach(([k, v]) => tiles.push({ label: humanize(k), value: valueToString(v) }));
        }
        if (tiles.length) {
          drawEyebrow(ctx, "Time allocation");
          drawMetricGrid(ctx, tiles, 2);
        }
      }
    }
  });

  if (cs.timeSavings || cs.comparison) {
    drawSubhead(ctx, "Time savings with MOXIE");
    if (cs.timeSavings) drawTextCard(ctx, "Estimated savings", typeof cs.timeSavings === "string" ? cs.timeSavings : valueToString(cs.timeSavings));
    if (cs.comparison) drawTextCard(ctx, "Comparison", String(cs.comparison));
  }
}

function renderMetrics(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const sm = ef.successMetrics;
  if (!sm) return;

  ctx.sectionNumber = 5;
  newPage(ctx, "Success Metrics");
  drawPageTitle(ctx, "Success Metrics", "Targets, projected lead sources, and brand health baselines.");

  if (sm.primary) {
    if (sm.primary.name) drawHeroCard(ctx, "Primary goal", sm.primary.name);
    const tiles: { label: string; value: string; sub?: string }[] = [];
    if (sm.primary.weeklyTarget) tiles.push({ label: "Weekly target", value: String(sm.primary.weeklyTarget) });
    if (sm.primary.monthlyTarget) tiles.push({ label: "Monthly target", value: String(sm.primary.monthlyTarget) });
    if (tiles.length) drawMetricGrid(ctx, tiles, 2);
  }

  if (sm.leadSources) {
    drawSubhead(ctx, "Projected lead sources");
    const items = Object.entries(sm.leadSources).map(([k, v]: any) => ({
      k: humanize(k),
      v: typeof v === "object" ? `${v.percentage ?? ""}% - ${v.definition ?? ""}` : String(v),
    }));
    drawKVCard(ctx, "Sources", items);
  }

  if (sm.leadQualification) {
    drawSubhead(ctx, "Lead qualification mix");
    const items = Object.entries(sm.leadQualification).map(([k, v]: any) => ({
      k: humanize(k),
      v: typeof v === "object" ? `${v.percentage ?? ""}% - ${v.definition ?? ""}` : String(v),
    }));
    drawKVCard(ctx, "Qualification", items);
  }

  if (sm.contentPerformance) {
    drawSubhead(ctx, "Content performance targets");
    Object.entries(sm.contentPerformance).forEach(([k, v]: any) => {
      if (typeof v === "object") {
        const tiles = Object.entries(v).map(([k2, v2]) => ({ label: humanize(k2), value: String(v2) }));
        drawEyebrow(ctx, humanize(k));
        if (tiles.length) drawMetricGrid(ctx, tiles, 2);
      } else {
        drawTextCard(ctx, humanize(k), String(v));
      }
    });
  }

  if (sm.businessGoals) {
    drawSubhead(ctx, "Business goals");
    const items = Object.entries(sm.businessGoals).map(([k, v]) => ({ k: humanize(k), v: typeof v === "string" ? v : valueToString(v) }));
    drawKVCard(ctx, "Goals", items);
  }

  if (sm.brandHealth) {
    drawSubhead(ctx, "Brand health");
    const tiles = Object.entries(sm.brandHealth).map(([k, v]: any) => ({
      label: humanize(k),
      value: typeof v === "object" ? `${v.score ?? ""}` : String(v),
      sub: typeof v === "object" && v.note ? String(v.note) : undefined,
    }));
    drawMetricGrid(ctx, tiles, 2);
  }
}

function renderActionPlan(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const plan = ef.actionPlan;
  if (!plan) return;

  ctx.sectionNumber = 6;
  newPage(ctx, "Action Plan");
  drawPageTitle(ctx, "Your 4-Week Action Plan", "Quick-start tasks for your first month.");
  const completion = (s.task_completion || {}) as Record<string, boolean>;

  ([plan.week1, plan.week2, plan.week3, plan.week4]).forEach((w, i) => {
    if (!w) return;
    const tasks = w.tasks || [];
    const innerW = ctx.contentW - SPACING.cardPadX * 2;
    const titleH = 30;
    const taskH = tasks.reduce((acc: number, t: any) => {
      const txt = `${t.task}${t.estimatedTime ? `  (${t.estimatedTime})` : ""}`;
      return acc + Math.max(measureText(ctx.pdf, txt, innerW - 18, 10).height + 6, 18);
    }, 0);
    drawCard(ctx, titleH + taskH, (x, y, width) => {
      setFont(ctx.pdf, "bold", 8, COLORS.coral);
      ctx.pdf.text(`WEEK ${String(i + 1).padStart(2, "0")}`, x, y + 10);
      setFont(ctx.pdf, "bold", 14, COLORS.ink);
      ctx.pdf.text(safe(w.title || ""), x, y + 26);
      let cy = y + titleH;
      tasks.forEach((t: any) => {
        const done = !!completion[t.id];
        // Checkbox
        ctx.pdf.setDrawColor(...COLORS.muted);
        ctx.pdf.setLineWidth(0.6);
        ctx.pdf.roundedRect(x, cy + 2, 10, 10, 2, 2, "S");
        if (done) {
          ctx.pdf.setFillColor(...COLORS.coral);
          ctx.pdf.roundedRect(x + 1.5, cy + 3.5, 7, 7, 1.5, 1.5, "F");
        }
        const txt = `${t.task}${t.estimatedTime ? `  (${t.estimatedTime})` : ""}`;
        const used = drawWrapped(ctx.pdf, txt, x + 18, cy, width - 18, 10, done ? "italic" : "normal", done ? COLORS.muted : COLORS.body);
        cy += Math.max(used + 6, 18);
      });
    }, { accent: "ink" });
  });

  const r = plan.ongoingRoutine;
  if (r) {
    drawSubhead(ctx, "Ongoing weekly routine");
    const items = (["daily", "weekly", "biweekly", "monthly"] as const)
      .map((k) => {
        const item = r[k];
        if (!item?.task) return null;
        return { k: `${k}${item.time ? ` (${item.time})` : ""}`, v: item.task };
      })
      .filter(Boolean) as { k: string; v: string }[];
    if (items.length) drawKVCard(ctx, "Cadence", items);
    if (r.totalTimePerWeek) drawTextCard(ctx, "Total time per week", r.totalTimePerWeek);
    if (r.comparison) drawTextCard(ctx, "Comparison", r.comparison);
  }
}

// ---------- Cover ----------

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

  // White background to match the platform
  pdf.setFillColor(...COLORS.pageBg);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Coral header band
  pdf.setFillColor(...COLORS.coral);
  pdf.rect(0, 0, pageW, 8, "F");

  // Logo top-left
  const logo = await loadLogo();
  if (logo) {
    const targetH = 36;
    const targetW = (logo.w / logo.h) * targetH;
    pdf.addImage(logo.dataUrl, "PNG", margin, margin + 4, targetW, targetH);
  }

  // Big card-style hero in middle of page
  const cardX = margin;
  const cardW = pageW - margin * 2;
  const cardY = pageH * 0.28;
  const cardH = 280;

  pdf.setFillColor(...COLORS.cardBg);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 14, 14, "F");
  pdf.setDrawColor(...COLORS.cardBorder);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(cardX, cardY, cardW, cardH, 14, 14, "S");

  // Coral accent strip on left of card
  pdf.setFillColor(...COLORS.coral);
  pdf.rect(cardX, cardY + 16, 4, cardH - 32, "F");

  // Eyebrow
  setFont(pdf, "bold", 9, COLORS.coral);
  pdf.text("STRATEGIC REPORT", cardX + 32, cardY + 40);

  // Title
  setFont(pdf, "bold", 32, COLORS.ink);
  pdf.text(safe("Chief MOXIE Officer"), cardX + 32, cardY + 84);
  setFont(pdf, "normal", 24, COLORS.body);
  pdf.text(safe("Strategic Report"), cardX + 32, cardY + 116);

  // Divider
  pdf.setDrawColor(...COLORS.rule);
  pdf.setLineWidth(0.5);
  pdf.line(cardX + 32, cardY + 144, cardX + cardW - 32, cardY + 144);

  // Prepared for
  const company = (companyName && companyName.trim()) || "Your business";
  setFont(pdf, "bold", 10, COLORS.muted);
  pdf.text("PREPARED FOR", cardX + 32, cardY + 172);
  setFont(pdf, "bold", 18, COLORS.ink);
  pdf.text(safe(company), cardX + 32, cardY + 196);

  setFont(pdf, "bold", 10, COLORS.muted);
  pdf.text("PREPARED ON", cardX + 32, cardY + 224);
  setFont(pdf, "normal", 12, COLORS.body);
  pdf.text(
    safe(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })),
    cardX + 32,
    cardY + 244
  );

  // Footer banner — coral pill
  const bannerY = pageH - margin - 50;
  pdf.setFillColor(...COLORS.coralSoft);
  pdf.roundedRect(margin, bannerY, pageW - margin * 2, 32, 8, 8, "F");
  setFont(pdf, "bold", 9, COLORS.ink);
  pdf.text(
    safe(`CONFIDENTIAL  -  Prepared exclusively for ${company.toUpperCase()}.  Not for distribution.`),
    pageW / 2,
    bannerY + 20,
    { align: "center" }
  );
}

// ---------- Public API ----------

export async function exportStrategyPdf(opts: {
  strategy?: StrategyLike;
  fileName?: string;
  brandName?: string;
  companyName?: string;
  sections?: { id: string; title: string }[];
}) {
  const { strategy, fileName = "moxie-strategy.pdf", brandName = "MOXIE", companyName } = opts;

  if (!strategy) {
    toast.error("Nothing to export yet");
    return;
  }

  const t = toast.loading("Preparing PDF...");
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

    // Footer (skip cover)
    const total = pdf.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      pdf.setPage(p);
      reset(pdf);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...COLORS.muted);
      pdf.text(`${p - 1} / ${total - 1}`, pageW - margin, pageH - 20, { align: "right" });
      pdf.text(safe(brandName.toUpperCase() + "  -  STRATEGIC REPORT"), margin, pageH - 20);
    }

    pdf.save(fileName);
    toast.success("PDF downloaded", { id: t });
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("Couldn't generate PDF", { id: t });
  }
}
