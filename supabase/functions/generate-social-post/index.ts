const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { precheckGeneration, commitGeneration, limitErrorResponse, unauthorizedResponse } from "../_shared/usage.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const SYSTEM = `You are MOXIEMO, an AI Chief Marketing Officer generating social media content for an expertise-based founder.

This founder sells their expertise — they may be a coach, consultant, fractional executive, or agency owner. Every post you write must:
- Reflect their strategy, positioning, and voice
- Speak to their ideal client's specific pain point
- Sound like a thought leader, not a marketer
- Build authority and trust with every word
- Drive genuine engagement through specificity and questions`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      topic,
      platforms,
      postFormat,
      toneOverride,
      strategy,
    }: {
      topic?: string;
      platforms?: string[];
      postFormat?: string;
      toneOverride?: string | null;
      strategy?: Record<string, unknown>;
    } = body ?? {};

    if (!topic || !Array.isArray(platforms) || platforms.length === 0 || !postFormat) {
      return new Response(
        JSON.stringify({ error: "topic, platforms, postFormat required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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

    const s = strategy ?? {};
    const prompt = `FOUNDER'S STRATEGY:
Positioning: ${(s.positioning_statement as string) ?? "(not set)"}
Ideal client: ${(s.ideal_client as string) ?? "(not set)"}
Pain point: ${(s.pain_point as string) ?? "(not set)"}
Voice attributes: ${JSON.stringify(s.voice_attributes ?? [])}
Anti-positioning: ${(s.anti_positioning as string) ?? "(not set)"}

POST BRIEF:
Topic: ${topic}
Format: ${postFormat}
Tone: ${toneOverride ?? "match strategy voice exactly"}
Platforms: ${platforms.join(", ")}

FORMAT INSTRUCTIONS:
- Text post: Hook line + 3-4 short paragraphs + engagement question
- List / Tips: Hook + numbered or bulleted list of 3-5 items + question
- Poll: Hook + 2-4 poll options listed as A) B) C) D) + question
- Question: Single thought-provoking question with 2-3 lines of context
- Story idea: Personal story arc — situation, struggle, insight, outcome

PLATFORM RULES:
- LinkedIn: 1200-1800 chars, line breaks every 1-2 sentences, hook under 60 chars, end with specific question
- Instagram: 150-300 chars caption, punchy, emoji-friendly, 5-8 hashtags at end
- Facebook: Conversational, 100-250 chars, can be more casual than LinkedIn

Return ONLY valid JSON, no prose, no code fences:
{
  "linkedin": "Full LinkedIn post copy",
  "instagram": "Instagram caption copy",
  "facebook": "Facebook post copy"
}

Only include non-empty content for these platforms: ${platforms.join(", ")}
For unrequested platforms, return an empty string.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Anthropic error", resp.status, text);
      notifyAdminCritical(req, { functionName: "generate-social-post", status: resp.status, detail: text });
      return new Response(JSON.stringify({ error: `Anthropic API error: ${resp.status}` }), {
        status: resp.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? "{}";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    let posts: Record<string, string> = {};
    try {
      posts = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      posts = m ? JSON.parse(m[0]) : {};
    }

    const result: Record<string, string> = {};
    for (const p of platforms) {
      result[p] = typeof posts[p] === "string" ? posts[p] : "";
    }

    const firstPlatform = platforms[0];
    const previewText = result[firstPlatform] ?? Object.values(result).find((v) => v) ?? "";
    const usage = await commitGeneration(req, {
      platform: `social:${platforms.join(",")}`,
      campaignId: null,
      preview: previewText,
    });
    return new Response(JSON.stringify({ posts: result, usage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-social-post error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});