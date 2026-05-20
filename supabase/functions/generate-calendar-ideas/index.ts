import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { precheckGeneration, commitGeneration, limitErrorResponse, unauthorizedResponse } from "../_shared/usage.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { strategy, recentPosts = [], recentEmails = [], activeChannels = [] } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const pre = await precheckGeneration(req);
    if (!pre.allowed) {
      if (pre.error === "unauthorized") return unauthorizedResponse(corsHeaders);
      if (pre.error === "limit_reached") return limitErrorResponse(corsHeaders, pre);
      return new Response(JSON.stringify({ error: pre.error ?? "limit_check_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastPillar = recentPosts[0]?.pillar ?? "none";
    const lastEmailDate = recentEmails[0]?.sent_at ? new Date(recentEmails[0].sent_at) : null;
    const weeksSinceEmail = lastEmailDate
      ? Math.floor((Date.now() - lastEmailDate.getTime()) / (7 * 86400000))
      : 99;

    const prompt = `Generate 3 specific marketing opportunities for this founder this week.

Strategy: ${JSON.stringify({
      positioning: strategy?.positioning_statement,
      ideal_client: strategy?.ideal_client,
      pain_point: strategy?.pain_point,
      pillars: strategy?.content_pillars,
    })}
Recent posts (last 7 days): ${recentPosts.length} posts published
Last published pillar: ${lastPillar}
Weeks since last email: ${weeksSinceEmail}
Channels active: ${activeChannels.join(", ")}

Return ONLY valid JSON array of 3 ideas, no markdown:
[
  {
    "title": "Short opportunity title",
    "insight": "Why this matters right now (1-2 sentences)",
    "channel": "linkedin|email|instagram|content",
    "action": "Create button label",
    "type": "opportunity|gap|timing"
  }
]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      notifyAdminCritical(req, { functionName: "generate-calendar-ideas", status: res.status, detail: errText });
      throw new Error(`Anthropic error: ${res.status} ${errText}`);
    }
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "[]";
    let ideas: any[] = [];
    try { ideas = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { console.error("parse", text); }

    const usage = await commitGeneration(req, {
      platform: "calendar-ideas",
      campaignId: null,
      preview: Array.isArray(ideas) && ideas[0]?.title ? String(ideas[0].title) : "Calendar ideas",
    });
    return new Response(JSON.stringify({ ideas, usage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-calendar-ideas error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});