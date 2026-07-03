import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await supabase.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.refresh);

    if (!forceRefresh) {
      const { data: cache } = await supabase
        .from("pillar_feed_cache")
        .select("angles_json, generated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cache?.angles_json) {
        const ageMs = Date.now() - new Date(cache.generated_at).getTime();
        if (ageMs < 7 * 24 * 60 * 60 * 1000) {
          return new Response(JSON.stringify({ angles: cache.angles_json, cached: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: strategy } = await supabase
      .from("strategies")
      .select("ideal_client, content_pillars, enhanced_foundation")
      .eq("user_id", user.id)
      .maybeSingle();

    const ef = (strategy?.enhanced_foundation ?? {}) as any;
    const pillarsRaw = ef?.contentPillars ?? strategy?.content_pillars ?? [];
    const pillars: string[] = (Array.isArray(pillarsRaw) ? pillarsRaw : [])
      .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
      .filter(Boolean)
      .slice(0, 5);
    if (pillars.length === 0) {
      return new Response(JSON.stringify({ error: "no_pillars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const icp = ef?.idealClient ?? strategy?.ideal_client ?? "small business owners";

    const today = new Date().toISOString().split("T")[0];
    const prompt = `You are a content strategist. Suggest one specific, timely content angle for each pillar below.
Each angle must be 1-2 sentences, concrete, and relevant to the current date.
No generic advice. Reference the ICP and current business moment where possible.

For each suggested angle, determine whether it depends on a specific, true
anecdote (a client story, a prospect interaction, a recent update, "a case
where...") that only the founder knows the details of — as opposed to a
purely informational or positioning angle that can stand on its own.

If the angle IS anecdote-dependent, set "anecdoteRequired": true and generate
3-4 SPECIFIC guided questions that would elicit the real details needed to
write this exact post. Questions must be tailored to this specific angle —
not a generic template. Each question needs a short "label" and an optional
"hint" giving light guidance on what kind of answer is useful.

If the angle does NOT depend on a specific anecdote, set "anecdoteRequired":
false and omit guidedQuestions entirely.

Pillars: ${JSON.stringify(pillars)}
ICP summary: ${icp}
Current date: ${today}

Return JSON only, no other text:
{
  "angles": [
    {
      "pillar": "exact pillar name",
      "angle": "1-2 sentence suggested angle",
      "anecdoteRequired": true,
      "guidedQuestions": [
        { "label": "question text", "hint": "optional guidance" }
      ]
    }
  ]
}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: "claude_error", detail: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    let parsed: any = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      parsed = { angles: pillars.map((p) => ({ pillar: p, angle: "" })) };
    }

    await supabase.from("pillar_feed_cache").upsert(
      { user_id: user.id, angles_json: parsed, generated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    try {
      const { error: consumeError } = await supabase.rpc("consume_generation", {
        p_platform: "pillar_feed",
        p_campaign_id: null,
        p_preview: "Pillar Feed angles refresh",
      });
      if (consumeError) console.warn("consume_generation failed:", consumeError.message);
    } catch (e) {
      console.warn("consume_generation threw:", e);
    }

    return new Response(JSON.stringify({ angles: parsed, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});