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

    let topic = "";
    let emailType = "Weekly Newsletter";
    try {
      const body = await req.json();
      if (body?.topic) topic = String(body.topic);
      if (body?.emailType) emailType = String(body.emailType);
    } catch {
      // no body provided — use defaults
    }

    const { data: strategy } = await supabase
      .from("strategies")
      .select(
        "positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, content_pillars",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!topic) {
      const pillars = Array.isArray(strategy?.content_pillars)
        ? (strategy!.content_pillars as unknown[])
        : [];
      if (pillars.length) {
        const pick = pillars[Math.floor(Math.random() * pillars.length)];
        topic = typeof pick === "string" ? pick : JSON.stringify(pick);
      } else {
        topic = "founder positioning and messaging";
      }
    }

    const prompt = `You are MOXIE, an AI Chief Marketing Officer generating a complete email for a founder.

FOUNDER'S STRATEGY:
Positioning: ${strategy?.positioning_statement ?? "Expert founder helping clients achieve transformation"}
Ideal client: ${strategy?.ideal_client ?? "B2B founders"}
Pain point: ${strategy?.pain_point ?? "unclear messaging and marketing overwhelm"}
Voice attributes: ${JSON.stringify(strategy?.voice_attributes ?? ["authoritative", "empathetic", "direct"])}
Anti-positioning: ${strategy?.anti_positioning ?? "corporate jargon"}
Content pillars: ${JSON.stringify(strategy?.content_pillars ?? [])}

EMAIL BRIEF:
Topic/Focus: ${topic}
Email type: ${emailType}

EMAIL TYPE INSTRUCTIONS:
- Weekly Newsletter: Value-packed insight on the topic, 400-500 words, ends with a question
- Framework Deep-Dive: Teach one concept from their framework using the topic as the lens, 350-450 words
- Client Win Story: Tell a transformation story related to the topic (use archetypal client, not real names), 300-400 words
- Discovery Call Invite: Warm, direct invitation to book a call, topic used as the pain point hook, 200-300 words

VOICE RULES:
- Match voice attributes exactly
- Never use anti-positioning language
- Write for the ideal client
- Sound like a smart CMO colleague, not a corporate newsletter

Return ONLY valid JSON:
{
  "subject": "Subject line under 50 chars — curiosity-driven, no clickbait",
  "preview_text": "Preview text under 90 chars shown in inbox",
  "body": "Full HTML email body matching the email type instructions above. Use <h2> for headers, <p> for paragraphs. End with a coral CTA button: <a href='[CALENDAR LINK]' style='display:inline-block;background:#ff6b6b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;'>Book a Discovery Call</a>"
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
        model: "claude-sonnet-4-5",
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
    let parsed: { subject: string; body: string; preview_text?: string } = {
      subject: "",
      body: "",
    };
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