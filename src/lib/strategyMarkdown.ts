// Build a Markdown export of the full strategy report.
export function buildStrategyMarkdown(data: any): string {
  if (!data) return "";
  const m = data.meta || {};
  const p = data.positioning || {};
  const b = p.breakdown || {};
  const a = data.archetype || {};
  const cv: any[] = Array.isArray(data.coreValues) ? data.coreValues : [];
  const v = data.voice || {};
  const cs = data.contentStrategy || {};
  const cal: any[] = Array.isArray(data.calendar) ? data.calendar : [];
  const ch = data.channels || {};
  const met = data.metrics || {};
  const ap = data.actionPlan || {};
  const cp = data.competitive || {};
  const mf = data.messagingFormats || {};
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
    if (a.brandInspiration?.length) lines.push(`**Brands:** ${a.brandInspiration.map(toStr).join(", ")}`, "");
    if (a.values?.length) lines.push(`**Values:** ${a.values.map(toStr).join(", ")}`, "");
    if (a.contentApproach) lines.push(`**Content Approach:** ${a.contentApproach}`, "");
    if (a.whyThisFits?.length) {
      lines.push(`**Why This Fits You:**`);
      a.whyThisFits.forEach((w: any) => lines.push(`- ${toStr(w)}`));
      lines.push("");
    }
    if (a.howToApply?.length) {
      lines.push(`**How To Use This:**`);
      a.howToApply.forEach((w: any) => lines.push(`- ${toStr(w)}`));
      lines.push("");
    }
  }

  if (cv.length) {
    h("01B · Core Values & Decision Filters");
    cv.forEach((val) => {
      lines.push(`### ${val.name}`);
      if (val.decisionFilter) lines.push(`> ${val.decisionFilter}`, "");
      if (val.description) lines.push(val.description, "");
      if (val.yesExamples?.length) {
        lines.push(`**Yes:**`);
        val.yesExamples.forEach((y: any) => lines.push(`- ${toStr(y)}`));
      }
      if (val.noExamples?.length) {
        lines.push(`**No:**`);
        val.noExamples.forEach((y: any) => lines.push(`- ${toStr(y)}`));
      }
      lines.push("");
    });
  }

  h("02 · Voice & Brand Identity");
  if (Array.isArray(v.attributesRich) && v.attributesRich.length) {
    v.attributesRich.forEach((a: any) => {
      lines.push(`### ${toStr(a.trait || a.name)}`);
      if (a.meaning) lines.push(a.meaning, "");
      if (a.inPractice) lines.push(`*In practice:* ${a.inPractice}`, "");
      if (a.example) lines.push(`> ${a.example}`, "");
    });
  } else if (v.attributes?.length) {
    lines.push(`**Voice Attributes:** ${v.attributes.map(toStr).join(", ")}`, "");
  }
  if (Array.isArray(v.sentenceStructure) && v.sentenceStructure.length) {
    lines.push(`**Sentence Structure:**`);
    v.sentenceStructure.forEach((r: any) => lines.push(`- ${toStr(r)}`));
    lines.push("");
  }
  if (v.fullExample) lines.push(`> ${v.fullExample}`, "");
  if (v.wordsToUse?.length || v.useWords?.length) lines.push(`**Words to use:** ${(v.wordsToUse || v.useWords).map(toStr).join(", ")}`, "");
  if (v.wordsToAvoid?.length || v.avoidWords?.length) lines.push(`**Words to avoid:** ${(v.wordsToAvoid || v.avoidWords).map(toStr).join(", ")}`, "");
  const tonePlatform = v.toneByPlatform || {};
  if (Object.keys(tonePlatform).length) {
    lines.push(`**Tone by Platform:**`);
    Object.entries(tonePlatform).forEach(([k, val]: [string, any]) => {
      const tone = typeof val === "string" ? val : (val?.tone ?? val?.mode ?? "");
      const mode = typeof val === "object" ? val?.mode : "";
      const ex   = typeof val === "object" ? val?.example : "";
      lines.push(`- **${k}** — ${toStr(tone)}${mode ? ` (${mode})` : ""}${ex ? ` — "${ex}"` : ""}`);
    });
    lines.push("");
  }
  const ex = v.voiceExamples || {};
  if (Object.keys(ex).length) {
    lines.push(`**Voice Examples:**`);
    Object.entries(ex).forEach(([k, val]: [string, any]) => {
      lines.push(`- **${k}** — Good: "${val?.good || ""}" / Bad: "${val?.bad || ""}" — ${val?.why || ""}`);
    });
    lines.push("");
  }
  if (Array.isArray(v.neverSoundLikeRich) && v.neverSoundLikeRich.length) {
    lines.push(`**Never Sound Like:**`);
    v.neverSoundLikeRich.forEach((n: any) => {
      lines.push(`- **${toStr(n.style || n.name)}** — "${n.example || ""}" — ${n.why || ""}`);
    });
    lines.push("");
  } else if (v.neverSoundLike) {
    lines.push(`**Never sound like:** ${v.neverSoundLike}`, "");
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
    if (q.rationale) lines.push(`**Why this quarter:** ${q.rationale}`, "");
    if (Array.isArray(q.contentTopics) && q.contentTopics.length) {
      lines.push(`**Content Topics:**`);
      q.contentTopics.forEach((t: any) => {
        lines.push(`- W${t.week ?? ""}: **${toStr(t.topic)}**${t.keyMessage ? ` — ${t.keyMessage}` : ""}`);
      });
      lines.push("");
    }
    if (q.cta) lines.push(`- **CTA:** ${q.cta}`);
    if (q.metric) lines.push(`- **Metric:** ${q.metric}`);
    if (q.businessGoal) lines.push(`- **Business Goal:** ${q.businessGoal}`);
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
    lines.push(`### ${tier[0].toUpperCase()}${tier.slice(1)} — ${c.fullName || c.name || ""}`);
    if (c.freq) lines.push(`- Cadence: ${c.freq}`);
    if (c.tone) lines.push(`- Tone: ${c.tone}`);
    (c.rationale || []).forEach((r: any) => lines.push(`- ${toStr(r)}`));
    if (Array.isArray(c.contentTypes) && c.contentTypes.length) {
      lines.push(`- **Content Types:** ${c.contentTypes.map(toStr).join(", ")}`);
    }
    if (Array.isArray(c.schedule) && c.schedule.length) {
      lines.push(`- **Posting Schedule:**`);
      c.schedule.forEach((p: any) => lines.push(`  - ${toStr(p.day)}${p.time ? ` ${p.time}` : ""} — ${toStr(p.type)}${p.example ? `: ${p.example}` : ""}`));
    }
    if (c.metrics && Object.keys(c.metrics).length) {
      lines.push(`- **Target Metrics:**`);
      Object.entries(c.metrics).filter(([_, v]) => v).forEach(([k, v]) => lines.push(`  - ${k}: ${toStr(v)}`));
    }
    if (c.hrs || (c.timeBreakdown && Object.keys(c.timeBreakdown).length)) {
      lines.push(`- **Time Commitment${c.hrs ? ` (${c.hrs})` : ""}:**`);
      Object.entries(c.timeBreakdown || {}).filter(([_, v]) => v).forEach(([k, v]) => lines.push(`  - ${k}: ${toStr(v)}`));
    }
    lines.push("");
  });
  const goals: any[] = met.businessGoals || [];
  if (goals.length) {
    lines.push(`**Business Goals:**`);
    lines.push(`| Goal | Target |`, `|---|---|`);
    goals.forEach((g) => lines.push(`| ${toStr(g.label || g.goal)} | ${toStr(g.value || g.target)} |`));
    lines.push("");
  }
  const leadSources: any[] = met.leadSources || [];
  if (leadSources.length) {
    lines.push(`**Projected Lead Sources:**`);
    lines.push(`| Source | % | Per Week |`, `|---|---|---|`);
    leadSources.forEach((l) => lines.push(`| ${toStr(l.source)} | ${toStr(l.percentage)}% | ${toStr(l.perWeek)} |`));
    lines.push("");
  }
  const qual = met.qualification || {};
  if (Object.keys(qual).length) {
    lines.push(`**Lead Qualification Mix:**`);
    (["highFit", "mediumFit", "lowFit"] as const).forEach((k) => {
      const q: any = qual[k]; if (!q) return;
      const label = k === "highFit" ? "High Fit" : k === "mediumFit" ? "Medium Fit" : "Low Fit";
      lines.push(`- **${label} (${toStr(q.percentage)}%)** — ${toStr(q.definition)}`);
    });
    lines.push("");
  }
  const ctp = met.contentPerformance || {};
  if (Object.keys(ctp).length) {
    lines.push(`**Content Performance Targets:**`);
    Object.entries(ctp).forEach(([channel, mm]: [string, any]) => {
      lines.push(`- **${channel}:** ${Object.entries(mm || {}).map(([k, v]) => `${k}: ${toStr(v)}`).join(", ")}`);
    });
    lines.push("");
  }
  const bh = met.brandHealth || {};
  if (bh.archetypeAlignment != null || bh.voiceConsistency != null) {
    const n = (x: any) => { const v = Number(x) || 0; return (v > 10 ? v / 10 : v).toFixed(1); };
    lines.push(`**Brand Health:**`);
    lines.push(`- Archetype Alignment: ${n(bh.archetypeAlignment)} / 10`);
    lines.push(`- Voice Consistency: ${n(bh.voiceConsistency)} / 10`, "");
  }

  if (cp.headline || cp.landscape || cp.differentiators?.length || cp.competitiveAdvantages?.length) {
    h("05 · Competitive Positioning");
    if (cp.headline) lines.push(`**Your Position:** ${cp.headline}`, "");
    if (cp.landscape) lines.push(`**Market Gap:** ${cp.landscape}`, "");
    if (Array.isArray(cp.differentiators) && cp.differentiators.length) {
      lines.push(`| Factor | You | Competitors |`, `|---|---|---|`);
      cp.differentiators.forEach((d: any) =>
        lines.push(`| ${toStr(d.factor)} | ${toStr(d.you).replace(/\|/g, "\\|")} | ${toStr(d.competitors).replace(/\|/g, "\\|")} |`)
      );
      lines.push("");
    }
    if (Array.isArray(cp.competitiveAdvantages) && cp.competitiveAdvantages.length) {
      lines.push(`**Competitive Advantages:**`);
      cp.competitiveAdvantages.forEach((a: any) => lines.push(`- ${toStr(a)}`));
      lines.push("");
    }
    if (Array.isArray(cp.doNotCompeteOn) && cp.doNotCompeteOn.length) {
      lines.push(`**What You Don't Compete On:**`);
      cp.doNotCompeteOn.forEach((a: any) => lines.push(`- ${toStr(a)}`));
      lines.push("");
    }
    if (cp.antiClient) lines.push(`**Who Is Not Your Ideal Client:** ${cp.antiClient}`, "");
    if (cp.alternatives) lines.push(`**Alternatives:** ${cp.alternatives}`, "");
    if (cp.whyYouWin) lines.push(`**When a Client Chooses You:** ${cp.whyYouWin}`, "");
  }

  if (mf.oneLiner || mf.short || mf.elevator) {
    h("05B · Messaging in Every Format");
    if (mf.oneLiner) lines.push(`**One-Liner:** ${mf.oneLiner}`, "");
    if (mf.short) lines.push(`**Short (160 chars):** ${mf.short}`, "");
    if (mf.elevator) lines.push(`**Elevator Pitch:** ${mf.elevator}`, "");
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
