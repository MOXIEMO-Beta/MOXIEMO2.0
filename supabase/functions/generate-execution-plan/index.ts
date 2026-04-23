const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE's execution-plan synthesizer. You will be given the user's marketing strategy foundation (positioning, audience, voice, channel, capacity, content pillars, brand archetype, goals).

Generate a complete EXECUTION PLAN that includes:
1. Quarterly content themes (3 quarters, 12 weekly topics each, derived from the user's content pillars)
2. A 30-day rolling content calendar (use today's date as the start date; respect posting frequency)
3. A multi-channel strategy (primary + 1-2 secondary channels with rationale, schedule, time allocation, target metrics)
4. Success metrics dashboard (parse the user's success metric into weekly/monthly targets, project lead source breakdown, content performance targets, brand health initial state)
5. A 4-week quick-start action plan (Foundation → Launch → Engagement → Optimization, 4-5 tasks each with realistic estimated times) plus an ongoing weekly routine

Be SPECIFIC and grounded in the foundation. Reference the user's actual ideal client, pillars, archetype, channel — never generic placeholders. Topic angles must progress logically (awareness → understanding → application). Tasks should reference the user's primary channel and positioning.`;

function todayISO() { return new Date().toISOString().slice(0, 10); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { strategy } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const ef = strategy?.enhanced_foundation || {};
    const archetypeName = ef.brandArchetype?.name || "—";
    const pillars = (strategy?.content_pillars || []).map((p: any) => typeof p === "string" ? p : (p?.name || "")).filter(Boolean);

    const userBrief = `STRATEGY FOUNDATION

Positioning: ${strategy?.positioning_statement || "—"}
Ideal client: ${strategy?.ideal_client || "—"}
Pain point: ${strategy?.pain_point || "—"}
Transformation: ${strategy?.transformation || "—"}
Voice attributes: ${(strategy?.voice_attributes || []).join(", ") || "—"}
Brand archetype: ${archetypeName}
Content pillars: ${pillars.join(" | ") || "—"}
Primary channel: ${strategy?.primary_channel || "—"}
Posting frequency: ${strategy?.posting_frequency || "—"}
Time capacity: ${strategy?.time_capacity || "—"}
Success metric: ${strategy?.success_definition || "—"}
Business goal: ${strategy?.business_goal || "—"}

Today's date: ${todayISO()}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userBrief },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_execution_plan",
            description: "Save the synthesized execution plan: quarterly themes, content calendar, channel strategy, success metrics, action plan.",
            parameters: {
              type: "object",
              properties: {
                quarterlyThemes: {
                  type: "array",
                  description: "Exactly 3 quarterly themes, one per content pillar (cycle if fewer pillars).",
                  items: {
                    type: "object",
                    properties: {
                      quarter: { type: "string", description: "e.g. Q2 2026" },
                      theme: { type: "string" },
                      overview: { type: "string" },
                      strategicRationale: { type: "string" },
                      contentTopics: {
                        type: "array",
                        description: "Exactly 12 weekly topics, progressing awareness → understanding → application.",
                        items: {
                          type: "object",
                          properties: {
                            week: { type: "number" },
                            topic: { type: "string" },
                            angle: { type: "string" },
                            contentType: { type: "string" },
                            keyMessage: { type: "string" },
                          },
                          required: ["week", "topic", "angle", "contentType", "keyMessage"],
                        },
                      },
                      contentMix: {
                        type: "object",
                        properties: {
                          linkedin: { type: "string" },
                          email: { type: "string" },
                          podcast: { type: "string" },
                        },
                      },
                      successMetric: { type: "string" },
                      cta: { type: "string" },
                    },
                    required: ["quarter", "theme", "overview", "strategicRationale", "contentTopics", "successMetric"],
                  },
                },
                contentCalendar: {
                  type: "array",
                  description: "30 days of scheduled content from today, respecting posting frequency.",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "YYYY-MM-DD" },
                      day: { type: "string" },
                      platform: { type: "string" },
                      contentType: { type: "string" },
                      topic: { type: "string" },
                      theme: { type: "string" },
                      week: { type: "number" },
                      status: { type: "string", description: "draft_ready or needs_generation" },
                      estimatedLength: { type: "string" },
                    },
                    required: ["date", "day", "platform", "contentType", "topic", "week", "status"],
                  },
                },
                channelStrategy: {
                  type: "object",
                  description: "Each of primary/secondary/tertiary MUST be a rich object (not a string) with platform, rationale (3-5 bullets), contentStrategy, postingSchedule, successMetrics, timeAllocation.",
                  properties: {
                    primary: {
                      type: "object",
                      properties: {
                        platform: { type: "string" },
                        rationale: { type: "array", items: { type: "string" } },
                        contentStrategy: {
                          type: "object",
                          properties: {
                            frequency: { type: "string" },
                            types: { type: "array", items: { type: "string" } },
                            tone: { type: "string" },
                          },
                        },
                        postingSchedule: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "string" },
                              time: { type: "string" },
                              type: { type: "string" },
                              example: { type: "string" },
                            },
                            required: ["day", "type"],
                          },
                        },
                        successMetrics: {
                          type: "object",
                          properties: {
                            engagementRate: { type: "string" },
                            profileViews: { type: "string" },
                            connectionRequests: { type: "string" },
                            discoveryCallInquiries: { type: "string" },
                          },
                        },
                        timeAllocation: {
                          type: "object",
                          properties: {
                            total: { type: "string" },
                            breakdown: {
                              type: "object",
                              properties: {
                                contentCreation: { type: "string" },
                                engagement: { type: "string" },
                                dmConversations: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                      required: ["platform", "rationale"],
                    },
                    secondary: {
                      type: "object",
                      properties: {
                        platform: { type: "string" },
                        rationale: { type: "array", items: { type: "string" } },
                        contentStrategy: {
                          type: "object",
                          properties: {
                            frequency: { type: "string" },
                            types: { type: "array", items: { type: "string" } },
                            tone: { type: "string" },
                          },
                        },
                        postingSchedule: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "string" },
                              time: { type: "string" },
                              type: { type: "string" },
                              example: { type: "string" },
                            },
                            required: ["day", "type"],
                          },
                        },
                        successMetrics: {
                          type: "object",
                          properties: {
                            engagementRate: { type: "string" },
                            profileViews: { type: "string" },
                            connectionRequests: { type: "string" },
                            discoveryCallInquiries: { type: "string" },
                          },
                        },
                        timeAllocation: {
                          type: "object",
                          properties: {
                            total: { type: "string" },
                            breakdown: {
                              type: "object",
                              properties: {
                                contentCreation: { type: "string" },
                                engagement: { type: "string" },
                                dmConversations: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                      required: ["platform", "rationale"],
                    },
                    tertiary: {
                      type: "object",
                      properties: {
                        platform: { type: "string" },
                        rationale: { type: "array", items: { type: "string" } },
                        contentStrategy: {
                          type: "object",
                          properties: {
                            frequency: { type: "string" },
                            types: { type: "array", items: { type: "string" } },
                            tone: { type: "string" },
                          },
                        },
                        postingSchedule: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "string" },
                              time: { type: "string" },
                              type: { type: "string" },
                              example: { type: "string" },
                            },
                            required: ["day", "type"],
                          },
                        },
                        successMetrics: {
                          type: "object",
                          properties: {
                            engagementRate: { type: "string" },
                            profileViews: { type: "string" },
                            connectionRequests: { type: "string" },
                            discoveryCallInquiries: { type: "string" },
                          },
                        },
                        timeAllocation: {
                          type: "object",
                          properties: {
                            total: { type: "string" },
                            breakdown: {
                              type: "object",
                              properties: {
                                contentCreation: { type: "string" },
                                engagement: { type: "string" },
                                dmConversations: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                      required: ["platform", "rationale"],
                    },
                    totalTimeWithMOXIE: {
                      type: "object",
                      properties: {
                        before: { type: "string" },
                        after: { type: "string" },
                        freed: { type: "string" },
                        useFreedTimeFor: { type: "string" },
                      },
                    },
                  },
                  required: ["primary"],
                },
                successMetrics: {
                  type: "object",
                  properties: {
                    primary: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        target: {
                          type: "object",
                          properties: { weekly: { type: "string" }, monthly: { type: "string" } },
                        },
                        leadSources: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              source: { type: "string" },
                              percentage: { type: "number" },
                              perWeek: { type: "string" },
                            },
                            required: ["source", "percentage"],
                          },
                        },
                        qualification: {
                          type: "object",
                          properties: {
                            highFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
                            mediumFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
                            lowFit: { type: "object", properties: { percentage: { type: "number" }, definition: { type: "string" } } },
                          },
                        },
                      },
                      required: ["name", "target"],
                    },
                    contentPerformance: {
                      type: "object",
                      properties: {
                        linkedin: {
                          type: "object",
                          properties: { engagementTarget: { type: "string" }, profileViewsTarget: { type: "string" }, postsPerWeek: { type: "string" } },
                        },
                        email: {
                          type: "object",
                          properties: { openRateTarget: { type: "string" }, clickRateTarget: { type: "string" }, sendsPerMonth: { type: "string" } },
                        },
                      },
                    },
                    businessGoals: {
                      type: "object",
                      properties: {
                        revenueGrowth: { type: "string" },
                        scalingPlan: { type: "string" },
                      },
                    },
                    brandHealth: {
                      type: "object",
                      properties: {
                        voiceConsistencyScore: { type: "number" },
                        archetypeAlignment: { type: "number" },
                        notes: { type: "string" },
                      },
                    },
                  },
                  required: ["primary"],
                },
                actionPlan: {
                  type: "object",
                  properties: {
                    week1: { $ref: "#/$defs/week" },
                    week2: { $ref: "#/$defs/week" },
                    week3: { $ref: "#/$defs/week" },
                    week4: { $ref: "#/$defs/week" },
                    ongoingRoutine: {
                      type: "object",
                      properties: {
                        daily: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
                        weekly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
                        biweekly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
                        monthly: { type: "object", properties: { task: { type: "string" }, time: { type: "string" } } },
                        totalTimePerWeek: { type: "string" },
                        comparison: { type: "string" },
                      },
                    },
                  },
                  required: ["week1", "week2", "week3", "week4"],
                },
              },
              required: ["quarterlyThemes", "contentCalendar", "channelStrategy", "successMetrics", "actionPlan"],
              $defs: {
                channel: {
                  type: "object",
                  properties: {
                    platform: { type: "string" },
                    rationale: { type: "array", items: { type: "string" } },
                    contentStrategy: {
                      type: "object",
                      properties: {
                        frequency: { type: "string" },
                        types: { type: "array", items: { type: "string" } },
                        tone: { type: "string" },
                      },
                    },
                    postingSchedule: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day: { type: "string" },
                          time: { type: "string" },
                          type: { type: "string" },
                          example: { type: "string" },
                        },
                        required: ["day", "type"],
                      },
                    },
                    successMetrics: {
                      type: "object",
                      properties: {
                        engagementRate: { type: "string" },
                        profileViews: { type: "string" },
                        connectionRequests: { type: "string" },
                        discoveryCallInquiries: { type: "string" },
                      },
                    },
                    timeAllocation: {
                      type: "object",
                      properties: {
                        total: { type: "string" },
                        breakdown: {
                          type: "object",
                          properties: {
                            contentCreation: { type: "string" },
                            engagement: { type: "string" },
                            dmConversations: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                  required: ["platform", "rationale"],
                },
                week: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          task: { type: "string" },
                          estimatedTime: { type: "string" },
                          linkedContent: { type: "string" },
                        },
                        required: ["id", "task", "estimatedTime"],
                      },
                    },
                  },
                  required: ["title", "tasks"],
                },
              },
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_execution_plan" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("execution-plan error", res.status, t);
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached, try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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