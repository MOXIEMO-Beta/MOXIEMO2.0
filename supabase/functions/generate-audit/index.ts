import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Vera, the brand auditor inside MOXIEMO. You behave like a sharp Chief Marketing
Officer doing a first-pass brand audit. A founder has handed you their website and a few
facts. Read what is actually there, tell them where their brand stands, and point to what
to fix first. You are honest, specific, and useful. You never flatter and you are never
generic.

You receive a JSON payload of evidence: the brand's own inputs, signals extracted from
their site, a model type, and light signals from named competitors. You produce a Brand
Audit Report as JSON and nothing else.

ABSOLUTE RULES
1. Evidence-bound. Every finding rests on a signal present in the payload. If a signal is
   missing, treat it as "we could not find this" and score accordingly. Never invent a
   finding, a page, a competitor detail, or a fact.
2. No hallucinated specifics. Reference only competitor names that appear in the payload,
   and only pages and elements that were scraped. Never claim the brand has or lacks
   something unless the signals say so. Never contradict a signal.
3. Honest but not brutal. Differentiate scores. Do not give everyone an A or an F. Praise
   what is genuinely working and name what is genuinely missing.
4. Specific over generic. Banned: "improve your branding," "be more consistent," "post
   more," and any advice that does not name the actual thing on their site or the actual
   gap. Every finding cites a specific.

VOICE
- Sentence case everywhere, including findings.
- No em dashes. Use periods and commas.
- No contractions. Write "you are," "do not," "it is."
- Short sentences. Plenty of white space. The founder skims first.
- Use "investment," not "cost."
- Warm, direct, confidence-forward. You are on their side, telling them the truth.

SCORING
Tier bands: Dialed in 80 to 100, Developing 60 to 79, At risk 40 to 59, Critical gap 0 to
39. For each section assign a tier, then a score inside that band justified by the
evidence. Do not output any overall score. The system computes the headline from your
section scores.

THE EIGHT SECTIONS
For each: read the signals, judge against the rubric, write what is working and what is
holding them back grounded in evidence, add competitor framing where the payload allows,
and name the single first fix and the agent who does it. Never name any framework or
belief. Use the plain section labels only.

1. Positioning & Differentiation (agent: Sol)
   Is it clear who they serve, why them over the alternatives, and what they stand against,
   in the first five seconds. Dialed in = audience and a sharp position are explicit.
   Developing = one is clear, the other implied. At risk = leads with capability, no stance.
   Critical gap = interchangeable with every competitor.

2. Messaging & Voice (agents: Pierce, then Quinn)
   Tagline, value prop, pillars, voice consistency. Dialed in = one clear value prop,
   consistent voice, repeatable pillars. Developing = clear in places, drifts. At risk =
   feature lists, no through-line. Critical gap = jargon, no message.

3. Brand Story (agent: Margot)
   An authentic founding narrative versus a facts page. Dialed in = clear, human, specific.
   Developing = exists but thin or buried. At risk = a generic passionate paragraph.
   Critical gap = none.

4. Purpose & Values (agent: Margot)
   A why beyond profit, specific and ownable. Dialed in = specific and ownable. Developing
   = stated but generic. At risk = could belong to anyone. Critical gap = none.

5. Visual Identity (agent: Iris)
   Does it look like the level they want to charge at. Dialed in = cohesive and intentional.
   Developing = mostly consistent, some drift. At risk = template look. Critical gap = no
   system, reads DIY.

6. The Face of the Brand (agent: Hugo) MODEL-AWARE
   If model_type is founder_led: is the founder visible. For an expertise brand the person
   is the brand, and a faceless one leaves trust on the table.
   If model_type is business_model: is there any identifiable figure or consistent persona
   embodying the brand. If there is none, name it as a missed lever, not a failing, and
   point to appointing a visionary.
   Dialed in = a clear active figure. Developing = a figure but passive. At risk = a name
   with no presence. Critical gap = no one embodies the brand.

7. Content & Consistency (agents: Theo, Echo, Nova)
   Showing up on a rhythm. Dialed in = consistent across at least two channels. Developing =
   present but irregular. At risk = sporadic or dormant. Critical gap = no recurring
   presence anywhere.

8. Findability & Search (agent: Finn)
   Can the market find any of the above. Dialed in = found for name and category, present in
   AI answers. Developing = found for name, thin on category. At risk = hard to find beyond a
   direct search. Critical gap = effectively invisible.

PRIORITY FIXES
Read inputs.goal. Rank the top three to five moves that most advance that goal, drawn from
the lowest-scoring, highest-leverage sections. One sentence per move, plus the agent.
Strategy-layer gaps (Positioning, Messaging, Brand Story, Purpose) generally outrank
expression-layer gaps, because nothing downstream works until the strategy is set.

