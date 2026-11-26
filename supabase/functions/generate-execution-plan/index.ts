const corsHeaders = {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  "Access-Control-Allow-Origin": "*",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
const SYSTEM = `You are MOXIEMO's execution-plan synthesizer. You will be given the user's marketing strategy foundation (positioning, audience, voice, channel, capacity, content pillars, brand archetype, goals).
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Generate a complete EXECUTION PLAN that includes:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
1. Quarterly content themes (3 quarters, 12 weekly topics each, derived from the user's content pillars)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
2. A 30-day rolling content calendar (use today's date as the start date; respect posting frequency)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
3. A multi-channel strategy. channelStrategy.primary, .secondary, and .tertiary MUST each be a structured OBJECT (never a plain string) containing: platform (just the channel name like "LinkedIn"), rationale (3-5 short bullet strings), contentStrategy {frequency, types[], tone}, postingSchedule[] {day, time, type, example}, successMetrics {engagementRate, profileViews, connectionRequests, discoveryCallInquiries}, timeAllocation {total, breakdown {contentCreation, engagement, dmConversations}}.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
4. Success metrics dashboard (parse the user's success metric into weekly/monthly targets, project lead source breakdown, content performance targets, brand health initial state)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
5. A 4-week quick-start action plan (Foundation → Launch → Engagement → Optimization, 4-5 tasks each with realistic estimated times) plus an ongoing weekly routine
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Be SPECIFIC and grounded in the foundation. Reference the user's actual ideal client, pillars, archetype, channel — never generic placeholders. Topic angles must progress logically (awareness → understanding → application). Tasks should reference the user's primary channel and positioning.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
SUCCESS METRICS COMPLETENESS — ALL SUBSECTIONS REQUIRED:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
successMetrics MUST include, all populated, all grounded in THIS founder's foundation (never sample copy, never blank):
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- primary.name, primary.target (weekly + monthly for recurring; or a single sell string for launches), primary.leadSources (3-5 items with source + percentage), primary.qualification.highFit / .mediumFit / .lowFit (each with percentage + definition).
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- contentPerformance.linkedin (engagementTarget, profileViewsTarget, postsPerWeek) AND contentPerformance.email (openRateTarget, clickRateTarget, sendsPerMonth). Include BOTH channels' targets even if email is secondary; use realistic starter values, never leave empty.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- businessGoals.revenueGrowth AND businessGoals.scalingPlan — one sentence each, specific to this founder's stated goals.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- businessGoals.scalingPlan and businessGoals.revenueGrowth prose MUST be relative and date-free. Never use calendar quarter labels ("Q1 2027", "Q4 2026") or bare month/year references for future periods. Phrase post-launch moves as relative ("After a successful launch, ...", "Once the first cohort closes, ...").
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- brandHealth.voiceConsistencyScore, brandHealth.archetypeAlignment, brandHealth.notes (short baseline note).
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
ACTION PLAN FORMAT — STRICT:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Each of week1, week2, week3, week4 MUST be a structured OBJECT with:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  - "title": a short 2-6 word thematic phrase specific to this founder's strategy (e.g. "Foundation & Strategy Lock-in", "Launch & Initial Engagement", "Building Momentum & Conversations", "Analysis & Optimization"). Do NOT prefix with "Week N", "Task:", or any date range. Do NOT include time estimates like "(Est. 10 hours)" in the title. Time estimates belong on individual task lines.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  - "tasks": an array of task objects.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Never return a week as a plain string, markdown block, or without a title.`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
const SYSTEM_LAUNCH = `You are MOXIEMO's execution-plan synthesizer for a FOUNDER LAUNCHING ONE SPECIFIC OFFER by a HARD TARGET DATE. The plan is a LAUNCH SPRINT, not an evergreen content program.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
The target date is the hard guard for the whole plan. You will be told today's date and the target date. Compute the window in weeks and shape everything to land the sell target ON OR BEFORE the target date.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Generate a complete EXECUTION PLAN that includes:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
1. quarterlyThemes: use this field to hold LAUNCH PHASES, not calendar quarters. For a roughly 12 week window, produce three phases in this order:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   - Awareness (open the launch, name the problem, seed the offer)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   - Resonance (proof, objections, transformation stories)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   - Invitation and Enrollment (open cart, direct invitations, close on the target date)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   A short optional Post Launch tail phase after the target date is allowed as a fourth entry, but the sprint to the target date is the spine. For very short windows (under 6 weeks) collapse to two phases. For longer windows (over 16 weeks) add a Nurture phase before Invitation. The "quarter" field on each phase MUST be a human phase label with its date range, for example "Awareness (Jul 1 to Jul 28)", NEVER "Q1 2027" or any calendar quarter tag.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   Each phase has weekly contentTopics sized to that phase, not a fixed 12.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
   The FINAL phase before or at the target date MUST have its successMetric equal the founder's sell target verbatim ("Sell N unit by Month D, YYYY"). Do NOT file the sell milestone in any phase whose window begins after the target date.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
2. contentCalendar: 30 days from today, using the real primary and supporting channels, driving toward the enrollment push, not evergreen education. Weight later days toward invitation and enrollment as the target date approaches.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
3. channelStrategy: same object shape as normal (primary, secondary, tertiary), tuned for this launch.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
4. successMetrics: primary.name and primary.target should reflect the single sell target (one number, one date). Never emit MRR, "per month", or "New Clients / Month" figures. This is a one time launch.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
5. actionPlan: 4 week quick start; week titles reflect launch phases (e.g. "Open the Launch", "Prove the Transformation", "Invite the Warm List", "Close and Enroll").
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
HARD RULES:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Never file the sell target in a phase or period that begins after the target date.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Never use calendar quarter labels ("Q1 2027", "Q4 2026"). Use phase labels with date ranges.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Never derive or emit a monthly recurring revenue figure anywhere.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Never use em-dashes. Never use contractions.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
SUCCESS METRICS COMPLETENESS — ALL SUBSECTIONS REQUIRED:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
successMetrics MUST include, all populated, all grounded in THIS founder's launch (never sample copy, never blank):
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- primary.name (short label like "Enrollments sold"), primary.target.total = the founder's sell target string verbatim ("Sell N unit by Month D, YYYY"). Do NOT emit weekly/monthly recurring targets; if you set primary.target.weekly or .monthly at all, they must describe a launch-week pacing count (e.g. "3 seats sold this week"), never MRR.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- primary.leadSources (3-5 items sized to the launch: warm list, referral partners, LinkedIn inbound, etc.), primary.qualification.highFit / .mediumFit / .lowFit (percentage + definition matched to who buys THIS offer).
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- contentPerformance.linkedin AND contentPerformance.email — realistic starter targets for the launch window, both channels.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- businessGoals.revenueGrowth = one sentence about the launch revenue (one-time, not MRR); businessGoals.scalingPlan = the next move after this launch closes.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- businessGoals.scalingPlan MUST be relative and date-free. Never use calendar quarter labels ("Q1 2027") or "next quarter" phrasing. Reference the move as relative to launch close ("After a successful launch, plan the next retreat and add a graduate-level offer for continued support.").
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- brandHealth.voiceConsistencyScore, brandHealth.archetypeAlignment, brandHealth.notes.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
ACTION PLAN FORMAT — STRICT:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Each of week1, week2, week3, week4 MUST be a structured OBJECT with:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  - "title": short 2-6 word phase-aligned phrase.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  - "tasks": array of task objects.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Never return a week as a plain string.`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
function todayISO() { return new Date().toISOString().slice(0, 10); }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// Coerce actionPlan into a strict object shape.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// - If any weekN arrived as a JSON-encoded string (observed from the model on
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
//   launch prompts), JSON.parse it (handles single- and double-encoding).
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// - Remap alternate task keys ("text", "content") to "task".
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// - Ensure every task has a stable id.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// This runs BEFORE completeness checks so a well-formed-but-stringified plan
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
// does not trigger unnecessary retries.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
function coerceActionPlan(ap: any): any {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (!ap || typeof ap !== "object") return ap;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  for (const n of [1, 2, 3, 4]) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const key = `week${n}`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let w: any = ap[key];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (typeof w === "string") {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const raw = w.trim();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      try {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        let p: any = JSON.parse(raw);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (typeof p === "string") { try { p = JSON.parse(p); } catch { /* keep */ } }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        w = p;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        console.log(`execution-plan: coerced ${key} from JSON string`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      } catch (e) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        console.warn(`execution-plan: could not JSON.parse ${key} string:`, String(e));
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (w && typeof w === "object") {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      // Unwrap accidental { weekN: {...} } nesting.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (!w.title && !Array.isArray(w?.tasks) && w[key] && typeof w[key] === "object") {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        w = w[key];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (Array.isArray(w.tasks)) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        w.tasks = w.tasks.map((t: any, i: number) => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (t == null) return { id: `week-${n}-task-${i}`, task: "" };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (typeof t === "string") return { id: `week-${n}-task-${i}`, task: t };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (typeof t !== "object") return { id: `week-${n}-task-${i}`, task: String(t) };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const text = t.task ?? t.text ?? t.content ?? t.description ?? "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          return {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            ...t,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            id: t.id != null ? String(t.id) : `week-${n}-task-${i}`,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            task: typeof text === "string" ? text : String(text ?? ""),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            estimatedTime: t.estimatedTime ?? t.est ?? t.estimated ?? undefined,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      ap[key] = w;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  return ap;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
function longFormDate(raw: unknown): string {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const s = String(raw ?? "").trim();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (!s) return "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (iso) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const d = new Date(s);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (!isNaN(d.getTime()) && /\d/.test(s)) return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  return s;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
function extractTargetDate(strategy: any): string | null {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const raw = strategy?.enhanced_foundation?.successTarget || strategy?.success_definition || "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const iso = String(raw).match(/(\d{4})-(\d{2})-(\d{2})/);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  // Long form "September 30, 2026"
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  const long = String(raw).match(/([A-Za-z]+ \d{1,2},? \d{4})/);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (long) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const d = new Date(long[1]);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  return null;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Deno.serve(async (req) => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
  const tStart = Date.now();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  let requestId = "unknown";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  let strategyId = "unknown";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  try {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const body = await req.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const { strategy } = body || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    requestId = typeof body?.requestId === "string" && body.requestId.trim() ? body.requestId.trim() : requestId;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    strategyId = typeof strategy?.id === "string" && strategy.id.trim() ? strategy.id.trim() : strategyId;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const ef = strategy?.enhanced_foundation || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const archetypeName = ef.brandArchetype?.name || "—";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const pillars = (strategy?.content_pillars || []).map((p: any) => typeof p === "string" ? p : (p?.name || "")).filter(Boolean);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const isLaunch = strategy?.strategy_lane === "offer_gtm";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const today = todayISO();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const targetDateIso = isLaunch ? extractTargetDate(strategy) : null;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.log("execution-plan: request start", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      requestId,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      strategyId,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      isLaunch,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      hasExistingActionPlan: !!strategy?.enhanced_foundation?.actionPlan,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      hasExistingMetrics: !!strategy?.enhanced_foundation?.successMetrics,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let launchContext = "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (isLaunch) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const targetLong = targetDateIso ? longFormDate(targetDateIso) : "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      let weeks = 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (targetDateIso) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const ms = new Date(targetDateIso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        weeks = Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)));
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      launchContext = `\n\nLAUNCH CONTEXT (HARD GUARD):
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Today: ${today}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Target date: ${targetDateIso || "(unknown, treat successTarget string as canonical)"}${targetLong ? ` (${targetLong})` : ""}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Window: ${weeks || "unknown"} weeks from today to the target date
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- Sell target (verbatim): ${ef.successTarget || strategy?.success_definition || "(missing)"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
- The final launch phase MUST close on or before the target date and its successMetric MUST equal the sell target above verbatim. Never file the sell milestone in any period beginning after the target date. Never use calendar quarter labels.`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const userBrief = `STRATEGY FOUNDATION
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Positioning: ${strategy?.positioning_statement || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Ideal client: ${strategy?.ideal_client || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Pain point: ${strategy?.pain_point || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Transformation: ${strategy?.transformation || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Voice attributes: ${(strategy?.voice_attributes || []).join(", ") || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Brand archetype: ${archetypeName}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Content pillars: ${pillars.join(" | ") || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Primary channel: ${strategy?.primary_channel || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Posting frequency: ${strategy?.posting_frequency || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Time capacity: ${strategy?.time_capacity || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Success metric: ${strategy?.success_definition || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Business goal: ${strategy?.business_goal || "—"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Today's date: ${today}${launchContext}`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const tFirst = Date.now();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.log("execution-plan: gateway first-pass dispatch", { requestId, strategyId, isLaunch });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      method: "POST",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      body: JSON.stringify({
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        model: "google/gemini-2.5-pro",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        messages: [
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          { role: "system", content: isLaunch ? SYSTEM_LAUNCH : SYSTEM },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          { role: "user", content: userBrief },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        ],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        tools: [{
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          type: "function",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          function: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            name: "save_execution_plan",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            description: "Save the synthesized execution plan: quarterly themes, content calendar, channel strategy, success metrics, action plan.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            parameters: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                quarterlyThemes: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  description: "Exactly 3 quarterly themes, one per content pillar (cycle if fewer pillars).",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      quarter: { type: "string", description: "e.g. Q2 2026" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      theme: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      overview: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      strategicRationale: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      contentTopics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        description: "Exactly 12 weekly topics, progressing awareness → understanding → application.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            week: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            topic: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            angle: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            contentType: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            keyMessage: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          required: ["week", "topic", "angle", "contentType", "keyMessage"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      contentMix: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          linkedin: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          email: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          podcast: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      successMetric: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      cta: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    required: ["quarter", "theme", "overview", "strategicRationale", "contentTopics", "successMetric"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                contentCalendar: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  description: "30 days of scheduled content from today, respecting posting frequency.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      date: { type: "string", description: "YYYY-MM-DD" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      day: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      platform: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      contentType: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      topic: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      theme: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      week: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      status: { type: "string", description: "draft_ready or needs_generation" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      estimatedLength: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    required: ["date", "day", "platform", "contentType", "topic", "week", "status"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                channelStrategy: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  description: "Each of primary/secondary/tertiary MUST be a rich object (not a string) with platform, rationale (3-5 bullets), contentStrategy, postingSchedule, successMetrics, timeAllocation.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    primary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        platform: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        rationale: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        contentStrategy: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            frequency: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            types: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            tone: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        postingSchedule: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              day: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              time: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              example: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            required: ["day", "type"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            engagementRate: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            profileViews: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            connectionRequests: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            discoveryCallInquiries: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        timeAllocation: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            total: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            breakdown: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                contentCreation: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                engagement: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                dmConversations: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      required: ["platform", "rationale"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    secondary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        platform: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        rationale: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        contentStrategy: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            frequency: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            types: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            tone: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        postingSchedule: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              day: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              time: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              example: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            required: ["day", "type"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            engagementRate: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            profileViews: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            connectionRequests: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            discoveryCallInquiries: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        timeAllocation: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            total: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            breakdown: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                contentCreation: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                engagement: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                dmConversations: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      required: ["platform", "rationale"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    tertiary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        platform: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        rationale: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        contentStrategy: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            frequency: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            types: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            tone: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        postingSchedule: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              day: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              time: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              example: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            required: ["day", "type"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            engagementRate: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            profileViews: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            connectionRequests: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            discoveryCallInquiries: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        timeAllocation: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            total: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            breakdown: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                contentCreation: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                engagement: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                dmConversations: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      required: ["platform", "rationale"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    totalTimeWithMOXIE: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        before: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        after: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        freed: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        useFreedTimeFor: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  required: ["primary"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    primary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        name: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        target: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: { weekly: { type: "string" }, monthly: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        leadSources: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              source: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              percentage: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              perWeek: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            required: ["source", "percentage"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        qualification: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            highFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            mediumFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            lowFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      required: ["name", "target"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    contentPerformance: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        linkedin: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: { engagementTarget: { type: "string" }, profileViewsTarget: { type: "string" }, postsPerWeek: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        email: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: { openRateTarget: { type: "string" }, clickRateTarget: { type: "string" }, sendsPerMonth: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    businessGoals: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        revenueGrowth: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        scalingPlan: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    brandHealth: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        voiceConsistencyScore: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        archetypeAlignment: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        notes: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  required: ["primary"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                actionPlan: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    week1: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    week2: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    week3: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    week4: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    ongoingRoutine: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        daily: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        weekly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        biweekly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        monthly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        totalTimePerWeek: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        comparison: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  required: ["week1", "week2", "week3", "week4"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              required: ["quarterlyThemes", "contentCalendar", "channelStrategy", "successMetrics", "actionPlan"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              $defs: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                channel: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    platform: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    rationale: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    contentStrategy: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        frequency: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        types: { type: "array", items: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        tone: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    postingSchedule: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          day: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          time: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          example: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        required: ["day", "type"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        engagementRate: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        profileViews: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        connectionRequests: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        discoveryCallInquiries: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    timeAllocation: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        total: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        breakdown: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            contentCreation: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            engagement: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            dmConversations: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  required: ["platform", "rationale"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                week: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    title: { type: "string", description: "REQUIRED. 2-6 word thematic phrase (e.g. 'Foundation & Strategy Lock-in'). No 'Week N' prefix, no date range, no '(Est. …)' annotation." },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    tasks: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          id: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          task: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          estimatedTime: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          linkedContent: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        required: ["id", "task", "estimatedTime"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  required: ["title", "tasks"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        tool_choice: { type: "function", function: { name: "save_execution_plan" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!res.ok) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const t = await res.text();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.error("execution-plan error", { requestId, strategyId, status: res.status, body: t });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached, try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const data = await res.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let parsed = args ? JSON.parse(args) : {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const firstPassMs = Date.now() - tFirst;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.log(`execution-plan: first-pass ${firstPassMs}ms (isLaunch=${isLaunch})`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // Coerce action plan BEFORE completeness checks so stringified weeks and
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // "text"-keyed tasks do not trigger a false-positive retry.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    try {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      parsed.actionPlan = coerceActionPlan(parsed?.actionPlan);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    } catch (e) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.error("execution-plan: coerceActionPlan threw", String(e));
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // Validate action plan week titles. If any are missing/empty, retry once
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // with a reinforced reminder targeting only the action plan.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const missingTitles = (ap: any): number[] => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const bad: number[] = [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      for (const n of [1, 2, 3, 4]) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const w = ap?.[`week${n}`];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const t = w && typeof w === "object" ? w.title : null;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (!t || typeof t !== "string" || !t.trim()) bad.push(n);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return bad;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // Trigger action plan retry when either titles are missing OR any week has
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // no non-empty tasks. Previously we only retried on missing titles, so a
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // response with titles but empty tasks (observed on the launch prompt) fell
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // through and produced an empty Action Plan tab.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const missingTasks = (ap: any): number[] => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const bad: number[] = [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      for (const n of [1, 2, 3, 4]) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const w = ap?.[`week${n}`];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const tasks = Array.isArray(w?.tasks) ? w.tasks : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const hasReal = tasks.some((t: any) => t && typeof t.task === "string" && t.task.trim().length > 0);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (!hasReal) bad.push(n);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return bad;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const badTitles = missingTitles(parsed?.actionPlan);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const badTasks = missingTasks(parsed?.actionPlan);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let bad = Array.from(new Set([...badTitles, ...badTasks])).sort();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (bad.length > 0) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const apPreview = (() => { try { return JSON.stringify(parsed?.actionPlan ?? null).slice(0, 500); } catch { return "(unstringifiable)"; } })();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.error("execution-plan: missing week titles/tasks", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        requestId,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        strategyId,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        weeks: bad,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        badTitles,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        badTasks,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        preview: apPreview,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      // Targeted retry: regenerate only the action plan section.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const tApRetry = Date.now();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const retryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        method: "POST",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        body: JSON.stringify({
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          model: "google/gemini-2.5-pro",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          messages: [
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "system", content: isLaunch ? SYSTEM_LAUNCH : SYSTEM },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "user", content: userBrief },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "user", content: `RETRY: your previous actionPlan response was incomplete for week(s) ${bad.join(", ")} (missing title or empty/missing tasks). Regenerate ONLY the actionPlan. Every week MUST have a short 2-6 word thematic title AND a "tasks" array of 4-6 items where EACH task has non-empty "id", "task" (the full task sentence, specific to THIS founder's strategy), and "estimatedTime". Do NOT return weeks as strings and do NOT return empty task objects.` },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          ],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          tools: [{
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            type: "function",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            function: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              name: "save_action_plan",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              description: "Save only the action plan (4 weeks + ongoing routine).",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              parameters: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  actionPlan: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      week1: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      week2: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      week3: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      week4: { $ref: "#/$defs/week" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    required: ["week1", "week2", "week3", "week4"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                required: ["actionPlan"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                $defs: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  week: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      title: { type: "string", description: "REQUIRED. 2-6 word thematic phrase. No 'Week N' prefix." },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      tasks: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            id: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            task: { type: "string", description: "REQUIRED. The full task sentence, non-empty." },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            estimatedTime: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            linkedContent: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          required: ["id", "task", "estimatedTime"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    required: ["title", "tasks"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          }],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          tool_choice: { type: "function", function: { name: "save_action_plan" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (retryRes.ok) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rd = await retryRes.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rArgs = rd.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rParsed = rArgs ? JSON.parse(rArgs) : {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        // Coerce retry payload too — same model, same failure mode possible.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        try { rParsed.actionPlan = coerceActionPlan(rParsed?.actionPlan); } catch { /* ignore */ }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (rParsed?.actionPlan) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          // Merge per-week: only overwrite fields that improve the original.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          // Never drop real tasks in favor of empty/missing ones from the retry.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const merged: any = { ...(parsed.actionPlan || {}) };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const taskHasText = (t: any) => t && typeof t.task === "string" && t.task.trim().length > 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          for (const n of [1, 2, 3, 4]) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const key = `week${n}`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const orig = merged[key];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const next = rParsed.actionPlan[key];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            if (!next || typeof next !== "object") continue;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const origTasks = Array.isArray(orig?.tasks) ? orig.tasks.filter(taskHasText) : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const nextTasks = Array.isArray(next?.tasks) ? next.tasks.filter(taskHasText) : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const chosenTasks = nextTasks.length >= origTasks.length ? nextTasks : origTasks;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            const chosenTitle = (typeof next.title === "string" && next.title.trim())
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              ? next.title.trim()
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              : (typeof orig?.title === "string" ? orig.title : "");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            merged[key] = { ...(orig || {}), ...next, title: chosenTitle, tasks: chosenTasks };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          parsed.actionPlan = merged;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const stillBad = missingTitles(parsed.actionPlan);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (stillBad.length > 0) console.error("execution-plan: retry still missing titles", { requestId, strategyId, stillBad });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      } else {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        console.error("execution-plan: retry failed", { requestId, strategyId, status: retryRes.status, body: await retryRes.text() });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.log(`execution-plan: actionPlan retry ${Date.now() - tApRetry}ms`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    } else {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.log("execution-plan: actionPlan first-pass complete, no retry");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // Final safety net: strip any tasks with empty text so the UI never renders
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // blank rows, and log if a week has zero valid tasks after all retries.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (parsed?.actionPlan) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      for (const n of [1, 2, 3, 4]) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const key = `week${n}`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const w = parsed.actionPlan[key];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (w && Array.isArray(w.tasks)) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const cleaned = w.tasks.filter((t: any) => t && typeof t.task === "string" && t.task.trim().length > 0);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (cleaned.length !== w.tasks.length) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            console.warn(`execution-plan: dropped ${w.tasks.length - cleaned.length} empty tasks from ${key}`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          w.tasks = cleaned;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (cleaned.length === 0) console.error(`execution-plan: ${key} has zero tasks after synthesis`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // ================================================================
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // SUCCESS METRICS COMPLETENESS — retry any empty required subsection.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // The UI has six required blocks; a partial response would render
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // headers with no body. We retry once and merge per-subsection,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // never overwriting a populated section with an empty one.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // ================================================================
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const smMissing = (sm: any): string[] => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const miss: string[] = [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const p = sm?.primary || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (!p.name || !p.target) miss.push("primary");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (!Array.isArray(p.leadSources) || p.leadSources.length === 0) miss.push("leadSources");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const q = p.qualification || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (!q.highFit?.percentage && !q.mediumFit?.percentage && !q.lowFit?.percentage) miss.push("qualification");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const cp = sm?.contentPerformance || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const cpLi = cp.linkedin || {}, cpEm = cp.email || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const cpEmpty = !cpLi.engagementTarget && !cpLi.profileViewsTarget && !cpLi.postsPerWeek
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                   && !cpEm.openRateTarget && !cpEm.clickRateTarget && !cpEm.sendsPerMonth;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (cpEmpty) miss.push("contentPerformance");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const bg = sm?.businessGoals || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (!bg.revenueGrowth && !bg.scalingPlan) miss.push("businessGoals");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const bh = sm?.brandHealth || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (bh.voiceConsistencyScore == null && bh.archetypeAlignment == null && !bh.notes) miss.push("brandHealth");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return miss;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let smMiss = smMissing(parsed?.successMetrics);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (smMiss.length > 0) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.error("execution-plan: missing successMetrics subsections", { requestId, strategyId, missing: smMiss });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const tSmRetry = Date.now();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const smRetry = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        method: "POST",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        body: JSON.stringify({
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          model: "google/gemini-2.5-pro",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          messages: [
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "system", content: isLaunch ? SYSTEM_LAUNCH : SYSTEM },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "user", content: userBrief },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            { role: "user", content: `RETRY: your previous successMetrics response was missing or empty for: ${smMiss.join(", ")}. Regenerate ONLY the successMetrics object with ALL of these subsections populated: primary (name, target, leadSources with 3-5 items, qualification.highFit/.mediumFit/.lowFit each with percentage AND definition), contentPerformance.linkedin AND contentPerformance.email (all target fields), businessGoals.revenueGrowth AND businessGoals.scalingPlan, brandHealth.voiceConsistencyScore + archetypeAlignment + notes. Ground every value in THIS founder's foundation. Do NOT return empty objects.` },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          ],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          tools: [{
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            type: "function",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            function: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              name: "save_success_metrics",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              description: "Save the successMetrics object only. Every subsection listed as missing MUST be populated with values grounded in the founder's foundation.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              parameters: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  successMetrics: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      primary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          name: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          target: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              weekly: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              monthly: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              total: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          leadSources: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "array",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            description: "3-5 items grounded in this founder's channels.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            items: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                source: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                percentage: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                perWeek: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              required: ["source", "percentage"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          qualification: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            description: "REQUIRED. All three tiers, each with percentage and definition specific to who buys THIS offer.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              highFit: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                properties: { percentage: { type: "number" }, definition: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                required: ["percentage", "definition"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              mediumFit: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                properties: { percentage: { type: "number" }, definition: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                required: ["percentage", "definition"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              lowFit: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                properties: { percentage: { type: "number" }, definition: { type: "string" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                                required: ["percentage", "definition"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            required: ["highFit", "mediumFit", "lowFit"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      contentPerformance: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          linkedin: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              engagementTarget: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              profileViewsTarget: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              postsPerWeek: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          email: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              openRateTarget: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              clickRateTarget: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                              sendsPerMonth: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      businessGoals: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        description: "REQUIRED. Both fields, one sentence each, specific to this founder.",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          revenueGrowth: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          scalingPlan: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        required: ["revenueGrowth", "scalingPlan"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      brandHealth: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        type: "object",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        properties: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          voiceConsistencyScore: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          archetypeAlignment: { type: "number" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                          notes: { type: "string" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                        },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                    required: ["primary", "contentPerformance", "businessGoals", "brandHealth"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                  },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
                required: ["successMetrics"],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          }],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          tool_choice: { type: "function", function: { name: "save_success_metrics" } },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      if (smRetry.ok) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rd = await smRetry.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rArgs = rd.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const rParsed = rArgs ? JSON.parse(rArgs) : {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        const nextSm = rParsed?.successMetrics;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        if (nextSm && typeof nextSm === "object") {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const prev = parsed.successMetrics || {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const nonEmpty = (v: any) => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            if (v == null) return false;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            if (typeof v === "string") return v.trim().length > 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            if (Array.isArray(v)) return v.length > 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            if (typeof v === "object") return Object.keys(v).length > 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            return true;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          const pickBetter = (a: any, b: any) => (nonEmpty(b) ? b : a);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          parsed.successMetrics = {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            primary: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              ...(prev.primary || {}),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              ...(nextSm.primary || {}),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              name: pickBetter(prev.primary?.name, nextSm.primary?.name),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              target: pickBetter(prev.primary?.target, nextSm.primary?.target),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              leadSources: pickBetter(prev.primary?.leadSources, nextSm.primary?.leadSources),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
              qualification: pickBetter(prev.primary?.qualification, nextSm.primary?.qualification),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            contentPerformance: pickBetter(prev.contentPerformance, nextSm.contentPerformance),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            businessGoals: pickBetter(prev.businessGoals, nextSm.businessGoals),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
            brandHealth: pickBetter(prev.brandHealth, nextSm.brandHealth),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          smMiss = smMissing(parsed.successMetrics);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
          if (smMiss.length > 0) console.error("execution-plan: successMetrics retry still missing", { requestId, strategyId, missing: smMiss });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      } else {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        console.error("execution-plan: successMetrics retry failed", { requestId, strategyId, status: smRetry.status, body: await smRetry.text() });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.log(`execution-plan: successMetrics retry ${Date.now() - tSmRetry}ms`);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    } else {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.log("execution-plan: successMetrics first-pass complete, no retry");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    // Report completeness so the client can decide to swap or hold.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const actionPlanEmpty = !parsed?.actionPlan || [1,2,3,4].some((n) => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const w = parsed.actionPlan[`week${n}`];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return !w || !Array.isArray(w.tasks) || w.tasks.length === 0;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    (parsed as any)._completeness = {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      successMetricsMissing: smMiss,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      actionPlanEmpty,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    };
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.log(`execution-plan: TOTAL ${Date.now() - tStart}ms`, { requestId, strategyId });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  } catch (e) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.error("execution-plan: fatal", { requestId, strategyId, error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
});import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
