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
    const { transcript: incomingTranscript, sessionId, revenueRange, biggestChallenge, brandContext, lane } = await req.json();
    const isLane2 = lane === "lane2";
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    // Source of truth = discovery_sessions.messages. Fall back to client transcript if DB read fails.
    let transcript: string = incomingTranscript || "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
            // Find the most recent session (or the one passed in)
            const query = sessionId
              ? `id=eq.${sessionId}&select=messages,status`
              : `user_id=eq.${userId}&order=updated_at.desc&limit=1&select=id,messages,status`;
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
              // Mark session completed if not already
              const sid = session?.id ?? sessionId;
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

    let userContent = isLane2
      ? "Here is a complete Discovery conversation with the founder or operator of a SERVICE-BASED BUSINESS or MARKETPLACE. The strategy must be for the BUSINESS BRAND — no personal/expertise framing.\n\nDiscovery transcript:\n\n" + transcript
      : "Here is a founder's complete Discovery conversation with MOXIEMO.\nExtract and synthesize their full marketing strategy from their answers below.\n\nDiscovery transcript:\n\n" + transcript;
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
        userContent += `\n\nADDITIONAL BRAND CONTEXT FROM WEBSITE (weave in where relevant; the transcript is still source of truth):\n${lines.join("\n")}`;
      }
    }

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

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
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
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Synth error", res.status, t);
      notifyAdminCritical(req, { functionName: "synthesize-strategy", status: res.status, detail: t });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        let buffer = "";
        let toolJson = "";
        const sendEvent = (obj: any) => {
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
                    sendEvent({ type: "progress", bytes: toolJson.length });
                  }
                }
              } catch {
                // ignore malformed line
              }
            }
          }

          let parsed: any = {};
          try {
            parsed = toolJson ? JSON.parse(toolJson) : {};
          } catch (e) {
            console.error("Failed to parse tool json", e, toolJson.slice(0, 500));
            sendEvent({ type: "error", message: "Failed to parse strategy output" });
            controller.close();
            return;
          }

          try {
            const strength = computeStrength(transcript || "", parsed);
            parsed.strength_score = strength.score;
            parsed.strength_breakdown = strength.breakdown;
            parsed.weak_areas = strength.weak_areas;
            parsed.strong_areas = strength.strong_areas;
          } catch (e) {
            console.error("strength scoring failed", e);
          }

          // Tag the strategy with the originating discovery lane so the
          // Strategy page can render the correct labels and sections.
          parsed.strategy_lane = isLane2 ? "service" : "expertise";

          sendEvent({ type: "complete", strategy: parsed });
        } catch (e) {
          console.error("stream error", e);
          try { sendEvent({ type: "error", message: String(e) }); } catch {}
        } finally {
          clearInterval(heartbeat);
          try { reader.releaseLock(); } catch {}
          controller.close();
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