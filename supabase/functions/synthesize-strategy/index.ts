const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE's strategy synthesizer. Read a discovery conversation transcript and extract a complete marketing strategy.
You will save BOTH a base strategy AND an expanded "enhanced_foundation" object that deepens the output (Sprint 1: positioning breakdown, brand archetype, core values, competitive positioning, detailed voice guidelines).
Be specific and grounded in the transcript — never generic. Every example, value, and word should feel derived from what the user actually said.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { transcript } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "Discovery transcript:\n\n" + transcript },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_strategy",
            description: "Save the synthesized marketing strategy.",
            parameters: {
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
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_strategy" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Synth error", res.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});