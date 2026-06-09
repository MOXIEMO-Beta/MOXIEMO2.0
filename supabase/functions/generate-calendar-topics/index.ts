const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIEMO, an AI Chief Marketing Officer. You write specific, compelling content post titles that sound like real posts a founder would write — never generic category labels, never numbered placeholders.`;

type Row = {
  pillar?: string;
  format?: string;
  channel?: string;
  date?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];
    const voice: string[] = Array.isArray(body?.voice) ? body.voice : [];
    const icp: string = body?.icp ?? "";
    const pain: string = body?.pain ?? "";

    if (!rows.length) {
      return new Response(JSON.stringify({ titles: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numbered = rows
      .map((r, i) => `${i + 1}. pillar="${r.pillar ?? ""}" | format="${r.format ?? ""}" | channel="${r.channel ?? ""}" | date="${r.date ?? ""}"`)
      .join("\n");

    const prompt = `BRAND CONTEXT
Voice attributes: ${voice.join(", ") || "(not set)"}
Ideal client: ${icp || "(not set)"}
Pain point: ${pain || "(not set)"}

TASK
For each numbered row below, generate ONE specific, compelling post topic title (max 12 words). It must sound like a real post the founder would publish — not a category label, not a numbered placeholder. Tie the title to the pillar, format, and channel for that row.

ROWS (${rows.length} total):
${numbered}

Return ONLY valid JSON, no prose, no code fences:
{ "titles": ["title for row 1", "title for row 2", ...] }

The titles array MUST have exactly ${rows.length} entries, in the same order.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Anthropic error", resp.status, text);
      return new Response(JSON.stringify({ error: `Anthropic API error: ${resp.status}` }), {
        status: resp.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? "{}";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    let parsed: { titles?: string[] } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    const titles = Array.isArray(parsed.titles) ? parsed.titles.map((t) => String(t || "")) : [];

    return new Response(JSON.stringify({ titles }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-calendar-topics error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});