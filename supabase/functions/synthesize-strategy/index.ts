const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const SYSTEM = `You are MOXIEMO's strategy synthesizer. Read a discovery conversation transcript and extract a complete marketing strategy.
You will save BOTH a base strategy AND an expanded "enhanced_foundation" object that deepens the output (Sprint 1: positioning breakdown, brand archetype, core values, competitive positioning, detailed voice guidelines).
Be specific and grounded in the transcript — never generic. Every example, value, and word should feel derived from what the user actually said.`;

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
    const { transcript: incomingTranscript, sessionId, revenueRange, biggestChallenge, brandContext, lane, responseMode } = await req.json();
    let effectiveLane = lane;
    const wantsJsonResponse = responseMode === "json" || (req.headers.get("accept") || "").includes("application/json");
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    // Source of truth = discovery_sessions.messages. Fall back to client transcript if DB read fails.
    let transcript: string = incomingTranscript || "";
    let resolvedSessionId: string | null = sessionId ?? null;
    let resolvedUserId: string | null = null;
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
              ? `id=eq.${sessionId}&select=id,messages,status,lane,user_id`
              : `user_id=eq.${userId}&order=updated_at.desc&limit=1&select=id,messages,status,lane,user_id`;
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

    async function saveStrategyForUser(strategy: any, opts: { revenueRange?: string; biggestChallenge?: string }) {
      if (!supabaseUrl || !serviceKey || !resolvedUserId) return;
      const rawFoundation = {
        ...strategy,
        revenueRange: opts.revenueRange,
        biggestChallenge: opts.biggestChallenge,
      };
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/strategies?on_conflict=user_id`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify({ user_id: resolvedUserId, ...strategy, raw_foundation: rawFoundation }),
        });
        if (!res.ok) console.warn("strategy upsert failed:", res.status, await res.text().catch(() => ""));
      } catch (e) {
        console.warn("strategy upsert threw:", e);
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

    // Optional compression pass: if the transcript is large, summarise it to a
    // structured JSON first so synthesis runs against a much smaller prompt.
    let compressedJson: string | null = null;
    let compressionRan = false;
    if (transcript.length > 15_000) {
      compressionRan = true;
      const originalChars = transcript.length;
      try {
        const compressController = new AbortController();
        const compressTimer = setTimeout(() => compressController.abort(), 90_000);
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
    let userContent = isLane2
      ? "Here is a complete Discovery conversation with the founder or operator of a SERVICE-BASED BUSINESS or MARKETPLACE. The strategy must be for the BUSINESS BRAND — no personal/expertise framing.\n\n" + synthesisSource
      : "Here is a founder's complete Discovery conversation with MOXIEMO.\nExtract and synthesize their full marketing strategy from their answers below.\n\n" + synthesisSource;
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
    if (compressedJson) {
      maxTokensForCall = 24000;
    } else if (transcript.length < 15_000) {
      maxTokensForCall = 16384;
    } else {
      // We wanted to compress but couldn't — fall back to raw with extra headroom.
      maxTokensForCall = 32000;
    }

    // Pre-synthesis prompt length logging so we can see when prompts balloon.
    console.log(
      `[synthesize-strategy] lane=${isLane2 ? "lane2" : "lane1"} prompt_chars=${userContent.length} transcript_chars=${transcript.length} compressed=${!!compressedJson} max_tokens=${maxTokensForCall}`,
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
      return parsed;
    };

    // Single attempt: open the Anthropic streaming call, drain it (forwarding
    // progress events to the client), and return the accumulated tool JSON.
    // Uses a dynamic AbortController: 180s normally, 300s when compression ran
    // (since that adds another sequential Anthropic call upstream).
    async function callAnthropicOnce(opts: {
      onProgress: (bytes: number) => void;
    }): Promise<{ ok: true; toolJson: string } | { ok: false; status: number; detail: string }> {
      const controller = new AbortController();
      const abortMs = compressionRan ? 300_000 : 180_000;
      const timer = setTimeout(() => controller.abort(), abortMs);
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
        return { ok: true, toolJson };
      } catch (e) {
        const err = e as Error;
        if (err?.name === "AbortError") {
          return { ok: false, status: 408, detail: "SYNTHESIS_TIMEOUT" };
        }
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