const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategy } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate 6 social media post ideas for this founder.
Ideal client: ${strategy?.ideal_client ?? "(unspecified)"}
Pain point: ${strategy?.pain_point ?? "(unspecified)"}
Content pillars: ${JSON.stringify(strategy?.content_pillars ?? [])}
Voice: ${JSON.stringify(strategy?.voice_attributes ?? [])}

Return ONLY valid JSON array, no prose, no code fences:
[
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" }
]
Exactly 6 items.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Anthropic error", resp.status, text);
      return new Response(JSON.stringify({ error: `Anthropic API error: ${resp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? "[]";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    let ideas: unknown = [];
    try {
      ideas = JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\[[\s\S]*\]/);
      ideas = match ? JSON.parse(match[0]) : [];
    }

    return new Response(JSON.stringify({ ideas }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-post-ideas error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});