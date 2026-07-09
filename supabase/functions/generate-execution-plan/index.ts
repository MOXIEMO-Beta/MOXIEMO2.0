const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIEMO's execution-plan synthesizer. You will be given the user's marketing strategy foundation (positioning, audience, voice, channel, capacity, content pillars, brand archetype, goals).

Generate a complete EXECUTION PLAN that includes:
1. Quarterly content themes (3 quarters, 12 weekly topics each, derived from the user's content pillars)
2. A 30-day rolling content calendar (use today's date as the start date; respect posting frequency)
3. A multi-channel strategy. channelStrategy.primary, .secondary, and .tertiary MUST each be a structured OBJECT (never a plain string) containing: platform (just the channel name like "LinkedIn"), rationale (3-5 short bullet strings), contentStrategy {frequency, types[], tone}, postingSchedule[] {day, time, type, example}, successMetrics {engagementRate, profileViews, connectionRequests, discoveryCallInquiries}, timeAllocation {total, breakdown {contentCreation, engagement, dmConversations}}.
4. Success metrics dashboard (parse the user's success metric into weekly/monthly targets, project lead source breakdown, content performance targets, brand health initial state)
5. A 4-week quick-start action plan (Foundation → Launch → Engagement → Optimization, 4-5 tasks each with realistic estimated times) plus an ongoing weekly routine

Be SPECIFIC and grounded in the foundation. Reference the user's actual ideal client, pillars, archetype, channel — never generic placeholders. Topic angles must progress logically (awareness → understanding → application). Tasks should reference the user's primary channel and positioning.

ACTION PLAN FORMAT — STRICT:
Each of week1, week2, week3, week4 MUST be a structured OBJECT with:
  - "title": a short 2-6 word thematic phrase specific to this founder's strategy (e.g. "Foundation & Strategy Lock-in", "Launch & Initial Engagement", "Building Momentum & Conversations", "Analysis & Optimization"). Do NOT prefix with "Week N", "Task:", or any date range. Do NOT include time estimates like "(Est. 10 hours)" in the title. Time estimates belong on individual task lines.
  - "tasks": an array of task objects.
Never return a week as a plain string, markdown block, or without a title.`;

const SYSTEM_LAUNCH = `You are MOXIEMO's execution-plan synthesizer for a FOUNDER LAUNCHING ONE SPECIFIC OFFER by a HARD TARGET DATE. The plan is a LAUNCH SPRINT, not an evergreen content program.

The target date is the hard guard for the whole plan. You will be told today's date and the target date. Compute the window in weeks and shape everything to land the sell target ON OR BEFORE the target date.

Generate a complete EXECUTION PLAN that includes:
1. quarterlyThemes: use this field to hold LAUNCH PHASES, not calendar quarters. For a roughly 12 week window, produce three phases in this order:
   - Awareness (open the launch, name the problem, seed the offer)
   - Resonance (proof, objections, transformation stories)
   - Invitation and Enrollment (open cart, direct invitations, close on the target date)
   A short optional Post Launch tail phase after the target date is allowed as a fourth entry, but the sprint to the target date is the spine. For very short windows (under 6 weeks) collapse to two phases. For longer windows (over 16 weeks) add a Nurture phase before Invitation. The "quarter" field on each phase MUST be a human phase label with its date range, for example "Awareness (Jul 1 to Jul 28)", NEVER "Q1 2027" or any calendar quarter tag.
   Each phase has weekly contentTopics sized to that phase, not a fixed 12.
   The FINAL phase before or at the target date MUST have its successMetric equal the founder's sell target verbatim ("Sell N unit by Month D, YYYY"). Do NOT file the sell milestone in any phase whose window begins after the target date.
2. contentCalendar: 30 days from today, using the real primary and supporting channels, driving toward the enrollment push, not evergreen education. Weight later days toward invitation and enrollment as the target date approaches.
3. channelStrategy: same object shape as normal (primary, secondary, tertiary), tuned for this launch.
4. successMetrics: primary.name and primary.target should reflect the single sell target (one number, one date). Never emit MRR, "per month", or "New Clients / Month" figures. This is a one time launch.
5. actionPlan: 4 week quick start; week titles reflect launch phases (e.g. "Open the Launch", "Prove the Transformation", "Invite the Warm List", "Close and Enroll").

HARD RULES:
- Never file the sell target in a phase or period that begins after the target date.
- Never use calendar quarter labels ("Q1 2027", "Q4 2026"). Use phase labels with date ranges.
- Never derive or emit a monthly recurring revenue figure anywhere.
- Never use em-dashes. Never use contractions.

ACTION PLAN FORMAT — STRICT:
Each of week1, week2, week3, week4 MUST be a structured OBJECT with:
  - "title": short 2-6 word phase-aligned phrase.
  - "tasks": array of task objects.
Never return a week as a plain string.`;

function todayISO() { return new Date().toISOString().slice(0, 10); }

function longFormDate(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  const d = new Date(s);
  if (!isNaN(d.getTime()) && /\d/.test(s)) return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return s;
}

function extractTargetDate(strategy: any): string | null {
  const raw = strategy?.enhanced_foundation?.successTarget || strategy?.success_definition || "";
  const iso = String(raw).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Long form "September 30, 2026"
  const long = String(raw).match(/([A-Za-z]+ \d{1,2},? \d{4})/);
  if (long) {
    const d = new Date(long[1]);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { strategy } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const ef = strategy?.enhanced_foundation || {};
    const archetypeName = ef.brandArchetype?.name || "—";
    const pillars = (strategy?.content_pillars || []).map((p: any) => typeof p === "string" ? p : (p?.name || "")).filter(Boolean);

    const isLaunch = strategy?.strategy_lane === "offer_gtm";
    const today = todayISO();
    const targetDateIso = isLaunch ? extractTargetDate(strategy) : null;
    let launchContext = "";
    if (isLaunch) {
      const targetLong = targetDateIso ? longFormDate(targetDateIso) : "";
      let weeks = 0;
      if (targetDateIso) {
        const ms = new Date(targetDateIso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
        weeks = Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)));
      }
      launchContext = `\n\nLAUNCH CONTEXT (HARD GUARD):
- Today: ${today}
- Target date: ${targetDateIso || "(unknown, treat successTarget string as canonical)"}${targetLong ? ` (${targetLong})` : ""}
- Window: ${weeks || "unknown"} weeks from today to the target date
- Sell target (verbatim): ${ef.successTarget || strategy?.success_definition || "(missing)"}
- The final launch phase MUST close on or before the target date and its successMetric MUST equal the sell target above verbatim. Never file the sell milestone in any period beginning after the target date. Never use calendar quarter labels.`;
    }

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

Today's date: ${today}${launchContext}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: isLaunch ? SYSTEM_LAUNCH : SYSTEM },
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
                    title: { type: "string", description: "REQUIRED. 2-6 word thematic phrase (e.g. 'Foundation & Strategy Lock-in'). No 'Week N' prefix, no date range, no '(Est. …)' annotation." },
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
    let parsed = args ? JSON.parse(args) : {};

    // Validate action plan week titles. If any are missing/empty, retry once
    // with a reinforced reminder targeting only the action plan.
    const missingTitles = (ap: any): number[] => {
      const bad: number[] = [];
      for (const n of [1, 2, 3, 4]) {
        const w = ap?.[`week${n}`];
        const t = w && typeof w === "object" ? w.title : null;
        if (!t || typeof t !== "string" || !t.trim()) bad.push(n);
      }
      return bad;
    };
    let bad = missingTitles(parsed?.actionPlan);
    if (bad.length > 0) {
      console.error("execution-plan: missing week titles", {
        weeks: bad,
        preview: JSON.stringify(parsed?.actionPlan).slice(0, 500),
      });
      // Targeted retry: regenerate only the action plan section.
      const retryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userBrief },
            { role: "user", content: `RETRY: your previous response returned week(s) ${bad.join(", ")} without a "title" field. Regenerate ONLY the actionPlan. Every week MUST have a short 2-6 word thematic title. Do NOT return weeks as strings.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "save_action_plan",
              description: "Save only the action plan (4 weeks + ongoing routine).",
              parameters: {
                type: "object",
                properties: {
                  actionPlan: {
                    type: "object",
                    properties: {
                      week1: { type: "object", properties: { title: { type: "string" }, tasks: { type: "array", items: { type: "object" } } }, required: ["title", "tasks"] },
                      week2: { type: "object", properties: { title: { type: "string" }, tasks: { type: "array", items: { type: "object" } } }, required: ["title", "tasks"] },
                      week3: { type: "object", properties: { title: { type: "string" }, tasks: { type: "array", items: { type: "object" } } }, required: ["title", "tasks"] },
                      week4: { type: "object", properties: { title: { type: "string" }, tasks: { type: "array", items: { type: "object" } } }, required: ["title", "tasks"] },
                    },
                    required: ["week1", "week2", "week3", "week4"],
                  },
                },
                required: ["actionPlan"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "save_action_plan" } },
        }),
      });
      if (retryRes.ok) {
        const rd = await retryRes.json();
        const rArgs = rd.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        const rParsed = rArgs ? JSON.parse(rArgs) : {};
        if (rParsed?.actionPlan) {
          parsed.actionPlan = { ...(parsed.actionPlan || {}), ...rParsed.actionPlan };
          const stillBad = missingTitles(parsed.actionPlan);
          if (stillBad.length > 0) console.error("execution-plan: retry still missing titles", stillBad);
        }
      } else {
        console.error("execution-plan: retry failed", retryRes.status, await retryRes.text());
      }
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});