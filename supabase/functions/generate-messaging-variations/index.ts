import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
  }

  try {
    const { strategy } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const prompt = `Based on this founder's strategy, generate 3 messaging variations.

Positioning statement: ${strategy?.positioning_statement ?? ""}
Ideal client: ${strategy?.ideal_client ?? ""}
Pain point: ${strategy?.pain_point ?? ""}
Transformation: ${strategy?.transformation ?? ""}
Voice attributes: ${JSON.stringify(strategy?.voice_attributes ?? [])}
Anti-positioning: ${strategy?.anti_positioning ?? ""}

Return ONLY valid JSON, no explanation, no markdown:
{
  "oneliner": "One punchy sentence under 15 words that captures what you do and for whom",
  "short": "Under 160 characters for social bios, specific and compelling",
  "elevator": "3-4 natural sentences for networking introductions, conversational not salesy"
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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      notifyAdminCritical(req, { functionName: "generate-messaging-variations", status: res.status, detail: err });
      throw new Error(`Anthropic error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "{}";

    let variations = { oneliner: "", short: "", elevator: "" };
    try {
      variations = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      console.error("JSON parse error:", text);
    }

    return new Response(JSON.stringify(variations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-messaging-variations error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});