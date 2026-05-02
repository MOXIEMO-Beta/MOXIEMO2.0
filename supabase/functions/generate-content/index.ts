const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE, an AI Chief Marketing Officer generating content for an expertise-based founder.

Your user is a founder selling their expertise — they may be a coach, consultant, fractional executive, agency owner, solopreneur, or business owner. They earn $600K–2M revenue and struggle with tool fragmentation and unclear marketing strategy.

Your job is to generate content that:
- Sounds exactly like them (match their voice attributes)
- Speaks directly to their ideal client's pain points
- Reflects their unique positioning and methodology
- Never uses corporate jargon or empty buzzwords
- Always ends with an engagement-driving question

You are not a generic AI tool. You are their dedicated CMO who knows their business deeply.`;

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
    const { topic, platform, contentType, strategy, mode, text, existing, instruction } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const callClaude = async (system: string, userPrompt: string, maxTokens = 1024) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      return res;
    };

    if (mode === "hashtags") {
      const snippet = String(text ?? "").slice(0, 200);
      const res = await callClaude(
        "You generate concise, relevant LinkedIn hashtags.",
        `Generate 4-6 relevant LinkedIn hashtags for this post. Return only the hashtags, space-separated, no explanation: ${snippet}`,
        200,
      );
      if (!res.ok) {
        const t = await res.text();
        console.error("hashtags AI error", res.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const hashtags = data.content?.[0]?.text?.trim() ?? "";
      return new Response(JSON.stringify({ hashtags }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "refine") {
      if (!existing || !instruction) {
        return new Response(JSON.stringify({ error: "existing and instruction required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refinePrompt = `Here is a piece of ${platform ?? "content"} (${contentType ?? "post"}):\n\n"""\n${existing}\n"""\n\nApply this refinement instruction from the user:\n"${instruction}"\n\nReturn ONLY the revised content. No preamble. Match the same format as the original (plain text or HTML).`;
      const res = await callClaude(SYSTEM, refinePrompt, 1500);
      if (!res.ok) {
        if (res.status === 429)
          return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        const t = await res.text();
        console.error("refine AI error", res.status, t);
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
    }

    if (!topic || !platform || !contentType) {
      return new Response(JSON.stringify({ error: "topic, platform, contentType required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt({ topic, platform, contentType, strategy });

    const res = await callClaude(SYSTEM, prompt, 1024);

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