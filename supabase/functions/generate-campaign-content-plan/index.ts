import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const {
      campaignName = "",
      campaignType = "",
      campaignGoal = "",
      selectedPillars = [],
      startDate = "",
      endDate = "",
      voiceAttributes = "",
    } = await req.json();

    const system =
      "You are a marketing strategist for a founder-led business. Generate a structured 4-week campaign plan based on the inputs provided. Return valid JSON only. No markdown, no explanation, no preamble.";

    const userPrompt = `Generate a 4-week campaign plan with the following details:
- Campaign name: ${campaignName}
- Campaign type: ${campaignType}
- Goal: ${campaignGoal}
- Content pillars: ${(Array.isArray(selectedPillars) ? selectedPillars : []).join(", ")}
- Start date: ${startDate}
- End date: ${endDate}
- Brand voice: ${voiceAttributes || "Founder-led, warm, direct, strategic."}

Return this exact JSON structure:
{
  "campaignSummary": "One sentence describing the campaign strategy",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme title",
      "focus": "What this week achieves",
      "tasks": [
        {
          "day": "Monday",
          "action": "Specific action to take",
          "platform": "LinkedIn / Email / Instagram",
          "contentNote": "Brief note on what to create"
        }
      ]
    }
  ],
  "successMetrics": [
    "Metric 1",
    "Metric 2",
    "Metric 3"
  ]
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Anthropic error: ${res.status} ${errText}`);
    }
    const data = await res.json();
    const text: string = data.content?.[0]?.text?.trim() ?? "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    let plan: any = null;
    try {
      plan = JSON.parse(cleaned);
    } catch (e) {
      console.error("plan parse failure", e, cleaned);
      throw new Error("Failed to parse plan JSON");
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-campaign-content-plan error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});