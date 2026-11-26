const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
import { sanitizeDashesDeep } from "../_shared/sanitize-dashes.ts";

const SYSTEM = `You are MOXIEMO's strategy synthesizer. Read a discovery conversation transcript and extract a complete marketing strategy.
You will save BOTH a base strategy AND an expanded "enhanced_foundation" object that deepens the output (Sprint 1: positioning breakdown, brand archetype, core values, competitive positioning, detailed voice guidelines).
Be specific and grounded in the transcript, never generic. Every example, value, and word should feel derived from what the user actually said.
Never use em-dashes. Use commas or periods instead.`;

const SYSTEM_LANE2 = `You are MOXIEMO's strategy synthesizer for a SERVICE-BASED BUSINESS or MARKETPLACE (not a solo expertise practice). Read the discovery transcript and extract a complete marketing strategy for the BUSINESS BRAND — never frame anything around personal thought leadership, founder authority, or solo expertise.

Apply these answer-to-output mappings precisely:
- positioning_statement: derive from Q1 (service description) + Q8 (differentiation) + Q6 (geography). Anchor to the business brand, not personal expertise.
- ideal_client: derive from Q4 (primary customer type) + Q5 (ideal customer description) + Q6 (geography).
- pain_point: derive from Q2 (problem + consequences if unsolved).
- transformation: derive from Q2 + Q7 (what's in the customer's mind when choosing). Frame as the customer outcome the business delivers.
- voice_attributes: derive from Q10 (personality) + Q11 (never-feel). A business-brand voice — approachable, trustworthy, locally rooted where applicable. Avoid "thought leadership" vocabulary.
- anti_positioning: derive from Q11 (never want a customer to feel).
- content_pillars (3-5): derive from Q8 + Q9 (best-customer language) + Q11. Center on TRUST, RELIABILITY, SERVICE QUALITY, CUSTOMER EXPERIENCE. Recommend pillars like testimonials & reviews, before/after content, behind-the-scenes operations, community involvement, seasonal tips, referral/loyalty promotion.
- primary_channel and posting_frequency: derive from Q13 (current acquisition channels and what's working) + Q6 (geography). Prioritize Google Business Profile, local Facebook & Instagram, Nextdoor, referral programs, local partnerships. Double down on what Q13 says is already working before adding new channels.
- success_definition: derive from Q15 (12-month success + specific number). Include 2-3 tracking metrics tied to that number.
- business_goal: derive from Q15.
- time_capacity: infer reasonably from the transcript; if unstated, leave a sensible default.

enhanced_foundation:
- positioningBreakdown: idealClient (Q4+Q5+Q6), painPoint (Q2), transformation (Q7), uniqueApproach (Q8), method (Q1), outcome (Q15).
- messagingVariations: oneliner, short, elevator — framed around customer problem + business solution (Q2+Q7+Q8). Never use "I help" framing; use the business name or "we".
- brandArchetype: choose an archetype that fits a SERVICE BUSINESS (e.g. caregiver, everyman, hero, ruler) — not a personal-brand archetype like sage if it doesn't fit. whyThisFits and howToApply must reference business operations and customer experience.
- coreValues (3-5): derived from Q8 + Q9 + Q11, with decision filters that an operations team could apply.
- competitivePositioning: yourPosition (Q8), marketGap (Q14+Q8 — the ownable gap competitors miss), differentiators (Q8 vs Q14), competitiveAdvantages (Q8+Q9).
- voiceGuidelines: built from Q10+Q11. toneByPlatform should favor channels relevant to a local/service business (Google Business Profile reviews, Facebook/Instagram, email/SMS) — adapt fields as needed inside the existing schema.
- distribution: REQUIRED for service strategies. doubleDownOn = the existing channel from Q13 that's already working best (be specific, in the user's words). doubleDownRationale = one short sentence on why doubling down beats adding new channels. recommendedChannels = 3-6 entries prioritized for local/service businesses (Google Business Profile, local Facebook & Instagram, Nextdoor, referral programs, local partnerships, email/SMS), each with a one-sentence "why" rooted in Q6 (geography) and Q4 (customer type).

STRATEGIC PRIORITY (use Q12 to weight emphasis throughout the output):
- "Getting found by new customers" → weight acquisition / local discovery / SEO heavily.
- "Building trust before the first sale" → weight social proof, reviews, reputation, case studies heavily.
- "Keeping customers coming back" → weight retention, loyalty, lifecycle marketing heavily.
- "Standing out from competitors" → weight differentiation messaging and competitive positioning heavily.
- "Scaling without losing quality" → weight operational consistency, brand standards, repeatable content systems.

Be specific and grounded in the transcript — never generic. NEVER reference thought leadership, personal expertise, founder authority, or solo practitioner framing. If the transcript is ambiguous, infer a reasonable business-brand interpretation — never refuse to build a strategy.`;

const SYSTEM_LANE3 = `You are MOXIEMO's strategy synthesizer for a FOUNDER LAUNCHING ONE SPECIFIC OFFER. Inputs: the founder's completed offer readiness gate, their structured OFFER INTAKE worksheet (offer, buyer, why you, revenue goal, warm list), and a short sharpening chat transcript.

Your job is to produce a full GO TO MARKET strategy for THIS ONE OFFER, in the SAME enhanced_foundation shape the app already reads. Frame everything around the offer and the launch, not around a general personal brand or thought leadership program.

MAPPINGS (use the intake fields as source of truth, sharpened by the chat):
- positioning_statement: derive from offer_one_line + offer_transformation + diff_why_you. Anchor on THIS offer.
- ideal_client: buyer_who + buyer_trigger. Specific role, stage, moment.
- pain_point: buyer_pain in the buyer's own words.
- transformation: offer_transformation.
- voice_attributes: infer 3 to 5 attributes from the founder's own language in the intake and chat.
- anti_positioning: the framing you must never use, drawn from buyer_tried (what did not work).
- content_pillars: 3 to 5 LAUNCH CONTENT THEMES that will sell this offer between now and the goal date. Each pillar name is a theme, description is a one line explanation.
- primary_channel: the single best channel to concentrate on for this launch (from where the buyer already gathers, warm_list evidence, and founder capacity).
- posting_frequency: a realistic launch cadence that fits the goal date.
- success_definition: SINGLE METRIC ONLY. Write the goal_sell_number and goal_by_date verbatim in the form "Sell N [unit] by [date]". Exactly one number and one date. Never compound (never "and", "plus", "/"). If goal_revenue exists mention it as parenthetical context only.
- business_goal: one short sentence about the launch outcome.
- time_capacity: infer from the intake or leave a sensible default.

HARD RULES FOR THIS LAUNCH (NON NEGOTIABLE):
- successTarget on enhanced_foundation MUST be a single string with ONE number and ONE date, written verbatim from the intake in the exact form: "Sell {goal_sell_number} by {goal_by_date, long form Month D, YYYY}". Never compound. Never combine two metrics. Never add "and", "plus", "/".
- Do NOT compute, derive, or emit any monthly recurring revenue, "MRR", "per month", "/mo", or "New Clients / Month" figure anywhere in success_definition, business_goal, enhanced_foundation, or any offer section. This is a one time launch, not a subscription.
- Only reference a revenue figure if goal_revenue is explicitly present in the intake. If goal_revenue is blank, omit revenue entirely rather than derive it.

enhanced_foundation must include:
- positioningBreakdown: idealClient (buyer_who + buyer_trigger), painPoint (buyer_pain), transformation (offer_transformation), uniqueApproach (diff_why_you), method (offer_deliverables), outcome (goal_sell_number + goal_by_date).
- messagingVariations: oneliner, short, elevator, all framed around THIS offer, in the founder's voice, no salesy tone.
- brandArchetype: pick the archetype that best fits how the founder describes themselves and the offer. whyThisFits and howToApply must reference the offer and launch, not a generic brand.
- coreValues (3 to 5) with decision filters that guide launch choices.
- competitivePositioning: yourPosition (diff_why_you), marketGap (what buyer_tried missed), differentiators (diff_why_you vs alternatives), competitiveAdvantages (diff_proof).
- voiceGuidelines: attributes, sentenceStructure, vocabulary, toneByPlatform (skewed to the primary channel for this launch).

ADDITIVE OFFER SECTIONS (populate ALL of these, on top of enhanced_foundation):
- offerPositioning: { offer (offer_one_line, tightened), transformation (offer_transformation), priceFraming (one line that frames offer_price against the value delivered and the cost of inaction), againstAlternatives (one line that positions the offer versus what buyer_tried and did not work) }.
- launchMessaging: { coreMessage (one sentence, the single most important thing to say about this offer), angles (3 to 5 items, each { angle, buyerLanguage } where buyerLanguage uses phrasing pulled from buyer_pain and buyer_tried), objectionCounters (3 to 5 items, each { objection, counter } derived from what the buyer already tried that did not work) }.
- channelPlan: { primaryChannel, rationale (why this channel wins given where the buyer gathers and the warm list), cadence (concrete weekly rhythm through the goal date), channels (2 to 4 supporting channels each { name, why, cadence }) }.
- firstMove: { type ("post" | "dm" | "email"), copy (COMPLETE, ready to send, no placeholders, in the founder's voice, tuned to the warm_list audience), audience (reference the warm_list explicitly by name or handle if provided), why (one sentence on why this move first) }. firstMove is the closing beat of the session, treat it as first class.

Never use em-dashes or en-dashes. Never use contractions. Be specific and grounded in the intake and chat — never generic, never boilerplate.`;

