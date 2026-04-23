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
  pdf.setCharSpace(1.2);
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
  pdf.setCharSpace(0);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    newPage(ctx, ctx.sectionTitle + " (cont.)");
  }
}

/**
 * Force a page break unless we have at least `needed` pts of room. Used to
 * keep a label + its first content line together so headings never get
 * orphaned at the bottom of a page.
 */
function keepTogether(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    newPage(ctx, ctx.sectionTitle + " (cont.)");
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
  ctx.pdf.setFont("times", "bold");
  ctx.pdf.setFontSize(30);
  ctx.pdf.setTextColor(...COLORS.ink);
  const lines = ctx.pdf.splitTextToSize(title, ctx.contentW);
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
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(8.5);
  ctx.pdf.setCharSpace(1.4);
  ctx.pdf.setTextColor(...COLORS.sage);
  ctx.pdf.text(text.toUpperCase(), ctx.margin, ctx.y);
  ctx.pdf.setCharSpace(0);
  ctx.y += SPACING.afterEyebrow + 6;
}

function drawLabel(ctx: Ctx, text: string) {
  // Serif sub-headline, matching "This includes:" / "The Core Opportunity"
  // style from the reference.
  keepTogether(ctx, 40);
  ctx.pdf.setFont("times", "bold");
  ctx.pdf.setFontSize(14);
  ctx.pdf.setTextColor(...COLORS.ink);
  ctx.pdf.text(text, ctx.margin, ctx.y);
  ctx.y += SPACING.afterLabel + 10;
}