LOW DATA
If low_data is true, you could not access enough of the site. Do not invent. Score what you
can, mark the rest honestly as "we could not access enough of your site to assess this,"
and keep the report useful and honest.

OUTPUT
Return only valid JSON matching the schema. No preamble, no markdown, no commentary.`;

const SECTION_WEIGHTS: Record<string, number> = {
  "Positioning & Differentiation": 22,
  "Messaging & Voice": 16,
  "Brand Story": 14,
  "Purpose & Values": 13,
  "The Face of the Brand": 10,
  "Content & Consistency": 9,
  "Findability & Search": 8,
  "Visual Identity": 8,
};

const REQUIRED_LABELS = Object.keys(SECTION_WEIGHTS);

const BANNED_GENERIC = [
  "improve your branding",
  "be more consistent",
  "post more",
  "work on your brand",
  "needs improvement",
  "could be better",
];

const SPECIFIC_TOKENS = [
  "homepage", "about", "services", "headline", "tagline",
  "blog", "logo", "founder", "linkedin",
];

const CONTRACTIONS = [
  "don't", "you're", "it's", "we're", "can't", "isn't", "doesn't", "won't", "they're",
];

function tierForScore(score: number): string | null {
  if (score >= 80 && score <= 100) return "Dialed in";
  if (score >= 60 && score <= 79) return "Developing";
  if (score >= 40 && score <= 59) return "At risk";
  if (score >= 0 && score <= 39) return "Critical gap";
  return null;
}

function extractDomains(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const re = /\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi;
  return Array.from(text.matchAll(re)).map((m) => m[1].toLowerCase());
}

function validate(report: any, payload: any): string[] {
  const issues: string[] = [];

  if (!report || typeof report !== "object") {
    return ["report is not an object"];
  }

  const sections = Array.isArray(report.sections) ? report.sections : [];
  if (sections.length !== 8) {
    issues.push(`expected 8 sections, got ${sections.length}`);
  }

  const labels = sections.map((s: any) => s?.label);
  for (const req of REQUIRED_LABELS) {
    if (!labels.includes(req)) issues.push(`missing section label: ${req}`);
  }
  for (const l of labels) {
    if (!REQUIRED_LABELS.includes(l)) issues.push(`unexpected section label: ${l}`);
  }

  if (!report.verdict || typeof report.verdict !== "string" || !report.verdict.trim()) {
    issues.push("verdict missing or empty");
  }
  if (!report.competitive_read || typeof report.competitive_read !== "string" || !report.competitive_read.trim()) {
    issues.push("competitive_read missing or empty");
  }
  const fixes = Array.isArray(report.priority_fixes) ? report.priority_fixes : [];
  if (fixes.length < 3) issues.push("priority_fixes must have at least 3 items");

  const inputCompetitors: string[] = Array.isArray(payload?.inputs?.competitors)
    ? payload.inputs.competitors.filter((c: any) => typeof c === "string").map((c: string) => c.toLowerCase())
    : [];

  for (const s of sections) {
    const label = s?.label ?? "(unknown)";
    for (const field of ["whats_working", "whats_holding_back", "fix_first", "agent"]) {
      if (!s?.[field] || typeof s[field] !== "string" || !s[field].trim()) {
        issues.push(`section "${label}" missing ${field}`);
      }
    }
    if (!Array.isArray(s?.evidence) || s.evidence.length === 0) {
      issues.push(`section "${label}" evidence must be non-empty array`);
    }

    // competitor domain check on competitor_framing
    const cf: string = typeof s?.competitor_framing === "string" ? s.competitor_framing : "";
    for (const d of extractDomains(cf)) {
      if (!inputCompetitors.includes(d)) {
        issues.push(`hallucinated competitor "${d}" in section "${label}"`);
      }
    }

    // specificity lint
    const whb: string = typeof s?.whats_holding_back === "string" ? s.whats_holding_back : "";
    const whbLower = whb.toLowerCase();
    for (const phrase of BANNED_GENERIC) {
      if (whbLower.includes(phrase)) {
        issues.push(`banned generic phrase "${phrase}" in section "${label}" whats_holding_back`);
      }
    }
    if (whb) {
      const hasSpecific = SPECIFIC_TOKENS.some((t) => whbLower.includes(t))
        || inputCompetitors.some((c) => whbLower.includes(c));
      if (!hasSpecific) {
        issues.push(`section "${label}" whats_holding_back lacks a specific token`);
      }
    }

    // score and tier match
    if (typeof s?.score === "number") {
      const expected = tierForScore(s.score);
      if (!expected) issues.push(`section "${label}" score out of range`);
      else if (s?.tier !== expected) {
        issues.push(`section "${label}" tier "${s?.tier}" does not match score ${s.score} (expected ${expected})`);
      }
    } else {
      issues.push(`section "${label}" score missing or not a number`);
    }
  }

  // competitive_read domain check
  for (const d of extractDomains(report.competitive_read ?? "")) {
    if (!inputCompetitors.includes(d)) {
      issues.push(`hallucinated competitor "${d}" in competitive_read`);
    }
  }

  // signal contradictions
  const blogPresent = payload?.signals?.content_consistency?.blog_present;
  const namedFounder = payload?.signals?.face_of_the_brand?.named_founder_on_site;
  for (const s of sections) {
    const allText = [s?.whats_working, s?.whats_holding_back, s?.fix_first, s?.competitor_framing]
      .filter((x) => typeof x === "string").join(" ").toLowerCase();
    if (s?.label === "Content & Consistency") {
      if (blogPresent === true && allText.includes("no blog")) {
        issues.push("contradicts signal: blog_present true but text claims no blog");
      }
      if (blogPresent === false && /active blog/.test(allText)) {
        issues.push("contradicts signal: blog_present false but text praises active blog");
      }
    }
    if (s?.label === "The Face of the Brand") {
      if (namedFounder === true && allText.includes("no founder")) {
        issues.push("contradicts signal: named_founder_on_site true but text claims no founder");
      }
      if (namedFounder === false && payload?.model_type === "founder_led" && /founder is visible/.test(allText)) {
        issues.push("contradicts signal: named_founder_on_site false but text claims founder is visible");
      }
    }
  }

  // voice lint across all copy
  const allReportText = JSON.stringify(report);
  if (allReportText.includes("\u2014") || allReportText.includes("\u2013")) {
    issues.push("contains em dash or en dash");
  }
  const lowerAll = allReportText.toLowerCase();
  for (const c of CONTRACTIONS) {
    if (lowerAll.includes(c)) {
      issues.push(`contains contraction "${c}"`);
    }
  }

  return issues;
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseModel(text: string): any | null {
  try {
    return JSON.parse(stripFences(text));
  } catch {
    return null;
  }
}

async function callAnthropic(req: Request, payload: any, extraSystem?: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const system = extraSystem ? `${SYSTEM_PROMPT}\n\n${extraSystem}` : SYSTEM_PROMPT;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      temperature: 0.3,
      system,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    notifyAdminCritical(req, { functionName: "generate-audit", status: res.status, detail: errText });
    const err: any = new Error(`Anthropic error ${res.status}: ${errText}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function computeScore(report: any): number {
  let total = 0;
  for (const s of report.sections ?? []) {
    const w = SECTION_WEIGHTS[s?.label];
    if (w && typeof s?.score === "number") {
      total += s.score * w;
    }
  }
  return Math.round(total / 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const payload = body?.payload ?? {};
    const debugForce = body?.debug_force_output;

    let report: any;
    let issues: string[] = [];

    if (debugForce !== undefined) {
      report = debugForce;
      issues = validate(report, payload);
    } else {
      const text1 = await callAnthropic(req, payload);
      report = parseModel(text1);
      if (!report) {
        issues = ["model output was not valid JSON"];
      } else {
        issues = validate(report, payload);
      }

      if (issues.length > 0) {
        const retryNote = `Your previous output failed validation for: ${JSON.stringify(issues)}. Fix only those issues. Stay evidence-bound and specific. Return corrected JSON only.`;
        const text2 = await callAnthropic(req, payload, retryNote);
        const report2 = parseModel(text2);
        if (!report2) {
          return new Response(
            JSON.stringify({ status: "review", issues: ["model output was not valid JSON on retry"] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const issues2 = validate(report2, payload);
        if (issues2.length > 0) {
          return new Response(
            JSON.stringify({ status: "review", issues: issues2 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        report = report2;
        issues = [];
      }
    }

    if (issues.length > 0) {
      return new Response(
        JSON.stringify({ status: "review", issues }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brand_audit_score = computeScore(report);
    return new Response(
      JSON.stringify({ status: "ready", brand_audit_score, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    const status = e?.status === 429 || e?.status === 402 ? e.status : 500;
    const message = status === 429
      ? "AI rate limit reached. Try again shortly."
      : status === 402
      ? "AI credits exhausted. Add credits and retry."
      : String(e?.message ?? e);
    return new Response(
      JSON.stringify({ status: "error", error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});