import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { precheckGeneration, commitGeneration, limitErrorResponse, unauthorizedResponse } from "../_shared/usage.ts";

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
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const pre = await precheckGeneration(req);
    if (!pre.allowed) {
      if (pre.error === "unauthorized") return unauthorizedResponse(corsHeaders);
      if (pre.error === "limit_reached") return limitErrorResponse(corsHeaders, pre);
      return new Response(JSON.stringify({ error: pre.error ?? "limit_check_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pillars = Array.isArray(strategy?.content_pillars)
      ? strategy.content_pillars.join(", ")
      : strategy?.content_pillars ?? "your core expertise";

    const prompt = `Generate 6 social media post ideas for a founder with this strategy:

Ideal client: ${strategy?.ideal_client ?? "B2B founders"}
Pain point: ${strategy?.pain_point ?? "unclear messaging"}
Content pillars: ${pillars}
Voice: ${JSON.stringify(strategy?.voice_attributes ?? ["authoritative", "empathetic", "direct"])}

Return ONLY a valid JSON array with exactly 6 items. No explanation, no preamble, no markdown:
[
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" },
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" },
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" },
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" },
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" },
  { "title": "Post idea title", "pillar": "pillar name", "hook": "First line of the post" }
]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Anthropic API error:", res.status, errorText);
      notifyAdminCritical(req, { functionName: "generate-post-ideas", status: res.status, detail: errorText });
      throw new Error(`Anthropic API returned ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "[]";

    let ideas: any[] = [];
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      ideas = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text);
      ideas = [
        { title: "Why most founders struggle with messaging clarity", pillar: pillars.split(",")[0]?.trim() ?? "Core Framework", hook: "Most founders have the expertise. Very few have the clarity." },
        { title: "The one thing holding your personal brand back", pillar: pillars.split(",")[0]?.trim() ?? "Core Framework", hook: "It's not your content. It's not your consistency." },
        { title: "What changed when I stopped guessing and started with strategy", pillar: pillars.split(",")[1]?.trim() ?? "Strategy", hook: "I used to post and hope. Then everything shifted." },
        { title: "3 signs your ideal client can't see your expertise", pillar: pillars.split(",")[0]?.trim() ?? "Core Framework", hook: "You know your stuff. The problem is no one else does yet." },
        { title: "The revenue you're leaving on the table without positioning", pillar: pillars.split(",")[1]?.trim() ?? "Strategy", hook: "Unclear positioning isn't just a branding problem. It's a revenue problem." },
        { title: "Why consistency beats perfection every single time", pillar: pillars.split(",")[2]?.trim() ?? "Mindset", hook: "The founders winning online aren't the most talented. They're the most consistent." },
      ];
    }

    const usage = await commitGeneration(req, {
      platform: "ideas",
      campaignId: null,
      preview: Array.isArray(ideas) && ideas[0]?.title ? String(ideas[0].title) : "Post ideas",
    });
    return new Response(JSON.stringify({ ideas, usage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-post-ideas error:", e);
    return new Response(
      JSON.stringify({ error: String(e), ideas: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
