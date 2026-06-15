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
   gap. Every finding cites a specific token.
5. A specific token is a concrete reference: a quoted phrase from the site, a named page,
   claim, element, or a named missing element. For abstract or empty sections, the token
   can be the named absence. "No mission or values statement appears anywhere on the
   site" counts because it names what is missing.

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

SECTION JSON STRUCTURE
Every section object must use the exact same keys. Use this skeleton for one section, then
repeat the exact same keys for all eight section labels:
{
  "label": "Positioning & Differentiation",
  "score": 0,
  "tier": "Critical gap",
  "whats_working": "A non-empty evidence-bound sentence naming the nearest true strength or raw material to build on, with a specific token.",
  "whats_holding_back": "A non-empty evidence-bound sentence naming the specific gap, with a specific token.",
  "evidence": ["A non-empty evidence note from the payload."],
  "competitor_framing": "A competitor comparison grounded only in payload competitors, or a sentence saying the competitor signal is not strong enough for this section.",
  "fix_first": "A non-empty first fix.",
  "agent": "Sol"
}
All eight sections must include a non-empty whats_working string. No field may be blank,
null, undefined, or omitted for any reason. If little is working, whats_working must still
name the nearest true strength or the raw material that exists to build on, for example:
"You have a clear offer to anchor positioning on, but no point of difference is stated yet."
Positioning & Differentiation is often the weakest section, but it must still include
whats_working. Every whats_working and whats_holding_back must include a specific token.
If the finding is about an absence, name the concrete missing element, page, proof point,
or statement.

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
  "blog", "logo", "founder", "linkedin", "mission", "values",
  "story", "offer", "testimonial", "case study", "portfolio", "pricing",
  "proof", "navigation", "search", "cta", "value proposition",
];

const CONTRACTIONS = [
  "don't", "you're", "it's", "we're", "can't", "isn't", "doesn't", "won't", "they're",
];

type ValidationFailure = {
  section: string;
  field: string;
  reason: string;
  severity?: "hard" | "soft";
};

type FieldRepair = {
  section: string;
  field: string;
  new_value: unknown;
};

