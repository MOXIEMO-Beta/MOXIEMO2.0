import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { strategy } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const prompt = `Based on this founder's strategy, generate their competitive positioning.

Positioning: ${strategy?.positioning_statement ?? ""}
Ideal client: ${strategy?.ideal_client ?? ""}
Pain point: ${strategy?.pain_point ?? ""}
Transformation: ${strategy?.transformation ?? ""}
Differentiation: ${strategy?.anti_positioning ?? ""}

Return ONLY valid JSON, no explanation, no markdown:
{
  "antiClient": "1-2 sentences describing who is NOT the ideal client and why",
  "alternatives": "The 2-3 realistic alternatives a prospect might consider instead",
  "whyYouWin": "1-2 sentences on why clients choose this founder over alternatives — be specific"
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
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      notifyAdminCritical(req, { functionName: "generate-competitive-positioning", status: res.status, detail: err });
      throw new Error(`Anthropic error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "{}";

    let result = { antiClient: "", alternatives: "", whyYouWin: "" };
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      console.error("JSON parse error:", text);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-competitive-positioning error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});