function formatOfferIntake(intake: Record<string, unknown> | null | undefined, gate: Record<string, unknown> | null | undefined): string {
  const i = (intake && typeof intake === "object") ? intake as Record<string, unknown> : {};
  const g = (gate && typeof gate === "object") ? gate as Record<string, unknown> : {};
  const line = (k: string) => String(i[k] ?? "").trim() || "(blank)";
  return [
    "OFFER READINESS GATE:",
    `- Can deliver now: ${g.can_deliver ?? "unknown"}`,
    `- Has demand: ${g.has_demand ?? "unknown"}`,
    `- Is priced: ${g.is_priced ?? "unknown"}`,
    "",
    "OFFER INTAKE WORKSHEET:",
    "The offer",
    `- One sentence: ${line("offer_one_line")}`,
    `- Deliverables: ${line("offer_deliverables")}`,
    `- Price: ${line("offer_price")}`,
    `- Transformation: ${line("offer_transformation")}`,
    "The buyer",
    `- Who specifically: ${line("buyer_who")}`,
    `- Trigger moment: ${line("buyer_trigger")}`,
    `- Pain in their words: ${line("buyer_pain")}`,
    `- What they tried that did not work: ${line("buyer_tried")}`,
    "Why you",
    `- Why you: ${line("diff_why_you")}`,
    `- Proof: ${line("diff_proof")}`,
    `- Cost of inaction: ${line("diff_cost_of_inaction")}`,
    "Revenue goal",
    `- Sell this many: ${line("goal_sell_number")}`,
    `- By this date: ${line("goal_by_date")}`,
    `- Revenue equivalent: ${line("goal_revenue")}`,
    `- Warm list: ${line("warm_list")}`,
  ].join("\n");
}

// Long-form date helper: "2026-09-30" -> "September 30, 2026". Falls back to
// the raw input if it cannot be parsed, so a founder's plain text ("end of
// September") is preserved verbatim.
function longFormDate(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime()) && /\d/.test(s)) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  return s;
}

// Compose the canonical single-metric target string from the intake.
function buildSuccessTarget(intake: Record<string, unknown> | null | undefined): string {
  if (!intake || typeof intake !== "object") return "";
  const n = String((intake as any).goal_sell_number ?? "").trim();
  const by = longFormDate((intake as any).goal_by_date);
  if (!n || !by) return "";
  const withBy = /^by\s/i.test(n) ? n : `${n} by ${by}`;
  const startsSell = /^sell\b/i.test(withBy);
  return startsSell ? withBy : `Sell ${withBy}`;
}

// Strip any recurring-revenue phrasing that Lane 3 must never emit. Operates
// on strings inside enhanced_foundation. Non-strings pass through untouched.
function stripRecurringRevenue<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") {
    let out = value;
    // "$5,000 / month", "$5000/mo", "5k per month", "MRR: $X"
    out = out.replace(/\$?\s*[\d.,]+\s*[kKmM]?\s*(?:\/|per)\s*(?:mo(?:nth)?|wk|week)\b\.?/gi, "");
    out = out.replace(/\b(?:MRR|ARR)\b[^.,;\n]*/gi, "");
    out = out.replace(/\bNew\s+Clients\s*\/\s*Month\b[^.,;\n]*/gi, "");
    out = out.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
    return out as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => stripRecurringRevenue(v)) as unknown as T;
  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) out[k] = stripRecurringRevenue(v);
    return out;
  }
  return value;
}

// ---- Strength scoring -------------------------------------------------------
// Parse [MODE:...] [Q:#] tags appended by the discovery agent.
function parseModes(transcript: string): Record<number, "standard" | "coaching" | "placeholder"> {
  const re = /\[MODE:(standard|coaching|placeholder)\]\s*\[Q:(\d{1,2})\]/gi;
  const out: Record<number, any> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(transcript)) !== null) {
    out[parseInt(m[2], 10)] = m[1].toLowerCase();
  }
  return out;
}

function modeScore(mode: string | undefined, std: number, coach: number, ph: number) {
  if (mode === "standard") return std;
  if (mode === "coaching") return coach;
  if (mode === "placeholder") return ph;
  return coach; // unknown -> assume coaching weight
}

function isQuantified(s?: string) {
  if (!s) return false;
  return /\d/.test(s) && /(per|\/|week|month|day|call|client|subscriber|\$|k\b)/i.test(s);
}

function specificity(s?: string): "high" | "medium" | "low" {
  if (!s) return "low";
  const len = s.trim().length;
  if (len > 80 && /\d|\b(VP|CEO|CTO|director|manager|founder|years|ages?)\b/i.test(s)) return "high";
  if (len > 40) return "medium";
  return "low";
}