const NAMED_ABSENCE_PATTERNS = [
  /\b(no|missing|absent|without|lacks?|lack of|could not find|we could not find|does not show|does not include|not found|nowhere)\b.{0,90}\b(homepage|about|services|page|site|headline|tagline|mission|values|statement|founder|bio|story|blog|logo|offer|testimonial|case stud(?:y|ies)|proof|pricing|contact|portfolio|claim|cta|positioning|value proposition|social proof|navigation|content|linkedin|search)\b/i,
  /\b(no|missing|absent|without|lacks?)\s+["“][^"”]{3,}["”]/i,
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

function addFailure(issues: ValidationFailure[], section: string, field: string, reason: string) {
  issues.push({ section, field, reason });
}

function hasSpecificToken(text: string, inputCompetitors: string[]) {
  const lower = text.toLowerCase();
  return SPECIFIC_TOKENS.some((t) => lower.includes(t))
    || inputCompetitors.some((c) => lower.includes(c))
    || NAMED_ABSENCE_PATTERNS.some((re) => re.test(text));
}

function checkVoiceLint(issues: ValidationFailure[], section: string, field: string, value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  if (text.includes("\u2014") || text.includes("\u2013")) {
    addFailure(issues, section, field, "contains em dash or en dash");
  }
  const lower = text.toLowerCase();
  for (const c of CONTRACTIONS) {
    if (lower.includes(c)) addFailure(issues, section, field, `contains contraction "${c}"`);
  }
}

function formatFailures(issues: ValidationFailure[]) {
  return issues.map((issue) => `${issue.section}.${issue.field}: ${issue.reason}`);
}

// Tier each validation failure into "hard" (blocks the report) or "soft" (warn only).
// Hard: factual contradictions vs signals, missing required sections / fields,
//       hallucinated competitors, score out of range, model output not JSON.
// Soft: specificity lint ("lacks a specific token"), voice lint (em dash, contractions),
//       banned generic phrases, tier-score mismatch.
function classifyFailure(f: ValidationFailure): "hard" | "soft" {
  const reason = f.reason.toLowerCase();
  if (
    reason.includes("contradicts signal") ||
    reason.includes("hallucinated competitor") ||
    reason.includes("missing or empty") ||
    reason.includes("missing section label") ||
    reason.includes("unexpected section label") ||
    reason.includes("must be non-empty array") ||
    reason.includes("must have at least 3 items") ||
    reason.includes("expected 8 sections") ||
    reason.includes("out of range") ||
    reason.includes("missing or not a number") ||
    reason.includes("not valid json") ||
    reason.includes("not an object")
  ) {
    return "hard";
  }
  return "soft";
}

function tagFailures(issues: ValidationFailure[]): ValidationFailure[] {
  return issues.map((i) => ({ ...i, severity: classifyFailure(i) }));
}

// A flat list of every check we ran, marked pass or fail with a reason.
// Used by the /audit-test harness so a human can see exactly what gated.
function buildValidationReport(issues: ValidationFailure[]) {
  const tagged = tagFailures(issues);
  const hard = tagged.filter((i) => i.severity === "hard");
  const soft = tagged.filter((i) => i.severity === "soft");
  return {
    pass: hard.length === 0,
    hard_failures: hard,
    soft_warnings: soft,
    all_failures: tagged,
    summary: {
      hard_count: hard.length,
      soft_count: soft.length,
    },
  };
}

function validate(report: any, payload: any): ValidationFailure[] {
  const issues: ValidationFailure[] = [];

  if (!report || typeof report !== "object") {
    return [{ section: "report", field: "root", reason: "report is not an object" }];
  }

  const sections = Array.isArray(report.sections) ? report.sections : [];
  if (sections.length !== 8) {
    addFailure(issues, "report", "sections", `expected 8 sections, got ${sections.length}`);
  }

  const labels = sections.map((s: any) => s?.label);
  for (const req of REQUIRED_LABELS) {
    if (!labels.includes(req)) addFailure(issues, req, "label", "missing section label");
  }
  for (const l of labels) {
    if (!REQUIRED_LABELS.includes(l)) addFailure(issues, String(l ?? "(unknown)"), "label", "unexpected section label");
  }

  if (!report.verdict || typeof report.verdict !== "string" || !report.verdict.trim()) {
    addFailure(issues, "report", "verdict", "missing or empty");
  }
  if (!report.competitive_read || typeof report.competitive_read !== "string" || !report.competitive_read.trim()) {
    addFailure(issues, "report", "competitive_read", "missing or empty");
  }
  const fixes = Array.isArray(report.priority_fixes) ? report.priority_fixes : [];
  if (fixes.length < 3) addFailure(issues, "report", "priority_fixes", "must have at least 3 items");

  const inputCompetitors: string[] = Array.isArray(payload?.inputs?.competitors)
    ? payload.inputs.competitors.filter((c: any) => typeof c === "string").map((c: string) => c.toLowerCase())
    : [];

  for (const s of sections) {
    const label = s?.label ?? "(unknown)";
    for (const field of ["whats_working", "whats_holding_back", "fix_first", "agent"]) {
      if (!s?.[field] || typeof s[field] !== "string" || !s[field].trim()) {
        addFailure(issues, label, field, "missing or empty");
      }
    }
    if (!Array.isArray(s?.evidence) || s.evidence.length === 0) {
      addFailure(issues, label, "evidence", "must be non-empty array");
    }

    // competitor domain check on competitor_framing
    const cf: string = typeof s?.competitor_framing === "string" ? s.competitor_framing : "";
    for (const d of extractDomains(cf)) {
      if (!inputCompetitors.includes(d)) {
        addFailure(issues, label, "competitor_framing", `hallucinated competitor "${d}"`);
      }
    }

    // specificity lint
    const ww: string = typeof s?.whats_working === "string" ? s.whats_working : "";
    const whb: string = typeof s?.whats_holding_back === "string" ? s.whats_holding_back : "";
    for (const field of ["whats_working", "whats_holding_back"] as const) {
      const value = field === "whats_working" ? ww : whb;
      const lower = value.toLowerCase();
      for (const phrase of BANNED_GENERIC) {
        if (lower.includes(phrase)) {
          addFailure(issues, label, field, `banned generic phrase "${phrase}"`);
        }
      }
      if (value && !hasSpecificToken(value, inputCompetitors)) {
        addFailure(issues, label, field, "lacks a specific token or named absence");
      }
    }

    // score and tier match
    if (typeof s?.score === "number") {
      const expected = tierForScore(s.score);
      if (!expected) addFailure(issues, label, "score", "out of range");
      else if (s?.tier !== expected) {
        addFailure(issues, label, "tier", `"${s?.tier}" does not match score ${s.score} (expected ${expected})`);
      }
    } else {
      addFailure(issues, label, "score", "missing or not a number");
    }

    for (const field of ["whats_working", "whats_holding_back", "evidence", "competitor_framing", "fix_first"] as const) {
      checkVoiceLint(issues, label, field, s?.[field]);
    }
  }

  // competitive_read domain check
  for (const d of extractDomains(report.competitive_read ?? "")) {
    if (!inputCompetitors.includes(d)) {
      addFailure(issues, "report", "competitive_read", `hallucinated competitor "${d}"`);
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
        addFailure(issues, s.label, "copy", "contradicts signal: blog_present true but text claims no blog");
      }
      if (blogPresent === false && /active blog/.test(allText)) {
        addFailure(issues, s.label, "copy", "contradicts signal: blog_present false but text praises active blog");
      }
    }
    if (s?.label === "The Face of the Brand") {
      if (namedFounder === true && allText.includes("no founder")) {
        addFailure(issues, s.label, "copy", "contradicts signal: named_founder_on_site true but text claims no founder");
      }
      if (namedFounder === false && payload?.model_type === "founder_led" && /founder is visible/.test(allText)) {
        addFailure(issues, s.label, "copy", "contradicts signal: named_founder_on_site false but text claims founder is visible");
      }
    }
  }

  // voice lint with repairable field names
  for (const field of ["verdict", "what_we_found", "competitive_read", "priority_fixes", "handoff_cta"] as const) {
    checkVoiceLint(issues, "report", field, report?.[field]);
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

function buildValidationRepairNote(issues: string[], source = "previous output") {
  const complaint = issues.length > 0
    ? issues.map((issue) => `- ${issue}`).join("\n")
    : "- Unknown validation issue";

  return `VALIDATION REPAIR
The ${source} failed validation for this exact complaint:
${complaint}

Correct those exact issues. Do not blindly rewrite around them. Every section must use the exact section skeleton and must include a non-empty whats_working string. If the complaint names a missing whats_working field, fill that specific section with the nearest true strength or raw material from the evidence, even when the section is weak. Never omit, blank, null, or rename whats_working. Stay evidence-bound and specific. Return corrected JSON only.`;
}

const VERA_TIMEOUT_MS = 120_000;

async function callAnthropic(req: Request, payload: any, extraSystem?: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const system = extraSystem ? `${SYSTEM_PROMPT}\n\n${extraSystem}` : SYSTEM_PROMPT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERA_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 24000,
        temperature: 0.3,
        stream: true,
        system,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === "AbortError") {
      const err: any = new Error(`Anthropic call timed out after ${VERA_TIMEOUT_MS}ms`);
      err.status = 504;
      throw err;
    }
    throw e;
  }

  if (!res.ok || !res.body) {
    clearTimeout(timer);
    const errText = await res.text().catch(() => "");
    notifyAdminCritical(req, { functionName: "generate-audit", status: res.status, detail: errText });
    const err: any = new Error(`Anthropic error ${res.status}: ${errText}`);
    err.status = res.status;
    throw err;
  }

  // Parse SSE stream and accumulate text deltas.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            text += evt.delta.text ?? "";
          }
        } catch { /* ignore partial */ }
      }
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      const err: any = new Error(`Anthropic stream timed out after ${VERA_TIMEOUT_MS}ms`);
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
  return text;
}