function drawText(ctx: Ctx, text: string, opts: { size?: number; color?: readonly [number, number, number]; bold?: boolean; italic?: boolean; indent?: number; lineGap?: number } = {}) {
  if (!text) return;
  const size = opts.size ?? 10;
  const color = opts.color ?? COLORS.body;
  const indent = opts.indent ?? 0;
  const lineGap = opts.lineGap ?? SPACING.afterParagraph;
  ctx.pdf.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
  ctx.pdf.setFontSize(size);
  ctx.pdf.setTextColor(...color);
  const maxW = ctx.contentW - indent;
  const lines = ctx.pdf.splitTextToSize(String(text), maxW);
  const lineH = size * SPACING.lineHeightRatio;
  // Keep the first 2 lines together with the previous element so single-line
  // labels don't get stranded above a page break.
  keepTogether(ctx, Math.min(lines.length, 2) * lineH);
  for (const line of lines) {
    if (ctx.y + lineH > ctx.pageH - ctx.margin) {
      newPage(ctx, ctx.sectionTitle + " (cont.)");
      // Reset font after page break (header changes it).
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
    const text = typeof it === "string" ? it : it?.text || it?.task || it?.name || JSON.stringify(it);
    ctx.pdf.setFont("helvetica", "normal");
    ctx.pdf.setFontSize(size);
    ctx.pdf.setTextColor(...COLORS.body);
    const lines = ctx.pdf.splitTextToSize(String(text), ctx.contentW - indent);
    // Keep the bullet's first 2 lines together; long bullets can wrap onto the
    // next page but won't be split immediately after the marker.
    keepTogether(ctx, Math.min(lines.length, 2) * lineH);
    for (let i = 0; i < lines.length; i++) {
      if (ctx.y + lineH > ctx.pageH - ctx.margin) {
        newPage(ctx, ctx.sectionTitle + " (cont.)");
        ctx.pdf.setFont("helvetica", "normal");
        ctx.pdf.setFontSize(size);
        ctx.pdf.setTextColor(...COLORS.body);
      }
      if (i === 0) {
        ctx.pdf.setTextColor(...COLORS.accent);
        ctx.pdf.text(bullet, ctx.margin + 2, ctx.y);
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
  ctx.pdf.setFont("helvetica", "italic");
  ctx.pdf.setFontSize(size);
  const lines = ctx.pdf.splitTextToSize(String(text), ctx.contentW - padX * 2);
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
      if (i < lines.length) newPage(ctx, ctx.sectionTitle + " (cont.)");
    }
    return;
  }

  // Normal case: keep the whole callout on one page.
  if (fullH + 8 > available) newPage(ctx, ctx.sectionTitle + " (cont.)");
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
  ctx.sectionTitle = "Overview";
  newPage(ctx, "Overview");

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
    drawText(ctx, [a.icon, a.name].filter(Boolean).join("  "), { size: 18, bold: true, color: COLORS.ink, lineGap: 4 });
    if (a.secondary) drawText(ctx, `Secondary: ${a.secondary}`, { size: 9, color: COLORS.muted, lineGap: 8 });
    if (a.description) drawText(ctx, a.description, { size: 11 });
    if (a.exampleBrands?.length) drawKeyValue(ctx, "Brands", asArray(a.exampleBrands).join(", "));
    if (a.coreValues?.length) drawKeyValue(ctx, "Values", asArray(a.coreValues).join(", "));
    if (a.contentApproach) drawKeyValue(ctx, "Content approach", a.contentApproach);
    if (a.whyThisFits?.length) { drawLabel(ctx, "Why this fits you"); drawBullets(ctx, a.whyThisFits); }
    if (a.howToApply?.length) { drawLabel(ctx, "How to use this"); drawBullets(ctx, a.howToApply, { bullet: "→" }); }
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
      if (v.yesExamples?.length) { drawText(ctx, "Yes:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, v.yesExamples, { bullet: "✓" }); }
      if (v.noExamples?.length) { drawText(ctx, "No:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, v.noExamples, { bullet: "✗" }); }
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
  newPage(ctx, "Voice & Brand");
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
      Object.entries(v.sentenceStructure).forEach(([k, val]) => drawKeyValue(ctx, k, String(val)));
    }
  }

  if (v.vocabulary) {
    drawLabel(ctx, "Vocabulary");
    if (v.vocabulary.use?.length) drawKeyValue(ctx, "Use", asArray(v.vocabulary.use).join(", "));
    if (v.vocabulary.avoid?.length) drawKeyValue(ctx, "Avoid", asArray(v.vocabulary.avoid).join(", "));
  }

  if (v.toneByPlatform) {
    drawLabel(ctx, "Tone by platform");
    Object.entries(v.toneByPlatform).forEach(([p, t]: any) => drawKeyValue(ctx, p, typeof t === "string" ? t : t?.tone || JSON.stringify(t)));
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
      drawText(ctx, `✗ ${n.example || n}`, { color: COLORS.body, lineGap: 1 });
      if (n.why) drawText(ctx, `   Why: ${n.why}`, { size: 9, color: COLORS.muted });
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

  newPage(ctx, "Content");

  if (s.content_pillars?.length) {
    drawEyebrow(ctx, "Content pillars");
    drawBullets(ctx, asArray(s.content_pillars));
  }

  if (themes.length) {
    drawEyebrow(ctx, "Quarterly themes");
    themes.forEach((t: any, i: number) => {
      drawText(ctx, `${t.quarter || `Q${i + 1}`} · ${t.theme || ""}`, { size: 13, bold: true, color: COLORS.ink, lineGap: 3 });
      if (t.description) drawText(ctx, t.description);
      if (t.contentTopics?.length) { drawText(ctx, "Topics:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, t.contentTopics); }
      if (t.contentMix) {
        drawText(ctx, "Content mix:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 });
        Object.entries(t.contentMix).forEach(([k, v]) => drawKeyValue(ctx, k, String(v)));
      }
      if (t.successMetrics?.length) { drawText(ctx, "Success metrics:", { bold: true, size: 9, color: COLORS.muted, lineGap: 1 }); drawBullets(ctx, t.successMetrics); }
      ctx.y += 4;
    });
  }

  if (calendar.length) {
    drawHr(ctx);
    drawEyebrow(ctx, "30-day content calendar");
    calendar.slice(0, 60).forEach((item: any) => {
      const head = [item.day && `Day ${item.day}`, item.platform, item.format].filter(Boolean).join(" · ");
      drawText(ctx, head, { bold: true, size: 10, color: COLORS.ink, lineGap: 1 });
      if (item.title || item.topic) drawText(ctx, item.title || item.topic, { size: 10 });
      if (item.notes) drawText(ctx, item.notes, { size: 9, color: COLORS.muted, lineGap: 6 });
    });
  }
}

function renderChannels(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const cs = ef.channelStrategy;
  if (!cs) return;

  newPage(ctx, "Channels");

  (["primary", "secondary", "tertiary"] as const).forEach((tier) => {
    const ch = cs[tier];
    if (!ch || typeof ch === "string") return;
    drawEyebrow(ctx, `${tier} channel`);
    drawText(ctx, ch.platform || tier, { size: 14, bold: true, color: COLORS.ink, lineGap: 3 });
    if (ch.rationale) drawText(ctx, ch.rationale, { italic: true, color: COLORS.body });

    if (ch.contentStrategy && typeof ch.contentStrategy === "object") {
      drawLabel(ctx, "Content strategy");
      Object.entries(ch.contentStrategy).forEach(([k, v]) => {
        if (Array.isArray(v)) drawKeyValue(ctx, k, v.join(", "));
        else if (v) drawKeyValue(ctx, k, String(v));
      });
    }
    if (ch.postingSchedule && typeof ch.postingSchedule === "object") {
      drawLabel(ctx, "Posting schedule");
      Object.entries(ch.postingSchedule).forEach(([k, v]) => drawKeyValue(ctx, k, String(v)));
    }
    if (ch.successMetrics) {
      drawLabel(ctx, "Success metrics");
      if (Array.isArray(ch.successMetrics)) drawBullets(ctx, ch.successMetrics);
      else Object.entries(ch.successMetrics).forEach(([k, v]) => drawKeyValue(ctx, k, String(v)));
    }
    if (ch.timeAllocation) {
      drawKeyValue(ctx, "Time allocation", typeof ch.timeAllocation === "string" ? ch.timeAllocation : JSON.stringify(ch.timeAllocation));
    }
    drawHr(ctx);
  });

  if (cs.timeSavings || cs.comparison) {
    drawEyebrow(ctx, "Time savings with MOXIE");
    if (cs.timeSavings) drawText(ctx, typeof cs.timeSavings === "string" ? cs.timeSavings : JSON.stringify(cs.timeSavings));
    if (cs.comparison) drawText(ctx, cs.comparison, { italic: true, color: COLORS.muted });
  }
}

function renderMetrics(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const sm = ef.successMetrics;
  if (!sm) return;

  newPage(ctx, "Metrics");

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
    Object.entries(sm.businessGoals).forEach(([k, v]) => drawKeyValue(ctx, k, typeof v === "string" ? v : JSON.stringify(v)));
  }

  if (sm.brandHealth) {
    drawEyebrow(ctx, "Brand health");
    Object.entries(sm.brandHealth).forEach(([k, v]: any) => drawKeyValue(ctx, k, typeof v === "object" ? `${v.score ?? ""} ${v.note ? `— ${v.note}` : ""}` : String(v)));
  }
}

function renderActionPlan(ctx: Ctx, s: StrategyLike) {
  const ef = s.enhanced_foundation || {};
  const plan = ef.actionPlan;
  if (!plan) return;

  newPage(ctx, "Action Plan");
  const completion = (s.task_completion || {}) as Record<string, boolean>;

  ([plan.week1, plan.week2, plan.week3, plan.week4]).forEach((w, i) => {
    if (!w) return;
    drawEyebrow(ctx, `Week ${i + 1}`);
    if (w.title) drawText(ctx, w.title, { size: 13, bold: true, color: COLORS.ink, lineGap: 6 });
    const tasks = w.tasks || [];
    tasks.forEach((t: any) => {
      const mark = completion[t.id] ? "☑" : "☐";
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

  // Beige background
  pdf.setFillColor(...COLORS.cream);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Logo (top-left, generous)
  const logo = await loadLogo();
  if (logo) {
    const targetH = 36;
    const targetW = (logo.w / logo.h) * targetH;
    pdf.addImage(logo.dataUrl, "PNG", margin, margin + 8, targetW, targetH);
  }

  // Thin gold rule below logo
  pdf.setDrawColor(...COLORS.accent);
  pdf.setLineWidth(1);
  pdf.line(margin, margin + 64, margin + 80, margin + 64);

  // Eyebrow
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setCharSpace(2);
  pdf.setTextColor(...COLORS.accent);
  pdf.text("STRATEGIC REPORT", margin, pageH / 2 - 80);
  pdf.setCharSpace(0);

  // Title — large display
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(46);
  pdf.setTextColor(...COLORS.ink);
  pdf.text("Chief MOXIE", margin, pageH / 2 - 30);
  pdf.text("Officer", margin, pageH / 2 + 16);

  // Subtitle
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(20);
  pdf.setTextColor(...COLORS.body);
  pdf.text("Strategic Report", margin, pageH / 2 + 48);

  // Created for + date — bottom-left block
  const blockY = pageH - margin - 70;
  pdf.setDrawColor(...COLORS.accent);
  pdf.setLineWidth(0.75);
  pdf.line(margin, blockY - 20, margin + 60, blockY - 20);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setCharSpace(1.5);
  pdf.setTextColor(...COLORS.muted);
  pdf.text("CREATED FOR", margin, blockY);
  pdf.setCharSpace(0);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...COLORS.ink);
  const company = (companyName && companyName.trim()) || "Your business";
  pdf.text(company, margin, blockY + 22);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    margin,
    blockY + 44
  );
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
    };

    await renderCover(ctx, strategy, companyName);
    renderOverview(ctx, strategy);
    renderVoice(ctx, strategy);
    renderContent(ctx, strategy);
    renderChannels(ctx, strategy);
    renderMetrics(ctx, strategy);
    renderActionPlan(ctx, strategy);

    // Footer page numbers (skip cover)
    const total = pdf.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      pdf.setPage(p);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(140, 140, 140);
      pdf.text(`${p - 1} / ${total - 1}`, pageW - margin, pageH - 18, { align: "right" });
      pdf.text(brandName.toUpperCase(), margin, pageH - 18);
    }

    pdf.save(fileName);
    toast.success("PDF downloaded", { id: t });
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("Couldn't generate PDF", { id: t });
  }
}
