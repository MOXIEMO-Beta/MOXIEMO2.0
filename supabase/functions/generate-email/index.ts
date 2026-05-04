import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are MOXIE, an AI Chief Marketing Officer writing email newsletters for an expertise-based founder.

Your user sells their expertise — coaching, consulting, fractional services, or agency work. They have a real audience who trusts them. Your job is to write emails that sound like the founder wrote them personally — not like a marketing tool.

Never sign off as MOXIE. Always use the founder's name.
Never use buzzwords the founder has listed as anti-positioning.
Always match the voice attributes provided.

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON with no markdown formatting, no code fences, no backticks, and no preamble. Raw JSON only. The "body" field must contain HTML directly — never wrap it in code fences or markdown.`;

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
    let senderName = "Your Name";
    try {
      const body = await req.json();
      if (body?.topic) topic = String(body.topic);
      if (body?.emailType) emailType = String(body.emailType);
      if (body?.senderName) senderName = String(body.senderName);
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

    const prompt = `FOUNDER'S STRATEGY:
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
  "body": "Full HTML email body matching the email type instructions above. Use <h2> for headers, <p> for paragraphs. End with the closing line and signature only — NO call-to-action button, booking link, or closing CTA. The user adds their own CTA separately."
}

SIGNATURE RULE:
Always end the email with the sender's actual name, never "MOXIE".
Use this exact format for the closing line:
<p>—${senderName}</p>

Never use "—MOXIE", "The MOXIE Team", or any variation of MOXIE as a signature.
MOXIE is the tool, not the sender. The human founder is the sender.

CTA RULE:
Do NOT include any call-to-action button, booking link, or closing CTA in the email body.
End the email body with the closing line (signature) only.
The user will add their own CTA separately in the editor.`;

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
        system: SYSTEM,
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
    const rawText = (aiData.content?.[0]?.text ?? "").trim();

    function stripFences(s: string): string {
      return s
        .replace(/^```(?:json|html)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
    }

    const cleaned = stripFences(rawText);
    let parsed: { subject: string; body: string; preview_text?: string } = {
      subject: "",
      body: "",
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try {
          parsed = JSON.parse(cleaned.substring(start, end + 1));
        } catch {
          parsed = { subject: "Your weekly newsletter", body: cleaned };
        }
      } else {
        parsed = { subject: "Your weekly newsletter", body: cleaned };
      }
    }

    // Defensive: if body itself was returned wrapped in fences, strip them
    if (typeof parsed.body === "string") {
      parsed.body = stripFences(parsed.body);
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