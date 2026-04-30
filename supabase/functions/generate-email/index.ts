import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { data: strategy } = await supabase
      .from("strategies")
      .select("positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: latestContent } = await supabase
      .from("content_items")
      .select("topic")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestTopic = latestContent?.topic;
    const prompt = `You are MOXIE, an AI Chief Marketing Officer generating a complete email newsletter for a founder.

FOUNDER'S STRATEGY:
Positioning: ${strategy?.positioning_statement ?? "Expert founder helping clients achieve transformation"}
Ideal client: ${strategy?.ideal_client ?? "B2B founders"}
Pain point: ${strategy?.pain_point ?? "unclear messaging and marketing overwhelm"}
Voice attributes: ${JSON.stringify(strategy?.voice_attributes ?? ["authoritative", "empathetic", "direct"])}
Anti-positioning (never sound like): ${strategy?.anti_positioning ?? "corporate jargon"}
Latest content topic: ${latestTopic ?? "founder branding and positioning"}

Generate a complete weekly newsletter email. Return ONLY valid JSON, no other text:
{
  "subject": "A curiosity-driven subject line under 50 characters",
  "body": "Full HTML email body — 400-600 words. Use <h2> for section headers, <p> for paragraphs. Match the voice attributes exactly. Address the ideal client's pain point. End with a thought-provoking question. Include a coral CTA button at the bottom: <a href='[CALENDAR LINK]' style='display:inline-block;background:#ff6b6b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;'>Book a Discovery Call</a>"
}`;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Anthropic error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const text = (aiData.content?.[0]?.text ?? "").trim();
    let parsed: { subject: string; body: string } = { subject: "", body: "" };
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = { subject: "Your weekly newsletter", body: text };
        }
      } else {
        parsed = { subject: "Your weekly newsletter", body: text };
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});