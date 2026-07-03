import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { angle, pillar, platform, answers, questions } = await req.json();
    if (!angle || !platform || !answers) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: strategy } = await supabase
      .from("strategies")
      .select("enhanced_foundation, voice_attributes, positioning_statement, ideal_client")
      .eq("user_id", user.id)
      .maybeSingle();

    const answersFormatted = Object.entries(answers as Record<string, string>)
      .map(([i, a]) => {
        const q = Array.isArray(questions) ? questions[Number(i)]?.label : null;
        return q ? `Q: ${q}\nA: ${a}` : `- ${a}`;
      })
      .join("\n\n");

    const voice = (strategy as any)?.enhanced_foundation?.voice
      ?? (strategy as any)?.voice_attributes
      ?? "authentic, direct, founder-led";

    const prompt = `You are writing a social post for a founder, incorporating a real story they
just told you. Use ONLY the facts they provided below — do not invent any
additional details, names, numbers, or outcomes beyond what's given.

Original suggested angle: "${angle}"
Pillar: ${pillar ?? "(unspecified)"}
Platform: ${platform}

The founder's real answers:
${answersFormatted}

Brand voice: ${JSON.stringify(voice)}

Write a complete, polished post that weaves these real facts into a compelling
narrative in the founder's voice. Follow platform length/format conventions
for ${platform}. No em-dashes. No filler phrases. Return the post text only —
no preamble, no quotes, no explanation.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1200,
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
    const post: string = (json?.content?.[0]?.text ?? "").trim();

    try {
      const { error: consumeError } = await supabase.rpc("consume_generation", {
        p_platform: `social:${platform}`,
        p_campaign_id: null,
        p_preview: post.slice(0, 100),
      });
      if (consumeError) console.warn("consume_generation failed:", consumeError.message);
    } catch (e) {
      console.warn("consume_generation threw:", e);
    }

    return new Response(JSON.stringify({ post }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});