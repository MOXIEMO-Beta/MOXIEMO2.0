const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE, helping a coach/consultant refine ONE specific part of their marketing strategy.
You will receive: the section being refined, the current value, the user's clarifying input, and the broader strategy context.
Return a single, sharper, more specific replacement value.
RULES:
- Stay grounded in the user's clarifying input — never invent details.
- Match the existing voice when present.
- For positioning statements: use a "I help [who] go from [before] to [after] by [how]" structure when natural.
- Keep length appropriate to the field (statements ≤ 30 words; pillars ≤ 1 sentence).
- Return ONLY the new value via the function call — no preamble.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { section, currentValue, userInput, context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `SECTION: ${section}
CURRENT VALUE:
${currentValue || "(empty)"}

USER REFINEMENT INPUT:
${userInput}

STRATEGY CONTEXT (for tone & alignment):
${JSON.stringify(context || {}, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_refinement",
            description: "Return the refined value and a 1-sentence rationale.",
            parameters: {
              type: "object",
              properties: {
                refined_value: { type: "string", description: "The new, sharper value for this section." },
                rationale: { type: "string", description: "One sentence: why this is stronger." },
              },
              required: ["refined_value", "rationale"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_refinement" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("refine-section AI error", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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