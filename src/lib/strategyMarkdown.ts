// Build a Markdown export of the full strategy report.
export function buildStrategyMarkdown(data: any): string {
  if (!data) return "";
  const m = data.meta || {};
  const p = data.positioning || {};
  const b = p.breakdown || {};
  const a = data.archetype || {};
  const v = data.voice || {};
  const cs = data.contentStrategy || {};
  const cal: any[] = Array.isArray(data.calendar) ? data.calendar : [];
  const ch = data.channels || {};
  const met = data.metrics || {};
  const ap = data.actionPlan || {};
  const firstName = String(m.preparedFor || "Founder").trim().split(/\s+/)[0];

  const toStr = (x: any): string => {
    if (x == null) return "";
    if (typeof x === "string" || typeof x === "number") return String(x);
    if (Array.isArray(x)) return x.map(toStr).filter(Boolean).join(", ");
    if (typeof x === "object") return x.name || x.title || x.text || x.label || "";
    return "";
  };

  const lines: string[] = [];
  const h = (s: string, level = 2) => lines.push(`${"#".repeat(level)} ${s}`, "");
  const para = (s?: string) => { if (s) lines.push(s, ""); };

  lines.push(`# MOXIEMO Strategic Report`, "");
  lines.push(`**Prepared for:** ${m.preparedFor || ""}  `);
  lines.push(`**Date:** ${m.date || ""}  `);
  lines.push(`**CONFIDENTIAL**`, "");

  h("01 · Strategic Overview");
  h("Positioning & Archetype", 3);
  para(p.statement);
  lines.push(`| Section | Detail |`, `|---|---|`);
  [["Who", b.who], ["Problem", b.problem], ["Solution", b.solution],
   ["Result", b.result], ["Method", b.method], ["Transformation", b.transformation]]
    .forEach(([k, val]) => lines.push(`| ${k} | ${toStr(val).replace(/\|/g, "\\|")} |`));
  lines.push("");
  if (a.primary) {
    lines.push(`**Archetype:** ${a.primary}${a.secondary ? ` · ${a.secondary}` : ""}`, "");
    para(a.description);
    if (a.values?.length) lines.push(`**Values:** ${a.values.map(toStr).join(", ")}`, "");
  }

  h("02 · Voice & Brand Identity");
  if (v.attributes?.length) lines.push(`**Voice Attributes:** ${v.attributes.map(toStr).join(", ")}`, "");
  if (v.useWords?.length) lines.push(`**Use:** ${v.useWords.map(toStr).join(", ")}`, "");
  if (v.avoidWords?.length) lines.push(`**Avoid:** ${v.avoidWords.map(toStr).join(", ")}`, "");
  if (v.exampleLine) lines.push(`> ${v.exampleLine}`, "");
  if (v.neverSoundLike) lines.push(`**Never sound like:** ${v.neverSoundLike}`, "");
  const tone = v.toneByChannel || {};
  if (Object.keys(tone).length) {
    lines.push(`**Tone by Channel:**`);
    Object.entries(tone).forEach(([k, val]) => lines.push(`- ${k}: ${toStr(val)}`));
    lines.push("");
  }

  h("03 · Content Strategy");
  const pillars: any[] = cs.pillars || [];
  if (pillars.length) {
    lines.push(`**Content Pillars:**`);
    pillars.forEach((pl, i) => {
      const name = typeof pl === "string" ? pl : (pl.name || pl.title || "");
      const desc = typeof pl === "object" ? pl.description : "";
      lines.push(`${i + 1}. **${name}**${desc ? ` — ${desc}` : ""}`);
    });
    lines.push("");
  }
  const quarters: any[] = cs.quarters || [];
  quarters.forEach((q) => {
    lines.push(`### ${q.label || ""} — ${q.theme || ""}`);
    if (q.arc) para(q.arc);
    if (q.cta) lines.push(`- **CTA:** ${q.cta}`);
    if (q.metric) lines.push(`- **Metric:** ${q.metric}`);
    lines.push("");
  });

  h("03B · 30-Day Content Calendar");
  if (cal.length) {
    lines.push(`| Date | Day | Channel | Format | Topic |`, `|---|---|---|---|---|`);
    cal.forEach((e) => lines.push(
      `| ${e.date || ""} | ${e.dayName || ""} | ${toStr(e.channel)} | ${toStr(e.type)} | ${toStr(e.title).replace(/\|/g, "\\|")} |`
    ));
    lines.push("");
  }

  h("04 · Channels & Metrics");
  (["primary", "secondary", "tertiary"] as const).forEach((tier) => {
    const c = ch[tier]; if (!c) return;
    lines.push(`### ${tier[0].toUpperCase()}${tier.slice(1)} — ${c.name || ""}`);
    if (c.freq) lines.push(`- Cadence: ${c.freq}`);
    (c.bullets || []).forEach((bl: string) => lines.push(`- ${bl}`));
    lines.push("");
  });
  const goals: any[] = met.businessGoals || [];
  if (goals.length) {
    lines.push(`**Business Goals:**`);
    lines.push(`| Goal | Target |`, `|---|---|`);
    goals.forEach((g) => lines.push(`| ${toStr(g.label || g.goal)} | ${toStr(g.value || g.target)} |`));
    lines.push("");
  }
  const bh = met.brandHealth || {};
  if (bh.archetypeAlignment != null || bh.voiceConsistency != null) {
    const n = (x: any) => { const v = Number(x) || 0; return (v > 10 ? v / 10 : v).toFixed(1); };
    lines.push(`**Brand Health:**`);
    lines.push(`- Archetype Alignment: ${n(bh.archetypeAlignment)} / 10`);
    lines.push(`- Voice Consistency: ${n(bh.voiceConsistency)} / 10`, "");
  }

  h("06 · Action Plan");
  (ap.weeks || []).forEach((w: any) => {
    lines.push(`### ${w.week || w.label || ""} — ${w.theme || ""}`);
    (w.tasks || []).forEach((t: any) => lines.push(`- ${typeof t === "string" ? t : (t.title || t.task || toStr(t))}`));
    lines.push("");
  });
  const r = ap.ongoingRoutine || {};
  (["daily", "weekly", "monthly"] as const).forEach((tier) => {
    const block = r[tier]; if (!block) return;
    const tasks: any[] = Array.isArray(block) ? block : block.tasks || [];
    lines.push(`**${tier[0].toUpperCase()}${tier.slice(1)}${block.hrs ? ` (${block.hrs})` : ""}:**`);
    tasks.forEach((t) => {
      if (Array.isArray(t)) lines.push(`- ${t[0]}${t[1] ? ` — ${t[1]}` : ""}`);
      else if (typeof t === "string") lines.push(`- ${t}`);
      else lines.push(`- ${t.title || t.task || ""}${t.time ? ` — ${t.time}` : ""}`);
    });
    lines.push("");
  });

  lines.push("---", "", `Built with MOXIEMO — buildwithmoxiemo.com — Generated exclusively for ${firstName}.`);
  return lines.join("\n");
}
