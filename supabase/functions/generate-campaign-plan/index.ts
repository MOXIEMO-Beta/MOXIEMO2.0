import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { campaign, strategy } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const start = campaign?.start_date ? new Date(campaign.start_date) : new Date();
    const end = campaign?.end_date ? new Date(campaign.end_date) : new Date();
    const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));

    const prompt = `Generate a ${weeks}-week content plan for this marketing campaign.

CAMPAIGN:
Name: ${campaign?.name ?? ""}
Theme: ${campaign?.theme ?? ""}
Goal: ${campaign?.goals ?? ""}
Channels: ${(campaign?.channels ?? []).join(", ")}

STRATEGY:
Positioning: ${strategy?.positioning_statement ?? ""}
Ideal client: ${strategy?.ideal_client ?? ""}
Pain point: ${strategy?.pain_point ?? ""}
Content pillars: ${JSON.stringify(strategy?.content_pillars ?? [])}
Voice: ${JSON.stringify(strategy?.voice_attributes ?? [])}

For each week provide topic ideas per channel.
Return ONLY valid JSON, no markdown:
{
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme/focus",
      "linkedin": "LinkedIn post topic idea",
      "email": "Email newsletter topic",
      "instagram": "Instagram content idea",
      "facebook": "Facebook content idea",
      "notes": "Strategic note for this week"
    }
  ]
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "{}";
    let result: any = { weeks: [] };
    try { result = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { console.error("parse", text); }

    // attach weekOf dates
    if (Array.isArray(result.weeks)) {
      result.weeks = result.weeks.map((w: any, i: number) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i * 7);
        return { ...w, weekNumber: w.weekNumber ?? i + 1, weekOf: d.toISOString().slice(0, 10) };
      });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-campaign-plan error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});