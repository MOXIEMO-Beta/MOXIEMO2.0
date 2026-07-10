import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM = `You generate a personalized SMART goal set for ONE founder based
on their own brand strategy. Output ONLY valid JSON, no preamble.

Rules:
- Every number, target, and deadline comes from THIS founder's strategy
  (business_goal, success_definition, enhanced_foundation, transformation,
  ideal_client). Never invent placeholder targets like "500 users" or "$80K
  MRR" unless the strategy itself names them.
- If the strategy is thin on a metric, phrase the card qualitatively but
  concretely, and set target to a short string like "Baseline" or "TBD".
- Sentence case. No em dashes. No contractions.
- Deadlines are short strings like "In 90 days", "Q1 2027", "By June 2027".
- "tracked_by" is "moxiemo" only if MOXIEMO can measure it automatically
  (posts published, engagement rate, alignment score, drafts). Everything
  else (revenue, users, retention, testimonials, calls booked) is "self".

CRITICAL: The North Star resolves to EXACTLY ONE primary measurable metric
with ONE numeric target and ONE unit. Never a compound "X and Y" target.
If the founder's ambition names several outcomes (e.g. "2,000 followers and
500 subscribers"), pick the single most primary outcome for the North Star
and turn every other named outcome into its own SMART card below. The
North Star title MAY be an umbrella sentence, but target_value, target_unit,
and metric_key MUST describe one metric only.

Schema:
{
  "north_star": {
    "title": "one sentence, sentence case, THE headline outcome from the strategy",
    "target_value": "SINGLE-metric target string, e.g. '$80K MRR', '500 users', '2000 followers'. Never compound like '2000 followers and 500 subs'.",
    "target_unit": "short single unit like 'users', 'MRR', 'followers', 'clients' or empty",
    "deadline": "short string like 'By June 2027'",
    "lever": "one sentence explaining what pulls this forward",
    "tracked_by": "self",
    "metric_key": "snake_case key that matches the primary metric, e.g. paying_users, mrr, followers, subscribers, retention_pct. Must correspond to how this founder will report progress."
  },
  "smart_cards": [
    // Exactly 4 cards. Each:
    {
      "category": "one of: Growth, Conversion, Retention, Advocacy, Visibility, Revenue",
      "title": "short SMART goal, max 12 words, sentence case",
      "target": "short target string",
      "deadline": "short deadline string",
      "tracked_by": "self" | "moxiemo",
      "lever": "one sentence lever description",
      "metric_key": "one of paying_users, mrr, retention_pct, testimonials, discovery_calls, or null"
    }
  ],
  "secondary_goals": [
    // 2-4 items. Each:
    { "title": "short label", "value": "short target or baseline text" }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return existing goals if present (idempotent-ish; allow ?force=1 to regen).
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    if (!force) {
      const { data: existing } = await admin
        .from("goal_definitions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing && existing.north_star && Object.keys(existing.north_star).length > 0) {
        return new Response(JSON.stringify({ goals: existing, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: strategy } = await admin
      .from("strategies")
      .select("id, business_goal, success_definition, transformation, ideal_client, positioning_statement, enhanced_foundation, strategy_lane")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!strategy) {
      return new Response(JSON.stringify({ error: "no_strategy" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isOfferGtm = strategy.strategy_lane === "offer_gtm";
    const ef = (strategy.enhanced_foundation ?? {}) as any;
    const payload = {
      business_goal: strategy.business_goal ?? null,
      success_definition: strategy.success_definition ?? null,
      transformation: strategy.transformation ?? null,
      ideal_client: strategy.ideal_client ?? null,
      positioning_statement: strategy.positioning_statement ?? null,
      enhanced_foundation: strategy.enhanced_foundation ?? null,
      strategy_lane: strategy.strategy_lane ?? null,
      // Explicit surfacing for the Lane 3 (offer launch) branch: the prompt
      // must produce a launch-shaped goal set, not brand-shaped defaults.
      offer_gtm: isOfferGtm ? {
        offerPositioning: ef.offerPositioning ?? null,
        firstMove: ef.firstMove ?? null,
        launchMessaging: ef.launchMessaging ?? null,
        channelPlan: ef.channelPlan ?? null,
      } : null,
    };

    const laneGuidance = isOfferGtm
      ? `\n\nLANE OVERRIDE, strategy_lane = "offer_gtm":\n` +
        `This founder is running a specific offer launch, not building brand equity.\n` +
        `- North Star MUST be a single sell-N-by-date outcome for THIS offer, e.g.\n` +
        `  "Sell 15 retreat seats by September 30, 2026". Pull the number, unit and\n` +
        `  deadline from offer_gtm.offerPositioning / offer_gtm.firstMove /\n` +
        `  business_goal. metric_key should reflect the offer unit (seats_sold,\n` +
        `  deposits, spots_filled, revenue). Never use followers, subscribers, or\n` +
        `  brand-shaped units here.\n` +
        `- The 4 SMART cards MUST be launch-shaped: sales booked, deposits taken,\n` +
        `  discovery calls held, warm-list conversations, conversion rate on the\n` +
        `  launch channel, revenue against target. Never brand-shaped defaults\n` +
        `  like "build authority", "grow following", or "post consistency" unless\n` +
        `  the strategy itself names them as the launch mechanism.\n` +
        `- tracked_by should mostly be "self" for offer launches (revenue, seats,\n` +
        `  deposits, calls) unless the metric is content emitted by MOXIEMO.\n`
      : "";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        system: SYSTEM + laneGuidance,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: "claude_error", detail: txt.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    let parsed: any = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      return new Response(JSON.stringify({ error: "parse_failed", raw: text.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const north_star = parsed?.north_star ?? {};
    const smart_cards = Array.isArray(parsed?.smart_cards) ? parsed.smart_cards.slice(0, 4) : [];
    const secondary_goals = Array.isArray(parsed?.secondary_goals) ? parsed.secondary_goals.slice(0, 4) : [];

    const { data: saved, error: upErr } = await admin
      .from("goal_definitions")
      .upsert({
        user_id: user.id,
        strategy_id: strategy.id ?? null,
        north_star,
        smart_cards,
        secondary_goals,
        source_model: "claude-sonnet-4-5-20250929",
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (upErr) {
      return new Response(JSON.stringify({ error: "persist_failed", detail: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ goals: saved, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});