function buildSurgicalRepairNote() {
  return `SURGICAL REPAIR MODE
Ignore the main OUTPUT instruction for this repair call. You are not regenerating the report.
You receive the current report, validation failures, and evidence signals.
Return only a JSON array of corrections using this exact shape:
[
  { "section": "Positioning & Differentiation", "field": "whats_working", "new_value": "Corrected value" }
]

Rules:
- Only return corrected fields for the named failures.
- Do not return passing sections or passing fields.
- Do not rewrite the whole report.
- Keep every correction evidence-bound to the provided signals and current report.
- Every whats_working and whats_holding_back correction must include a specific token.
- A specific token can be a quoted phrase from the site, a named page, claim, element, or a named missing element.
- For absences, name the concrete missing element, for example "No mission or values statement appears anywhere on the site."
- If a failure uses field "copy", return corrections for the exact report fields that contain the copy problem.
- Return valid JSON only. No markdown.`;
}

function parseRepairs(text: string): FieldRepair[] {
  const parsed = parseModel(text);
  const repairs = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.repairs) ? parsed.repairs : [];
  return repairs.filter((r: any) =>
    r && typeof r.section === "string" && typeof r.field === "string" && "new_value" in r
  );
}

function mergeRepairs(report: any, repairs: FieldRepair[]) {
  const next = structuredClone(report);
  const allowedSectionFields = new Set([
    "score", "tier", "whats_working", "whats_holding_back", "evidence", "competitor_framing", "fix_first", "agent",
  ]);
  const allowedReportFields = new Set(["verdict", "model_type", "what_we_found", "competitive_read", "priority_fixes", "handoff_cta"]);

  for (const repair of repairs) {
    if (repair.section === "report") {
      if (allowedReportFields.has(repair.field)) next[repair.field] = repair.new_value;
      continue;
    }

    const section = Array.isArray(next.sections)
      ? next.sections.find((s: any) => s?.label === repair.section)
      : null;
    if (section && allowedSectionFields.has(repair.field)) {
      section[repair.field] = repair.new_value;
    }
  }
  return next;
}

