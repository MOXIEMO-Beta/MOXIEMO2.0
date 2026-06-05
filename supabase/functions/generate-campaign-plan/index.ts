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
    const { campaign, strategy, adConfig } = await req.json();
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

    const start = campaign?.start_date ? new Date(campaign.start_date) : new Date();
    const end = campaign?.end_date ? new Date(campaign.end_date) : new Date();
    const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));

    const icp = strategy?.ideal_client ?? strategy?.icp ?? "the target audience";
    const positioning = strategy?.positioning_statement ?? "";
    const voice = JSON.stringify(strategy?.voice_attributes ?? []);
    const pillar = (Array.isArray(strategy?.content_pillars) && strategy.content_pillars[0])
      ? (typeof strategy.content_pillars[0] === "string" ? strategy.content_pillars[0] : (strategy.content_pillars[0]?.name ?? strategy.content_pillars[0]?.title ?? ""))
      : "";

    const isPaid = !!adConfig?.platform;

    let prompt = "";
    if (isPaid && adConfig.platform === "meta") {
      const numVariations = Math.max(1, Math.min(6, Number(adConfig.numVariations) || 3));
      prompt = `Generate a ${weeks}-week Meta (Facebook/Instagram) ad creative brief.

CAMPAIGN GOAL: ${campaign?.goals ?? ""}
CAMPAIGN THEME: ${campaign?.theme ?? ""}
ICP: ${icp}
POSITIONING: ${positioning}
BRAND VOICE: ${voice}
CONTENT PILLAR: ${pillar}
OBJECTIVE: ${adConfig.objective}
AD FORMAT: ${adConfig.format}
DAILY BUDGET: ${adConfig.budget}
VARIATIONS PER WEEK: ${numVariations}

For each of the ${weeks} weeks, choose a focus:
- Week 1: testing phase
- Weeks 2 to ${Math.max(1, weeks - 1)}: optimization
- Final week: conversion push

Generate ${numVariations} variations per week, cycling through angles in this order: Pain-led, Outcome-led, Authority-led.

All copy speaks directly to ${icp}. No em-dashes. Character limits are HARD.

Return ONLY valid JSON, no markdown:
{
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "one-line creative angle for this week",
      "meta": {
        "variations": [
          {"label":"A","angle":"Pain-led","headline":"<=40 chars","primaryText":"<=125 chars","cta":"Learn More"}
        ],
        "targetingNote": "one sentence audience targeting recommendation",
        "creativeNote": "one sentence visual/image direction"
      }
    }
  ]
}`;
    } else if (isPaid && adConfig.platform === "google") {
      const numAdGroups = Math.max(1, Math.min(6, Number(adConfig.numAdGroups) || 2));
      prompt = `Generate a ${weeks}-week Google Ads campaign brief.

CAMPAIGN GOAL: ${campaign?.goals ?? ""}
CAMPAIGN THEME: ${campaign?.theme ?? ""}
ICP: ${icp}
POSITIONING: ${positioning}
BRAND VOICE: ${voice}
GOOGLE CAMPAIGN TYPE: ${adConfig.googleType}
PRIMARY KEYWORD FOCUS: ${adConfig.keyword}
DAILY BUDGET: ${adConfig.budget}
AD GROUPS PER WEEK: ${numAdGroups}

For each of the ${weeks} weeks, choose focus:
- Week 1: broad match testing
- Week 2+: exact match optimization

Each ad group gets 3 headlines (<=30 chars each) and 2 descriptions (<=90 chars each). Each ad group targets a different keyword theme derived from "${adConfig.keyword}". Character limits are HARD. No em-dashes.

Return ONLY valid JSON, no markdown:
{
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "this week's optimization focus",
      "google": {
        "adGroups": [
          {"name":"keyword theme name","headlines":["<=30","<=30","<=30"],"descriptions":["<=90","<=90"]}
        ],
        "keywordNote": "suggested keyword match types for this week",
        "bidNote": "one sentence bidding strategy recommendation"
      }
    }
  ]
}`;
    } else {
      prompt = `Generate a ${weeks}-week content plan for this marketing campaign.

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
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: isPaid ? 6000 : 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      notifyAdminCritical(req, { functionName: "generate-campaign-plan", status: res.status, detail: errText });
      throw new Error(`Anthropic error: ${res.status} ${errText}`);
    }
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

    const usage = await commitGeneration(req, {
      platform: "campaign-plan",
      campaignId: campaign?.id ?? null,
      preview: campaign?.name ? `Campaign plan: ${campaign.name}` : "Campaign plan",
    });
    return new Response(JSON.stringify({ ...result, usage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-campaign-plan error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});