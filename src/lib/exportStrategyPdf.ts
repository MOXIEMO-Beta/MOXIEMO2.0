import jsPDF from "jspdf";
import { toast } from "sonner";

/**
 * Data-driven PDF export. Reads directly from the strategy object so every
 * section is included regardless of which tab is currently mounted.
 */

type StrategyLike = any;

const COLORS = {
  ink: [20, 20, 20] as const,
  body: [55, 55, 55] as const,
  muted: [120, 120, 120] as const,
  rule: [220, 215, 205] as const,
  accent: [196, 156, 76] as const, // gold-ish
  cream: [245, 240, 230] as const,
  softCream: [250, 247, 240] as const,
  white: [255, 255, 255] as const,
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
}

function newPage(ctx: Ctx, sectionTitle?: string) {
  ctx.pdf.addPage();
  ctx.y = ctx.margin + 56;
  if (sectionTitle) ctx.sectionTitle = sectionTitle;
  drawHeader(ctx);
}

function drawHeader(ctx: Ctx) {
  const { pdf, pageW, margin, brand, sectionTitle } = ctx;
  pdf.setFillColor(...COLORS.cream);
  pdf.rect(0, 0, pageW, 48, "F");
  pdf.setTextColor(...COLORS.ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(brand.toUpperCase() + " · STRATEGY", margin, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text(sectionTitle, margin, 38);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > ctx.pageH - ctx.margin) {
    newPage(ctx, ctx.sectionTitle + " (cont.)");
  }
}

function drawHr(ctx: Ctx) {
  ensureSpace(ctx, 12);
  ctx.pdf.setDrawColor(...COLORS.rule);
  ctx.pdf.setLineWidth(0.5);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin + ctx.contentW, ctx.y);
  ctx.y += 12;
}

function drawSectionTitle(ctx: Ctx, title: string) {
  ensureSpace(ctx, 30);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(16);
  ctx.pdf.setTextColor(...COLORS.ink);
  ctx.pdf.text(title, ctx.margin, ctx.y);
  ctx.y += 20;
}

function drawEyebrow(ctx: Ctx, text: string) {
  ensureSpace(ctx, 16);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(8);
  ctx.pdf.setTextColor(...COLORS.accent);
  ctx.pdf.text(text.toUpperCase(), ctx.margin, ctx.y);
  ctx.y += 14;
}

function drawLabel(ctx: Ctx, text: string) {
  ensureSpace(ctx, 14);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(10);
  ctx.pdf.setTextColor(...COLORS.ink);
  ctx.pdf.text(text, ctx.margin, ctx.y);
  ctx.y += 13;
}

function drawText(ctx: Ctx, text: string, opts: { size?: number; color?: readonly [number, number, number]; bold?: boolean; italic?: boolean; indent?: number; lineGap?: number } = {}) {
  if (!text) return;
  const size = opts.size ?? 10;
  const color = opts.color ?? COLORS.body;
  const indent = opts.indent ?? 0;
  const lineGap = opts.lineGap ?? 3;
  ctx.pdf.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
  ctx.pdf.setFontSize(size);
  ctx.pdf.setTextColor(...color);
  const maxW = ctx.contentW - indent;
  const lines = ctx.pdf.splitTextToSize(String(text), maxW);
  const lineH = size * 1.25;
  for (const line of lines) {
    ensureSpace(ctx, lineH);
    ctx.pdf.text(line, ctx.margin + indent, ctx.y);
    ctx.y += lineH;
  }
  ctx.y += lineGap;
}

function drawKeyValue(ctx: Ctx, key: string, value: string) {
  if (!value) return;
  drawText(ctx, key, { bold: true, size: 9, color: COLORS.muted, lineGap: 1 });
  drawText(ctx, value, { size: 10, color: COLORS.body, lineGap: 6 });
}

function drawBullets(ctx: Ctx, items: any[], opts: { bullet?: string } = {}) {
  if (!items?.length) return;
  const bullet = opts.bullet ?? "•";
  for (const it of items) {
    const text = typeof it === "string" ? it : it?.text || it?.task || it?.name || JSON.stringify(it);
    ctx.pdf.setFont("helvetica", "normal");
    ctx.pdf.setFontSize(10);
    ctx.pdf.setTextColor(...COLORS.body);
    const lines = ctx.pdf.splitTextToSize(text, ctx.contentW - 14);
    const lineH = 10 * 1.25;
    ensureSpace(ctx, lineH);
    ctx.pdf.text(bullet, ctx.margin, ctx.y);
    ctx.pdf.text(lines[0], ctx.margin + 14, ctx.y);
    ctx.y += lineH;
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(ctx, lineH);
      ctx.pdf.text(lines[i], ctx.margin + 14, ctx.y);
      ctx.y += lineH;
    }
  }
  ctx.y += 4;
}

function drawCallout(ctx: Ctx, text: string) {
  if (!text) return;
  ctx.pdf.setFont("helvetica", "italic");
  ctx.pdf.setFontSize(11);
  const lines = ctx.pdf.splitTextToSize(text, ctx.contentW - 24);
  const lineH = 11 * 1.4;
  const boxH = lines.length * lineH + 16;
  ensureSpace(ctx, boxH + 8);
  ctx.pdf.setFillColor(...COLORS.softCream);
  ctx.pdf.rect(ctx.margin, ctx.y, ctx.contentW, boxH, "F");
  ctx.pdf.setDrawColor(...COLORS.accent);
  ctx.pdf.setLineWidth(2);
  ctx.pdf.line(ctx.margin, ctx.y, ctx.margin, ctx.y + boxH);
  ctx.pdf.setTextColor(...COLORS.ink);
  let ty = ctx.y + 14;
  for (const ln of lines) {
    ctx.pdf.text(ln, ctx.margin + 12, ty);
    ty += lineH;
  }
  ctx.y += boxH + 10;
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

function renderCover(ctx: Ctx, s: StrategyLike) {
  const { pdf, pageW, pageH, margin, brand } = ctx;
  pdf.setFillColor(20, 20, 20);
  pdf.rect(0, 0, pageW, pageH, "F");

  pdf.setTextColor(...COLORS.accent);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(brand.toUpperCase(), margin, margin + 24);

  pdf.setTextColor(...COLORS.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(44);
  pdf.text("Marketing", margin, pageH / 2 - 30);
  pdf.text("foundation", margin, pageH / 2 + 18);

  if (s.positioning_statement) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(200, 200, 200);
    const lines = pdf.splitTextToSize(s.positioning_statement, pageW - margin * 2);
    let y = pageH / 2 + 60;
    for (const ln of lines.slice(0, 4)) { pdf.text(ln, margin, y); y += 16; }
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), margin, pageH - margin);
}

export async function exportStrategyPdf(opts: {
  strategy?: StrategyLike;
  fileName?: string;
  brandName?: string;
  // Legacy/no-op — kept for backwards compat with existing callers.
  sections?: { id: string; title: string }[];
}) {
  const { strategy, fileName = "moxie-strategy.pdf", brandName = "MOXIE" } = opts;

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

    renderCover(ctx, strategy);
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