async function repairReport(req: Request, report: any, failures: ValidationFailure[], payload: any) {
  const repairPayload = {
    current_report: report,
    validation_failures: failures,
    signals: payload?.signals ?? {},
    inputs: payload?.inputs ?? {},
    model_type: payload?.model_type ?? null,
    low_data: payload?.low_data ?? false,
  };
  const text = await callAnthropic(req, repairPayload, buildSurgicalRepairNote());
  const repairs = parseRepairs(text);
  if (repairs.length === 0) return report;
  return mergeRepairs(report, repairs);
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
    const previousValidationError = typeof body?.previous_validation_error === "string"
      ? body.previous_validation_error.trim()
      : "";

    let report: any;
    let issues: ValidationFailure[] = [];

    if (debugForce !== undefined) {
      report = debugForce;
      issues = validate(report, payload);
    } else if (body?.existing_report && typeof body.existing_report === "object" && !Array.isArray(body.existing_report)) {
      report = body.existing_report;
      issues = validate(report, payload);
    } else {
      const text1 = await callAnthropic(
        req,
        payload,
        previousValidationError ? buildValidationRepairNote([previousValidationError], "previous generation") : undefined,
      );
      report = parseModel(text1);
      if (!report) {
        issues = [{ section: "report", field: "root", reason: "model output was not valid JSON" }];
      } else {
        issues = validate(report, payload);
      }
    }

    if (report && issues.length > 0) {
      for (let attempt = 1; attempt <= 3 && issues.length > 0; attempt += 1) {
        report = await repairReport(req, report, issues, payload);
        issues = validate(report, payload);
      }
    }

    if (issues.length > 0) {
      return new Response(
        JSON.stringify({ status: "review", issues, issue_messages: formatFailures(issues), report }),
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