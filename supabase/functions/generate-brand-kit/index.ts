import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Iris, the brand kit writer inside MOXIEMO. A
founder has a real, documented brand strategy inside the platform. Your job is
to distill it into a shareable Brand Kit: something a founder can hand to a
designer, VA, ghostwriter, or new team member and have them speak the brand
correctly within 15 minutes.

You receive a JSON payload with the founder's profile and strategy
foundation. Return ONLY valid JSON matching the schema below. No preamble, no
markdown, no commentary.

ABSOLUTE RULES
1. Evidence-bound. Every field draws on the strategy. If the strategy is thin
   on a field, write the sharpest true thing you can from what is there. Never
   invent an ICP number, a revenue floor, an archetype, or a pillar not
   implied by the strategy.
2. Specific over generic. Banned: "authentic", "innovative", "passionate",
   "customer-focused", "quality-driven", "human", "premium", "world-class".
   Every string names the actual thing this brand does or stands for.
3. Sentence case everywhere except archetype names (e.g. "The Magician") and
   the pillar labels (title case is fine for pillar labels).
4. No em dashes. Use periods and commas.
5. No contractions. Write "you are", "do not", "it is".
6. Short. Every string here is scannable copy. Tag lines. Never a paragraph
   dumped where a phrase belongs.

SCHEMA (return exactly these fields, all required, none null)
{
  "brand_name": "String, the brand or founder-led business name.",
  "archetype": {
    "primary": "String, one archetype like The Magician, The Sage, The Rebel, The Creator, The Hero, The Caregiver, The Explorer, The Everyman, The Lover, The Jester, The Ruler, The Innocent. Choose the one that fits their positioning and stance, not the safest one.",
    "secondary": "String, one supporting archetype from the same list. Should complement, not repeat the primary.",
    "description": "Two sentences, sentence case. First sentence: what the primary archetype promises to transform. Second sentence: how this brand specifically embodies it, referencing the strategy."
  },
  "voice": {
    "attributes": ["Four short attribute labels, each 2 to 4 words, title case. Ground each in the actual voice_attributes on the strategy, tightened into brief."],
    "never_use": ["Three to five short items, title case, describing patterns this brand does not use. Draw from voice guardrails if present, otherwise infer from stated voice."]
  },
  "icp": {
    "revenue_floor": "String, a concrete floor like '$250K+ annually' or '10+ paying customers'. Pull from strategy.ideal_client where possible; if only qualitative, phrase it qualitatively but concretely.",
    "business_type": "String, one short phrase describing the type of business the ICP runs, e.g. 'Expertise-based, founder-led' or 'Product-first SaaS, seed to Series A'.",
    "core_pain": "String, one sentence, sentence case, naming the sharpest pain point from strategy.pain_point.",
    "transformation": "String, one sentence, sentence case, naming the specific transformation this brand promises, drawn from strategy.transformation."
  },
  "key_messages": ["Exactly three key messages. Each a single tight sentence a founder could paste into a bio, pitch, or landing page hero. Sentence case. Each drawn from the strategy's positioning, differentiation, and transformation, in that order if possible."],
  "pillars": {
    "primary": "String, the single lead content pillar. Draw from enhanced_foundation.contentPillars primary if present, otherwise infer from differentiation.",
    "supporting": ["Three to four supporting pillar labels. Title case is fine. Never invent generic ones like 'Industry News'. Each must map to something the founder actually cares about per the strategy."]
  }
}

If a strategy field is empty or missing, write the sharpest true field you can
from what is present, without inventing specifics. If enhanced_foundation is
present, prefer its brandArchetype, contentPillars, and voiceGuidelines over
the flat strategy columns when they conflict.`;

async function callAnthropic(payload: any): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

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
        max_tokens: 4000,
        temperature: 0.4,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const blocks = Array.isArray(data?.content) ? data.content : [];
  return blocks.map((b: any) => (typeof b?.text === "string" ? b.text : "")).join("").trim();
}

function parseModel(text: string): any {
  if (!text) return null;
  let raw = text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(raw.slice(first, last + 1));
  } catch {
    return null;
  }
}

function validateKit(kit: any): string | null {
  if (!kit || typeof kit !== "object") return "not an object";
  const require = (path: string, val: any) => (val == null || (typeof val === "string" && !val.trim()) ? path : null);
  const problems: string[] = [];
  const push = (p: string | null) => { if (p) problems.push(p); };
  push(require("brand_name", kit.brand_name));
  push(require("archetype.primary", kit?.archetype?.primary));
  push(require("archetype.secondary", kit?.archetype?.secondary));
  push(require("archetype.description", kit?.archetype?.description));
  if (!Array.isArray(kit?.voice?.attributes) || kit.voice.attributes.length < 3) problems.push("voice.attributes");
  if (!Array.isArray(kit?.voice?.never_use) || kit.voice.never_use.length < 2) problems.push("voice.never_use");
  push(require("icp.revenue_floor", kit?.icp?.revenue_floor));
  push(require("icp.business_type", kit?.icp?.business_type));
  push(require("icp.core_pain", kit?.icp?.core_pain));
  push(require("icp.transformation", kit?.icp?.transformation));
  if (!Array.isArray(kit?.key_messages) || kit.key_messages.length < 3) problems.push("key_messages");
  push(require("pillars.primary", kit?.pillars?.primary));
  if (!Array.isArray(kit?.pillars?.supporting) || kit.pillars.supporting.length < 2) problems.push("pillars.supporting");
  return problems.length ? problems.join(", ") : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await authed.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: profile }, { data: strategy }] = await Promise.all([
      admin.from("profiles").select("full_name, business_name, email, website_url, brand_colors, brand_fonts, brand_logo_url").eq("id", userId).maybeSingle(),
      admin.from("strategies").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (!strategy) {
      return new Response(JSON.stringify({ error: "no_strategy", detail: "Generate your strategy in Discovery first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      profile: {
        full_name: profile?.full_name ?? null,
        business_name: profile?.business_name ?? null,
        website_url: profile?.website_url ?? null,
      },
      strategy: {
        business_name: strategy.business_name ?? null,
        ideal_client: strategy.ideal_client ?? null,
        pain_point: strategy.pain_point ?? null,
        differentiation: strategy.differentiation ?? null,
        transformation: strategy.transformation ?? null,
        voice_attributes: strategy.voice_attributes ?? null,
        positioning: strategy.positioning ?? null,
        enhanced_foundation: strategy.enhanced_foundation ?? null,
      },
    };

    const raw = await callAnthropic(payload);
    const kit = parseModel(raw);
    const problem = validateKit(kit);
    if (problem) {
      return new Response(JSON.stringify({ error: "invalid_kit", detail: problem, raw }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insErr } = await admin
      .from("brand_kits")
      .insert({
        user_id: userId,
        kit_json: kit,
        strategy_id: strategy.id ?? null,
        model: "claude-sonnet-4-5",
      })
      .select("id, created_at")
      .single();
    if (insErr) {
      return new Response(JSON.stringify({ error: "persist_failed", detail: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      kit_id: inserted.id,
      created_at: inserted.created_at,
      kit,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});