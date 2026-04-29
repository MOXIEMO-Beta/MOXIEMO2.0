const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE, an AI Chief Marketing Officer generating content for a founder.`;

function buildPrompt(opts: {
  topic: string;
  platform: string;
  contentType: string;
  strategy: any;
}) {
  const s = opts.strategy ?? {};
  const voice = Array.isArray(s.voice_attributes)
    ? s.voice_attributes.join(", ")
    : (s.voice_attributes ?? "");
  const pillars = Array.isArray(s.content_pillars)
    ? s.content_pillars.join(", ")
    : (s.content_pillars ?? "");

  return `BRAND STRATEGY CONTEXT:
Positioning: ${s.positioning_statement ?? "(not set)"}
Ideal client: ${s.ideal_client ?? "(not set)"}
Pain point: ${s.pain_point ?? "(not set)"}
Voice attributes: ${voice || "(not set)"}
Anti-positioning (never sound like): ${s.anti_positioning ?? "(not set)"}
Primary channel: ${s.primary_channel ?? "(not set)"}
Content pillars: ${pillars || "(not set)"}

Generate a ${opts.platform} ${opts.contentType} post about: ${opts.topic}

Requirements:
- Match the voice attributes exactly
- Address the ideal client's pain point naturally
- Never use the anti-positioning language
- Format for ${opts.platform} (LinkedIn: 1200-1800 chars, line breaks, hook under 60 chars)
- End with a specific engagement question
- Do not include hashtags unless asked

Return only the post copy. No preamble.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { topic, platform, contentType, strategy } = await req.json();
    if (!topic || !platform || !contentType) {
      return new Response(JSON.stringify({ error: "topic, platform, contentType required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const prompt = buildPrompt({ topic, platform, contentType, strategy });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (res.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await res.text();
      console.error("generate-content AI error", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const body = data.content?.[0]?.text?.trim() ?? "";
    return new Response(JSON.stringify({ body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});