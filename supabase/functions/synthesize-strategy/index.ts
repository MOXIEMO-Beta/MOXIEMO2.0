const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE's strategy synthesizer. Read a discovery conversation transcript and extract a complete marketing strategy.
You will save BOTH a base strategy AND an expanded "enhanced_foundation" object that deepens the output (Sprint 1: positioning breakdown, brand archetype, core values, competitive positioning, detailed voice guidelines).
Be specific and grounded in the transcript — never generic. Every example, value, and word should feel derived from what the user actually said.`;

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
    const ratio = breakdown[k] / labels[k].max;
    const item = { key: k, label: labels[k].label, section: labels[k].section, points: breakdown[k], max: labels[k].max, refineKey: labels[k].refineKey };
    if (ratio >= 0.85) strong.push(item);
    else if (ratio < 0.6) weak.push(item);
  }
  // Sort weak by widest gap first
  weak.sort((a, b) => (a.points / a.max) - (b.points / b.max));

  return { score, breakdown, weak_areas: weak, strong_areas: strong };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { transcript, revenueRange, biggestChallenge } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    let userContent = "Discovery transcript:\n\n" + transcript;
    if (revenueRange) userContent += `\n\nFounder's revenue stage: ${revenueRange}`;
    if (biggestChallenge) userContent += `\nBiggest marketing challenge: ${biggestChallenge}`;

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
        system: SYSTEM,
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