const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE's strategy synthesizer. Read a discovery conversation transcript and extract a complete marketing strategy.
Return ONLY a JSON object (no prose) matching this schema:
{
  "positioning_statement": string (1-2 sentences, sharp and specific),
  "ideal_client": string,
  "pain_point": string,
  "transformation": string,
  "voice_attributes": string[] (4-6 short adjectives like "direct", "warm", "no-fluff"),
  "anti_positioning": string,
  "content_pillars": [{"name": string, "description": string}] (3-5 pillars),
  "primary_channel": string,
  "posting_frequency": string,
  "success_definition": string,
  "business_goal": string,
  "time_capacity": string
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { transcript } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: "Discovery transcript:\n\n" + transcript },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_strategy",
            description: "Save the synthesized marketing strategy.",
            parameters: {
              type: "object",
              properties: {
                positioning_statement: { type: "string" },
                ideal_client: { type: "string" },
                pain_point: { type: "string" },
                transformation: { type: "string" },
                voice_attributes: { type: "array", items: { type: "string" } },
                anti_positioning: { type: "string" },
                content_pillars: {
                  type: "array",
                  items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name", "description"] },
                },
                primary_channel: { type: "string" },
                posting_frequency: { type: "string" },
                success_definition: { type: "string" },
                business_goal: { type: "string" },
                time_capacity: { type: "string" },
              },
              required: ["positioning_statement", "ideal_client", "pain_point", "transformation", "voice_attributes", "content_pillars", "primary_channel", "success_definition"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_strategy" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Synth error", res.status, t);
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