function computeStrength(transcript: string, parsed: any) {
  const modes = parseModes(transcript);
  const ef = parsed.enhanced_foundation || {};
  const breakdown: Record<string, number> = {};

  // Section 1: Business Foundation (40)
  breakdown.transformation = modeScore(modes[1], 15, 10, 5);
  const idealSpec = specificity(parsed.ideal_client);
  breakdown.ideal_client = idealSpec === "high" ? 10 : idealSpec === "medium" ? 7 : 3;
  breakdown.pain_point = modeScore(modes[3], 10, 7, 3);
  breakdown.differentiation = modes[4] === "placeholder" ? 1 : 5;

  // Section 2: Voice & Personality (25)
  // Voice sample lives in the transcript as the user's Q6 answer; approximate via length of any user message after Q6 cue.
  const voiceSampleLen = (() => {
    // crude: longest user message in the transcript
    const userMsgs = transcript.split(/\n\n/).filter((b) => b.startsWith("USER:")).map((b) => b.slice(5).trim());
    return userMsgs.reduce((max, s) => Math.max(max, s.length), 0);
  })();
  breakdown.voice_sample = voiceSampleLen > 100 ? 15 : voiceSampleLen > 0 ? 8 : 0;
  const voiceAttrs = parsed.voice_attributes?.length || 0;
  breakdown.voice_attributes = voiceAttrs >= 5 ? 10 : voiceAttrs > 0 ? 5 : 0;

  // Section 3: Current Reality (15)
  breakdown.channel = parsed.primary_channel && parsed.primary_channel.length > 3 ? 10 : 5;
  breakdown.time_capacity = parsed.time_capacity && /\d/.test(parsed.time_capacity) ? 5 : 2;

  // Section 4: Goals (20)
  breakdown.success_metric = isQuantified(parsed.success_definition) ? 15 : parsed.success_definition ? 10 : 5;
  breakdown.business_goal = parsed.business_goal && parsed.business_goal.length > 12 ? 5 : 2;

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Identify weak / strong areas with friendly labels.
  const labels: Record<string, { label: string; section: string; max: number; refineKey: string }> = {
    transformation: { label: "Transformation", section: "Foundation", max: 15, refineKey: "transformation" },
    ideal_client: { label: "Ideal client", section: "Foundation", max: 10, refineKey: "ideal_client" },
    pain_point: { label: "Pain point", section: "Foundation", max: 10, refineKey: "pain_point" },
    differentiation: { label: "Differentiation", section: "Positioning", max: 5, refineKey: "positioning_statement" },
    voice_sample: { label: "Voice sample", section: "Voice", max: 15, refineKey: "voice_attributes" },
    voice_attributes: { label: "Voice attributes", section: "Voice", max: 10, refineKey: "voice_attributes" },
    channel: { label: "Channel strategy", section: "Channels", max: 10, refineKey: "primary_channel" },
    time_capacity: { label: "Time capacity", section: "Capacity", max: 5, refineKey: "time_capacity" },
    success_metric: { label: "Success metric", section: "Goals", max: 15, refineKey: "success_definition" },
    business_goal: { label: "Business goal", section: "Goals", max: 5, refineKey: "business_goal" },
  };

  const weak: any[] = [];
  const strong: any[] = [];
  for (const k of Object.keys(breakdown)) {
    const item = { key: k, label: labels[k].label, section: labels[k].section, points: breakdown[k], max: labels[k].max, refineKey: labels[k].refineKey };
    if (breakdown[k] >= labels[k].max) strong.push(item);
    else weak.push(item);
  }
  // Sort weak by widest gap first
  weak.sort((a, b) => (a.points / a.max) - (b.points / b.max));

  return { score, breakdown, weak_areas: weak, strong_areas: strong };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
    const { transcript: incomingTranscript, sessionId, revenueRange, biggestChallenge, brandContext, lane, responseMode } = await req.json();
    let effectiveLane = lane;
    const wantsJsonResponse = responseMode === "json" || (req.headers.get("accept") || "").includes("application/json");
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    // Source of truth = discovery_sessions.messages. Fall back to client transcript if DB read fails.
    let transcript: string = incomingTranscript || "";
    let resolvedSessionId: string | null = sessionId ?? null;
    let resolvedUserId: string | null = null;
    let resolvedBrandId: string | null = null;
    let resolvedSnapshotId: string | null = null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    async function patchSession(patch: Record<string, unknown>) {
      if (!supabaseUrl || !serviceKey || !resolvedSessionId) return;
      try {
        await fetch(`${supabaseUrl}/rest/v1/discovery_sessions?id=eq.${resolvedSessionId}`, {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(patch),
        });
      } catch (e) {
        console.warn("patchSession failed", e);
      }
    }

    try {
      const authHeader = req.headers.get("Authorization") || "";
      if (supabaseUrl && serviceKey && authHeader) {
        // Identify user from JWT
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { Authorization: authHeader, apikey: serviceKey },
        });
        if (userRes.ok) {
          const u = await userRes.json();
          const userId = u?.id;
          if (userId) {
            resolvedUserId = userId;
            // Find the most recent session (or the one passed in)
            const query = sessionId
              ? `id=eq.${sessionId}&select=id,messages,status,lane,user_id,brand_id`
              : `user_id=eq.${userId}&order=updated_at.desc&limit=1&select=id,messages,status,lane,user_id,brand_id`;
            const sessRes = await fetch(`${supabaseUrl}/rest/v1/discovery_sessions?${query}`, {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            });
            if (sessRes.ok) {
              const rows = await sessRes.json();
              const session = Array.isArray(rows) ? rows[0] : rows;
              const messages: Array<{ role: string; content: string }> = session?.messages ?? [];
              if (Array.isArray(messages) && messages.length > 0) {
                transcript = messages
                  .map((m) => `${m.role === "user" ? "USER" : "MOXIEMO"}: ${m.content}`)
                  .join("\n\n");
              }
              if (!effectiveLane && (session?.lane === "lane1" || session?.lane === "lane2")) {
                effectiveLane = session.lane;
              }
              if (session?.user_id) resolvedUserId = session.user_id;
              if (session?.brand_id) resolvedBrandId = session.brand_id;
              // Mark session completed if not already
              const sid = session?.id ?? sessionId;
              if (sid) resolvedSessionId = sid;
              if (sid && session?.status !== "completed") {
                await fetch(`${supabaseUrl}/rest/v1/discovery_sessions?id=eq.${sid}`, {
                  method: "PATCH",
                  headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal",
                  },
                  body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }),
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load discovery_sessions.messages, using client transcript:", e);
    }

    if (!transcript) throw new Error("No discovery transcript available");

    // ── IDEMPOTENCY CHECK ──────────────────────────────────────────────────────
    // Key = "{user_id}:{session_id}:{epoch_hour}" — same user+session in the same
    // clock-hour will find the existing job and return its result instead of
    // generating twice. This prevents double-generation on network retries and
    // double-taps. The epoch_hour window is intentional: a retry 2 hours later
    // should be allowed (the user likely hit a genuine error the first time).
    if (supabaseUrl && serviceKey && resolvedUserId) {
      const epochHour = Math.floor(Date.now() / 3_600_000);
      const idempotencyKey = `${resolvedUserId}:${resolvedSessionId ?? "nosession"}:${epochHour}`;
      try {
        const jobInsert = await fetch(`${supabaseUrl}/rest/v1/generation_jobs`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates,return=representation",
          },
          body: JSON.stringify({
            idempotency_key: idempotencyKey,
            user_id: resolvedUserId,
            brand_id: resolvedBrandId ?? null,
            job_type: "strategy",
            lane: effectiveLane ?? "lane1",
            session_id: resolvedSessionId ?? null,
            status: "pending",
          }),
        });
        if (jobInsert.status === 200 || jobInsert.status === 201) {
          const rows = await jobInsert.json().catch(() => []);
          const job = Array.isArray(rows) ? rows[0] : rows;
          // If the row already existed (Prefer:ignore-duplicates returns empty on conflict),
          // the rows array will be empty — means a duplicate request is in flight.
          if (!job?.id) {
            console.log(`[synthesize-strategy] duplicate request blocked by idempotency_key=${idempotencyKey}`);
            return new Response(JSON.stringify({ error: "DUPLICATE_IN_FLIGHT" }), {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // Store job ID for status updates later (best-effort, non-blocking).
          (globalThis as Record<string, unknown>).__currentJobId = job.id;
        }
      } catch (e) {
        // Idempotency check failing must NOT block strategy generation.
        console.warn("[synthesize-strategy] idempotency check failed (non-blocking):", e);
      }
    }

    // ── DISCOVERY SNAPSHOT ─────────────────────────────────────────────────────
    // Freeze the current state of discovery_sessions.messages before the
    // pipeline starts. All stages read from this snapshot — if the user sends
    // another discovery message during generation, it cannot contaminate the run.
    if (supabaseUrl && serviceKey && resolvedUserId && resolvedSessionId) {
      try {
        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(transcript));
        const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

        // Load the raw messages array for the snapshot
        let snapshotMessages: unknown[] = [];
        const sessRaw = await fetch(
          `${supabaseUrl}/rest/v1/discovery_sessions?id=eq.${resolvedSessionId}&select=messages,answers`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (sessRaw.ok) {
          const rows = await sessRaw.json().catch(() => []);
          const s = Array.isArray(rows) ? rows[0] : rows;
          snapshotMessages = s?.messages ?? [];
        }

        const snapRes = await fetch(`${supabaseUrl}/rest/v1/discovery_snapshots`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            session_id: resolvedSessionId,
            user_id: resolvedUserId,
            brand_id: resolvedBrandId ?? null,
            lane: effectiveLane ?? "lane1",
            messages: snapshotMessages,
            transcript_hash: hashHex,
          }),
        });
        if (snapRes.ok) {
          const snapRows = await snapRes.json().catch(() => []);
          const snap = Array.isArray(snapRows) ? snapRows[0] : snapRows;
          if (snap?.id) {
            resolvedSnapshotId = snap.id;
            console.log(`[synthesize-strategy] snapshot created id=${snap.id} hash=${hashHex.slice(0, 16)}`);
          }
        }
      } catch (e) {
        // Snapshot creation failing must NOT block strategy generation.
        console.warn("[synthesize-strategy] snapshot creation failed (non-blocking):", e);
      }
    }

    async function saveStrategyForUser(strategy: any, opts: { revenueRange?: string; biggestChallenge?: string }) {
      if (!supabaseUrl || !serviceKey || !resolvedUserId) return;
      const rawFoundation = {
        ...strategy,
        revenueRange: opts.revenueRange,
        biggestChallenge: opts.biggestChallenge,
      };
      try {
        // 1. Upsert the strategies row (existing path, unchanged)
        const res = await fetch(`${supabaseUrl}/rest/v1/strategies?on_conflict=user_id`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            user_id: resolvedUserId,
            brand_id: resolvedBrandId ?? null,
            ...strategy,
            // Promote brandArchetype to the dedicated strategies.archetype column so Dashboard can read it
            archetype: strategy.enhanced_foundation?.brandArchetype ?? strategy.archetype ?? null,
            raw_foundation: rawFoundation,
          }),
        });
        if (!res.ok) {
          console.warn("strategy upsert failed:", res.status, await res.text().catch(() => ""));
          return;
        }

        // 2. Write strategy_sections for the paid content gate.
        // Free sections: positioning. Paid sections: voice, pillars, channel, plan.
        // This mirrors the LOCKED_SECTIONS constant in Strategy.tsx.
        const rows = await res.json().catch(() => []);
        const strategyRow = Array.isArray(rows) ? rows[0] : rows;
        if (!strategyRow?.id) return;

        const ef = strategy.enhanced_foundation ?? {};
        const sectionDefs = [
          { section_key: "positioning", sort_order: 1, is_paid: false, content: {
            statement: strategy.positioning_statement,
            breakdown: ef.positioningBreakdown,
            variations: ef.positioningVariations,
          }},
          { section_key: "voice", sort_order: 2, is_paid: true, content: {
            attributes: strategy.voice_attributes,
            guidelines: ef.voiceGuidelines,
            archetype: ef.brandArchetype,
            coreValues: ef.coreValues,
          }},
          { section_key: "pillars", sort_order: 3, is_paid: true, content: {
            pillars: strategy.content_pillars,
            messaging: ef.messagingFormats,
          }},
          { section_key: "channel", sort_order: 4, is_paid: true, content: {
            primary: strategy.primary_channel,
            frequency: strategy.posting_frequency,
            distribution: ef.distribution,
            competitive: ef.competitivePositioning,
          }},
          { section_key: "plan", sort_order: 5, is_paid: true, content: {
            successDefinition: strategy.success_definition,
            businessGoal: strategy.business_goal,
            actionPlan: ef.action_plan,
          }},
        ];

        const sectionRows = sectionDefs.map((s) => ({
          ...s,
          strategy_id: strategyRow.id,
          user_id: resolvedUserId,
          brand_id: resolvedBrandId ?? null,
        }));

        const sectRes = await fetch(`${supabaseUrl}/rest/v1/strategy_sections?on_conflict=strategy_id,section_key`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(sectionRows),
        });
        if (!sectRes.ok) console.warn("strategy_sections upsert failed:", sectRes.status, await sectRes.text().catch(() => ""));
      } catch (e) {
        console.warn("strategy upsert threw:", e);
      }

      // Update the generation_jobs row to completed
      const jobId = (globalThis as Record<string, unknown>).__currentJobId as string | undefined;
      if (jobId && supabaseUrl && serviceKey) {
        fetch(`${supabaseUrl}/rest/v1/generation_jobs?id=eq.${jobId}`, {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "completed",
            snapshot_id: resolvedSnapshotId,
            completed_at: new Date().toISOString(),
          }),
        }).catch((e) => console.warn("job completion patch failed:", e));
      }
    }

    // Mark synthesis as in_progress + bump attempts up front.
    await patchSession({
      synthesis_status: "in_progress",
      synthesis_last_error: null,
    });
    // Bump attempt counter using a separate RPC-like patch (best-effort).
    if (supabaseUrl && serviceKey && resolvedSessionId) {
      try {
        const r = await fetch(`${supabaseUrl}/rest/v1/discovery_sessions?id=eq.${resolvedSessionId}&select=synthesis_attempts`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const j = await r.json().catch(() => []);
        const cur = Array.isArray(j) ? (j[0]?.synthesis_attempts ?? 0) : 0;
        await patchSession({ synthesis_attempts: cur + 1 });
      } catch {}
    }

    const isLane2 = effectiveLane === "lane2";
    const isLane3 = effectiveLane === "offer_gtm";

    // Lane 3 needs the structured intake + gate loaded from the session.
    let offerIntake: Record<string, unknown> | null = null;
    let offerGate: Record<string, unknown> | null = null;
    if (isLane3 && supabaseUrl && serviceKey && resolvedSessionId) {
      try {
        const r = await fetch(`${supabaseUrl}/rest/v1/discovery_sessions?id=eq.${resolvedSessionId}&select=answers`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const rows = await r.json().catch(() => []);
        const ans = Array.isArray(rows) ? (rows[0]?.answers ?? null) : null;
        if (ans && typeof ans === "object") {
          offerIntake = (ans.offer_intake ?? null) as Record<string, unknown> | null;
          offerGate = (ans.offer_gate ?? null) as Record<string, unknown> | null;
        }
      } catch (e) {
        console.warn("lane3: failed to load offer intake from session", e);
      }
    }

    // Wall-clock start for total 145s budget (Supabase hard-limit is 150s, 5s buffer for infra).
    // Claude API takes 8–30s per call depending on output length. Budget breakdown:
    //   compression (if needed): ≤20s
    //   main synthesis attempt 1: ≤100s
    //   retry if attempt 1 fails: ≤100s (shares remaining wall time via remainingMs())
    //   DB writes after synthesis: ≥5s reserved
    const wallStart = Date.now();
    const WALL_BUDGET_MS = 145_000;
    const remainingMs = () => Math.max(5_000, WALL_BUDGET_MS - (Date.now() - wallStart));

    // Optional compression pass: if the transcript is large, summarise it to a
    // structured JSON first so synthesis runs against a much smaller prompt.
    // Capped at 20s (down from 35s) so the main synthesis call always has ≥120s of wall time.
    let compressedJson: string | null = null;
    let compressionRan = false;
    // Lane 3 uses the structured intake as source of truth; the chat only sharpens
    // it, so skip the extra compression call and just cap the transcript.
    if (!isLane3 && transcript.length > 15_000) {
      compressionRan = true;
      const originalChars = transcript.length;
      try {
        const compressController = new AbortController();
        const compressTimer = setTimeout(() => compressController.abort(), Math.min(20_000, remainingMs() - 120_000));
        const cRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: `Extract the key strategic information from this Discovery interview into a structured JSON.
Preserve all specific details, numbers, examples, and the founder's exact language where it matters most.
Remove conversational filler, coaching dialogue, and repeated context.

Respond with ONLY a JSON object in this shape (omit fields if not present):
{
  "transformation": string,
  "ideal_client": string,
  "primary_problem": string,
  "differentiator": string,
  "desired_feeling": string,
  "brand_voice_summary": string,
  "anti_voice": string,
  "content_pillars": string[],
  "channels": string,
  "content_format": string,
  "goals_90_day": string,
  "business_goal": string,
  "time_available": string,
  "revenue_context": string,
  "biggest_challenge": string
}

TRANSCRIPT:
${transcript}`,
            }],
          }),
          signal: compressController.signal,
        }).finally(() => clearTimeout(compressTimer));
        if (cRes.ok) {
          const cj = await cRes.json();
          const text = cj?.content?.[0]?.text ?? "";
          // Pull a JSON object out of the response (model may add prose).
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            // Validate it parses and has at least a handful of fields.
            const parsed = JSON.parse(match[0]);
            if (parsed && typeof parsed === "object" && Object.keys(parsed).length >= 4) {
              compressedJson = JSON.stringify(parsed, null, 2);
              console.log(JSON.stringify({
                event: "transcript_compression",
                original_chars: originalChars,
                compressed_chars: compressedJson.length,
                compression_ratio: +(compressedJson.length / originalChars).toFixed(3),
              }));
            }
          }
        } else {
          console.warn("compression call failed:", cRes.status, await cRes.text().catch(() => ""));
        }
      } catch (e) {
        console.warn("compression threw:", String(e));
      }
    }

    // Transcript truncation safety net for unusually long Discovery sessions.
    // If the transcript exceeds 25,000 chars, keep the most recent (and most
    // complete) USER answers and trim repeated MOXIEMO question context that
    // would otherwise inflate the prompt. We always preserve the final tail
    // of the conversation so the most refined answers stay intact.
    if (!compressedJson && transcript.length > 25_000) {
      const originalLen = transcript.length;
      const blocks = transcript.split(/\n\n/);
      const tail: string[] = [];
      let acc = 0;
      const TAIL_BUDGET = 18_000;
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (acc + b.length + 2 > TAIL_BUDGET) break;
        tail.unshift(b);
        acc += b.length + 2;
      }
      // Keep the very first few blocks as opening context.
      const head = blocks.slice(0, 4).join("\n\n");
      transcript = `${head}\n\n… [earlier MOXIEMO prompts trimmed for length] …\n\n${tail.join("\n\n")}`;
      console.log(
        `[synthesize-strategy] ${isLane2 ? "lane2" : "lane1"} transcript truncated: ${originalLen} -> ${transcript.length} chars`,
      );
    }

    const synthesisSource = compressedJson
      ? `Here is a COMPRESSED structured summary of the Discovery interview (the full transcript was too long to include directly). Treat this as the source of truth — it preserves the founder's specifics, numbers, and exact language where it mattered.\n\nCompressed Discovery JSON:\n\n${compressedJson}`
      : `Discovery transcript:\n\n${transcript}`;
    let userContent: string;
    if (isLane3) {
      // Cap the sharpening transcript so a chatty session does not balloon
      // the prompt. The structured intake is the source of truth.
      const CHAT_CAP = 8000;
      let lane3Transcript = transcript;
      if (lane3Transcript.length > CHAT_CAP) {
        console.log(`[synthesize-strategy] lane3 transcript capped: ${lane3Transcript.length} -> ${CHAT_CAP}`);
        lane3Transcript = lane3Transcript.slice(-CHAT_CAP);
      }
      userContent =
        "Here is a founder launching ONE specific offer. Build the go to market strategy for THIS offer using the structured intake as source of truth, sharpened by the chat transcript below.\n\n" +
        formatOfferIntake(offerIntake, offerGate) +
        "\n\nSHARPENING CHAT TRANSCRIPT (recent portion):\n\n" +
        lane3Transcript;
    } else if (isLane2) {
      userContent = "Here is a complete Discovery conversation with the founder or operator of a SERVICE-BASED BUSINESS or MARKETPLACE. The strategy must be for the BUSINESS BRAND — no personal/expertise framing.\n\n" + synthesisSource;
    } else {
      userContent = "Here is a founder's complete Discovery conversation with MOXIEMO.\nExtract and synthesize their full marketing strategy from their answers below.\n\n" + synthesisSource;
    }
    if (revenueRange) userContent += `\n\nFounder's revenue stage: ${revenueRange}`;
    if (biggestChallenge) userContent += `\nBiggest marketing challenge: ${biggestChallenge}`;
    if (brandContext && typeof brandContext === "object") {
      const bc: any = brandContext;
      const lines: string[] = [];
      if (bc.mission_or_values) lines.push(`- Mission/values from their site: ${bc.mission_or_values}`);
      if (bc.founder_background) lines.push(`- Founder background: ${bc.founder_background}`);
      if (bc.pricing_signals) lines.push(`- Pricing signals on the site: ${bc.pricing_signals}`);
      if (bc.social_proof) lines.push(`- Social proof on the site: ${bc.social_proof}`);
      if (lines.length) {
        // Cap scraped brand context at 2000 chars so a content-heavy site can't
        // balloon the synthesis prompt and push us past token / time limits.
        let scraped = lines.join("\n");
        if (scraped.length > 2000) {
          console.log(`[synthesize-strategy] truncating scraped brand context: ${scraped.length} -> 2000 chars`);
          scraped = scraped.slice(0, 2000) + "… [truncated]";
        }

        // Mismatch guard: if the scraped content shares very little vocabulary
        // with the discovery transcript, the website probably belongs to a
        // different business (wrong URL pasted, personal site vs business
        // site, etc.). Tell the model to prioritise the transcript instead of
        // burning tokens trying to reconcile contradictions.
        const tokenize = (s: string) =>
          new Set(
            s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 4),
          );
        const tWords = tokenize(transcript.slice(0, 8000));
        const sWords = tokenize(scraped);
        let overlap = 0;
        for (const w of sWords) if (tWords.has(w)) overlap++;
        const ratio = sWords.size > 0 ? overlap / sWords.size : 1;
        const mismatch = sWords.size >= 20 && ratio < 0.15;

        userContent += `\n\nADDITIONAL BRAND CONTEXT FROM WEBSITE (weave in where relevant; the transcript is still source of truth):\n${scraped}`;
        if (mismatch) {
          console.log(`[synthesize-strategy] brand context mismatch detected (overlap=${ratio.toFixed(3)})`);
          userContent += `\n\nNote: website content may not match this business — prioritise Discovery answers over any scraped context.`;
        }
      }
    }

    // Dynamic max_tokens for BOTH lanes:
    // - compressed input → 24000 (output is the same shape, smaller input)
    // - uncompressed under 15k → 16384
    // - compression failed but transcript was huge → 32000 safety net
    let maxTokensForCall: number;
    if (isLane3) {
      maxTokensForCall = 20000;
    } else if (compressedJson) {
      maxTokensForCall = 24000;
    } else if (transcript.length < 15_000) {
      maxTokensForCall = 16384;
    } else {
      // We wanted to compress but couldn't — fall back to raw with extra headroom.
      maxTokensForCall = 32000;
    }

    // Pre-synthesis prompt length logging so we can see when prompts balloon.
    console.log(
      `[synthesize-strategy] lane=${isLane3 ? "lane3" : isLane2 ? "lane2" : "lane1"} prompt_chars=${userContent.length} transcript_chars=${transcript.length} compressed=${!!compressedJson} max_tokens=${maxTokensForCall}`,
    );

    const saveStrategyParams = {
              type: "object",
              properties: {
                positioning_statement: { type: "string" },
                ideal_client: { type: "string" },
                pain_point: { type: "string" },
                transformation: { type: "string" },
                voice_attributes: { type: "array", items: { type: "string" } },
                anti_positioning: { type: "string" },
                content_pillars: {
                  type: "array",
                  items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"] },
                },
                primary_channel: { type: "string" },
                posting_frequency: { type: "string" },
                success_definition: { type: "string" },
                business_goal: { type: "string" },
                time_capacity: { type: "string" },
                enhanced_foundation: {
                  type: "object",
                  description: "Sprint 1 expanded foundation. Derive everything from the transcript — be specific, never generic.",
                  properties: {
                    positioningBreakdown: {
                      type: "object",
                      properties: {
                        idealClient: { type: "string" },
                        painPoint: { type: "string" },
                        transformation: { type: "string" },
                        uniqueApproach: { type: "string" },
                        method: { type: "string" },
                        outcome: { type: "string" },
                      },
                    },
                    successTarget: {
                      type: "string",
                      description: "Lane 3 only. Single metric, single date, verbatim from the intake. Form: 'Sell N [unit] by Month D, YYYY'. Never compound.",
                    },
                    positioningVariations: {
                      type: "object",
                      properties: {
                        short: { type: "string", description: "One-line version (under 20 words)" },
                        tweet: { type: "string", description: "Punchy tweet-length version" },
                        elevator: { type: "string", description: "Conversational 'You know how...' format" },
                      },
                    },
                    messagingVariations: {
                      type: "object",
                      description: "Reusable messaging in three formats. Always populate all three.",
                      properties: {
                        oneliner: { type: "string", description: "One-liner for bios and introductions (under 15 words)" },
                        short: { type: "string", description: "Short version for social bios, max 160 chars" },
                        elevator: { type: "string", description: "Natural, confident 3-4 sentence networking introduction written in first person, conversational tone, not salesy. Should answer 'what do you do?' at a dinner party — not a boardroom." },
                      },
                      required: ["oneliner", "short", "elevator"],
                    },
                    brandArchetype: {
                      type: "object",
                      properties: {
                        primary: { type: "string", description: "One of: sage, hero, caregiver, creator, explorer, ruler, magician, rebel, lover, jester, everyman, innocent" },
                        secondary: { type: "string" },
                        name: { type: "string", description: "e.g. 'The Sage'" },
                        icon: { type: "string", description: "single emoji" },
                        description: { type: "string" },
                        exampleBrands: { type: "array", items: { type: "string" } },
                        coreValues: { type: "array", items: { type: "string" } },
                        voiceAttributes: { type: "array", items: { type: "string" } },
                        contentApproach: { type: "string" },
                        strengths: { type: "array", items: { type: "string" } },
                        pitfalls: { type: "array", items: { type: "string" } },
                        whyThisFits: { type: "array", items: { type: "string" } },
                        howToApply: { type: "array", items: { type: "string" } },
                      },
                      required: ["primary", "name", "icon", "description", "whyThisFits", "howToApply"],
                    },
                    coreValues: {
                      type: "array",
                      description: "3-5 values, each with a decision filter and yes/no examples.",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          decisionFilter: { type: "string" },
                          description: { type: "string" },
                          yesExamples: { type: "array", items: { type: "string" } },
                          noExamples: { type: "array", items: { type: "string" } },
                          derivedFrom: { type: "string" },
                        },
                        required: ["name", "decisionFilter", "description"],
                      },
                    },
                    competitivePositioning: {
                      type: "object",
                      properties: {
                        yourPosition: { type: "string" },
                        marketGap: { type: "string" },
                        differentiators: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              factor: { type: "string" },
                              you: { type: "string" },
                              competitors: { type: "string" },
                            },
                            required: ["factor", "you", "competitors"],
                          },
                        },
                        doNotCompeteOn: { type: "array", items: { type: "string" } },
                        competitiveAdvantages: { type: "array", items: { type: "string" } },
                      },
                    },
                    distribution: {
                      type: "object",
                      description: "Lane 2 only — recommended local/service distribution channels plus which existing Q13 channel to double down on. Leave empty for non-service strategies.",
                      properties: {
                        doubleDownOn: { type: "string", description: "The existing channel from Q13 that is working best — double down before adding new ones." },
                        doubleDownRationale: { type: "string" },
                        recommendedChannels: {
                          type: "array",
                          description: "3-6 recommended channels prioritized for local/service businesses (e.g. Google Business Profile, local Facebook & Instagram, Nextdoor, referrals, partnerships).",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              why: { type: "string" },
                              priority: { type: "string", enum: ["high", "medium", "low"] },
                            },
                            required: ["name", "why"],
                          },
                        },
                      },
                    },
                    offerPositioning: {
                      type: "object",
                      description: "Lane 3 only — how this specific offer is positioned. Leave empty for non offer-launch strategies.",
                      properties: {
                        offer: { type: "string" },
                        transformation: { type: "string" },
                        priceFraming: { type: "string" },
                        againstAlternatives: { type: "string" },
                      },
                    },
                    launchMessaging: {
                      type: "object",
                      description: "Lane 3 only — the launch messaging system for this offer.",
                      properties: {
                        coreMessage: { type: "string" },
                        angles: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              angle: { type: "string" },
                              buyerLanguage: { type: "string" },
                            },
                            required: ["angle"],
                          },
                        },
                        objectionCounters: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              objection: { type: "string" },
                              counter: { type: "string" },
                            },
                            required: ["objection", "counter"],
                          },
                        },
                      },
                    },
                    channelPlan: {
                      type: "object",
                      description: "Lane 3 only — where and how to run the launch.",
                      properties: {
                        primaryChannel: { type: "string" },
                        rationale: { type: "string" },
                        cadence: { type: "string" },
                        channels: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              why: { type: "string" },
                              cadence: { type: "string" },
                            },
                            required: ["name", "why"],
                          },
                        },
                      },
                    },
                    firstMove: {
                      type: "object",
                      description: "Lane 3 only — the very first move the founder will make this week. Copy must be complete and ready to send.",
                      properties: {
                        type: { type: "string", enum: ["post", "dm", "email"] },
                        copy: { type: "string" },
                        audience: { type: "string" },
                        why: { type: "string" },
                      },
                      required: ["type", "copy", "audience", "why"],
                    },
                    voiceGuidelines: {
                      type: "object",
                      properties: {
                        attributes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              trait: { type: "string" },
                              meaning: { type: "string" },
                              inPractice: { type: "string" },
                              example: { type: "string" },
                            },
                            required: ["trait", "meaning", "inPractice"],
                          },
                        },
                        sentenceStructure: {
                          type: "object",
                          properties: {
                            rules: { type: "array", items: { type: "string" } },
                            example: { type: "string" },
                          },
                        },
                        vocabulary: {
                          type: "object",
                          properties: {
                            use: { type: "array", items: { type: "string" } },
                            avoid: { type: "array", items: { type: "string" } },
                          },
                        },
                        toneByPlatform: {
                          type: "object",
                          properties: {
                            linkedin: { type: "object", properties: { tone: { type: "string" }, mode: { type: "string" }, example: { type: "string" } } },
                            email: { type: "object", properties: { tone: { type: "string" }, mode: { type: "string" }, example: { type: "string" } } },
                            podcast: { type: "object", properties: { tone: { type: "string" }, mode: { type: "string" }, example: { type: "string" } } },
                          },
                        },
                        neverSoundLike: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              style: { type: "string" },
                              example: { type: "string" },
                              why: { type: "string" },
                            },
                            required: ["style", "example", "why"],
                          },
                        },
                        voiceExamples: {
                          type: "object",
                          properties: {
                            openingHook: { type: "object", properties: { good: { type: "string" }, bad: { type: "string" }, why: { type: "string" } } },
                            teachingPoint: { type: "object", properties: { good: { type: "string" }, bad: { type: "string" }, why: { type: "string" } } },
                            callToAction: { type: "object", properties: { good: { type: "string" }, bad: { type: "string" }, why: { type: "string" } } },
                          },
                        },
                      },
                    },
                  },
                  required: ["positioningBreakdown", "brandArchetype", "coreValues", "competitivePositioning", "voiceGuidelines"],
                },
              },
              required: ["positioning_statement", "ideal_client", "pain_point", "transformation", "voice_attributes", "content_pillars", "primary_channel", "success_definition"],
    } as const;

    const REQUIRED_TOP_FIELDS = [
      "positioning_statement",
      "ideal_client",
      "pain_point",
      "transformation",
      "voice_attributes",
      "content_pillars",
      "primary_channel",
      "success_definition",
    ];

    const finishStrategy = (parsed: any) => {
      try {
        const strength = computeStrength(transcript || "", parsed);
        parsed.strength_score = strength.score;
        parsed.strength_breakdown = strength.breakdown;
        parsed.weak_areas = strength.weak_areas;
        parsed.strong_areas = strength.strong_areas;
      } catch (e) {
        console.error("strength scoring failed", e);
      }
      parsed.strategy_lane = isLane2 ? "service" : "expertise";
      if (isLane3) parsed.strategy_lane = "offer_gtm";
      // Lane 3 post-processing: enforce single-metric successTarget and scrub
      // any recurring-revenue phrasing the model may have slipped in.
      if (isLane3) {
        const ef = parsed.enhanced_foundation && typeof parsed.enhanced_foundation === "object" ? parsed.enhanced_foundation : {};
        const canonical = buildSuccessTarget(offerIntake);
        if (canonical) {
          ef.successTarget = canonical;
          // Also normalize success_definition so downstream Goals / North Star
          // see one metric, not compound.
          if (!parsed.success_definition || /\band\b|\+|\//i.test(parsed.success_definition)) {
            parsed.success_definition = canonical;
          }
        }
        parsed.enhanced_foundation = stripRecurringRevenue(ef);
        parsed.success_definition = stripRecurringRevenue(parsed.success_definition);
        parsed.business_goal = stripRecurringRevenue(parsed.business_goal);
      }
      // Brand rule: never persist em/en dashes in generated strategy copy.
      return sanitizeDashesDeep(parsed);
    };

    // Single attempt: open the Anthropic streaming call, drain it (forwarding
    // progress events to the client), and return the accumulated tool JSON.
    // Abort timeout is capped to the remaining wall-clock budget so the total
    // function runtime never exceeds Supabase's 150s hard limit.
    async function callAnthropicOnce(opts: {
      onProgress: (bytes: number) => void;
    }): Promise<{ ok: true; toolJson: string } | { ok: false; status: number; detail: string }> {
      const controller = new AbortController();
      // Leave 5s buffer for DB writes after the call completes.
      const abortMs = Math.min(remainingMs() - 5_000, 100_000);
      const timer = setTimeout(() => controller.abort(), abortMs);
      const startedAt = Date.now();
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            // Lane 2 outputs are longer (extra service-business sections);
            // Lane 1 scales dynamically with transcript length (computed above).
            max_tokens: maxTokensForCall,
            stream: true,
            system: isLane2 ? SYSTEM_LANE2 : SYSTEM,
            messages: [{ role: "user", content: userContent }],
            tools: [{
              name: "save_strategy",
              description: "Save the synthesized marketing strategy.",
              input_schema: saveStrategyParams,
            }],
            tool_choice: { type: "tool", name: "save_strategy" },
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return { ok: false, status: res.status, detail: t };
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let toolJson = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;
            try {
              const evt = JSON.parse(dataStr);
              if (evt.type === "content_block_delta") {
                const d = evt.delta;
                if (d?.type === "input_json_delta" && typeof d.partial_json === "string") {
                  toolJson += d.partial_json;
                  opts.onProgress(toolJson.length);
                }
              }
            } catch {
              // ignore malformed line
            }
          }
        }
        try { reader.releaseLock(); } catch {}
        console.log(`[synthesize-strategy] lane=${isLane3 ? "lane3" : isLane2 ? "lane2" : "lane1"} generation_ms=${Date.now() - startedAt} tool_json_chars=${toolJson.length}`);
        return { ok: true, toolJson };
      } catch (e) {
        const err = e as Error;
        if (err?.name === "AbortError") {
          console.log(`[synthesize-strategy] lane=${isLane3 ? "lane3" : isLane2 ? "lane2" : "lane1"} generation_ms=${Date.now() - startedAt} status=timeout`);
          return { ok: false, status: 408, detail: "SYNTHESIS_TIMEOUT" };
        }
        console.log(`[synthesize-strategy] lane=${isLane3 ? "lane3" : isLane2 ? "lane2" : "lane1"} generation_ms=${Date.now() - startedAt} status=error`);
        return { ok: false, status: 0, detail: String(e) };
      } finally {
        clearTimeout(timer);
      }
    }

    function validateStrategy(toolJson: string): { ok: true; parsed: any } | { ok: false; reason: string } {
      if (!toolJson) return { ok: false, reason: "empty output" };
      let parsed: any;
      try {
        parsed = JSON.parse(toolJson);
      } catch (e) {
        return { ok: false, reason: `parse error: ${String(e)}` };
      }
      // Defensive: some tool-call streams return enhanced_foundation as a
      // JSON-encoded string instead of an object. Re-parse so downstream
      // consumers (validation, persistence, UI) see a proper object.
      if (typeof parsed?.enhanced_foundation === "string") {
        try {
          parsed.enhanced_foundation = JSON.parse(parsed.enhanced_foundation);
        } catch {
          // leave as-is; validation will flag if required keys are missing
        }
      }
      const missing = REQUIRED_TOP_FIELDS.filter((k) => {
        const v = parsed?.[k];
        if (v === undefined || v === null) return true;
        if (Array.isArray(v) && v.length === 0) return true;
        if (typeof v === "string" && v.trim().length === 0) return true;
        return false;
      });
      if (missing.length > 0) {
        return { ok: false, reason: `missing required fields: ${missing.join(", ")}` };
      }
      return { ok: true, parsed };
    }

    async function synthesizeWithRetry(onProgress: (bytes: number) => void) {
      let attempt = await callAnthropicOnce({ onProgress });
      if (!attempt.ok && attempt.status === 408) {
        return { ok: false, status: 408, code: "SYNTHESIS_TIMEOUT", message: "SYNTHESIS_TIMEOUT" } as const;
      }

      let validation = attempt.ok
        ? validateStrategy(attempt.toolJson)
        : ({ ok: false, reason: `upstream ${attempt.status}: ${attempt.detail.slice(0, 200)}` } as const);

      if (!validation.ok) {
        console.warn("synthesize-strategy: attempt 1 failed —", (validation as any).reason, "— retrying once");
        onProgress(0);
        if (attempt.ok === false && (attempt.status === 429 || attempt.status === 402)) {
          notifyAdminCritical(req, { functionName: "synthesize-strategy", status: attempt.status, detail: attempt.detail });
        }
        attempt = await callAnthropicOnce({ onProgress });
        if (!attempt.ok && attempt.status === 408) {
          return { ok: false, status: 408, code: "SYNTHESIS_TIMEOUT", message: "SYNTHESIS_TIMEOUT" } as const;
        }
        validation = attempt.ok
          ? validateStrategy(attempt.toolJson)
          : ({ ok: false, reason: `upstream ${attempt.status}: ${attempt.detail.slice(0, 200)}` } as const);
      }

      if (!validation.ok) {
        console.error("synthesize-strategy: both attempts failed —", (validation as any).reason);
        if (attempt.ok === false) {
          notifyAdminCritical(req, { functionName: "synthesize-strategy", status: attempt.status || 0, detail: attempt.detail });
        }
        return {
          ok: false,
          status: attempt.ok ? 500 : attempt.status || 500,
          code: "SYNTHESIS_FAILED",
          message: "Strategy output was longer than expected. Please retry — this usually resolves on the second attempt.",
        } as const;
      }

      return { ok: true, strategy: finishStrategy(validation.parsed) } as const;
    }

    if (wantsJsonResponse) {
      const result = await synthesizeWithRetry(() => {});
      if (!result.ok) {
        await patchSession({
          synthesis_status: "failed",
          synthesis_last_error: (result.code === "SYNTHESIS_TIMEOUT" ? "SYNTHESIS_TIMEOUT" : result.message).slice(0, 500),
        });
        const status = result.code === "SYNTHESIS_TIMEOUT" ? 408 : result.status;
        const error = result.code === "SYNTHESIS_TIMEOUT" ? "SYNTHESIS_TIMEOUT" : result.message;
        return new Response(JSON.stringify({ error }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await saveStrategyForUser(result.strategy, { revenueRange, biggestChallenge });
      await patchSession({
        synthesis_status: "completed",
        synthesis_completed_at: new Date().toISOString(),
        synthesis_last_error: null,
      });
      return new Response(JSON.stringify({ strategy: result.strategy }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let streamClosed = false;
        const sendEvent = (obj: any) => {
          if (streamClosed) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        // Heartbeat to keep the connection alive while Anthropic generates.
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            // controller already closed
          }
        }, 10000);

        try {
          const onProgress = (bytes: number) => sendEvent({ type: "progress", bytes });
          const result = await synthesizeWithRetry(onProgress);

          if (!result.ok) {
            await patchSession({
              synthesis_status: "failed",
              synthesis_last_error: (result.code === "SYNTHESIS_TIMEOUT" ? "SYNTHESIS_TIMEOUT" : result.message).slice(0, 500),
            });
            sendEvent({ type: "error", message: result.code === "SYNTHESIS_TIMEOUT" ? "SYNTHESIS_TIMEOUT" : result.message });
            return;
          }

          await saveStrategyForUser(result.strategy, { revenueRange, biggestChallenge });
          await patchSession({
            synthesis_status: "completed",
            synthesis_completed_at: new Date().toISOString(),
            synthesis_last_error: null,
          });
          sendEvent({ type: "complete", strategy: result.strategy });
        } catch (e) {
          console.error("stream error", e);
          await patchSession({
            synthesis_status: "failed",
            synthesis_last_error: String(e).slice(0, 500),
          });
          try { sendEvent({ type: "error", message: String(e) }); } catch {}
        } finally {
          clearInterval(heartbeat);
          if (!streamClosed) {
            streamClosed = true;
            try { controller.close(); } catch {}
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});