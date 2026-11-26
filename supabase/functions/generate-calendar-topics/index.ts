const corsHeaders = {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  "Access-Control-Allow-Origin": "*",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  "Access-Control-Allow-Headers":
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
const SYSTEM = `You are MOXIEMO, an AI Chief Marketing Officer. You write specific, compelling content post titles that sound like real posts a founder would write — never generic category labels, never numbered placeholders.`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
type Row = {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  pillar?: string;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  format?: string;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  channel?: string;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  date?: string;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Deno.serve(async (req) => {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  try {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!apiKey) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        status: 500,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        headers: { ...corsHeaders, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const body = await req.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const voice: string[] = Array.isArray(body?.voice) ? body.voice : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const icp: string = body?.icp ?? "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const pain: string = body?.pain ?? "";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!rows.length) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return new Response(JSON.stringify({ titles: [] }), {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        status: 200,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        headers: { ...corsHeaders, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const numbered = rows
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      .map((r, i) => `${i + 1}. pillar="${r.pillar ?? ""}" | format="${r.format ?? ""}" | channel="${r.channel ?? ""}" | date="${r.date ?? ""}"`)
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      .join("\n");
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const prompt = `BRAND CONTEXT
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Voice attributes: ${voice.join(", ") || "(not set)"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Ideal client: ${icp || "(not set)"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Pain point: ${pain || "(not set)"}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
TASK
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
For each numbered row below, generate ONE specific, compelling post topic title (max 12 words). It must sound like a real post the founder would publish — not a category label, not a numbered placeholder. Tie the title to the pillar, format, and channel for that row.
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
ROWS (${rows.length} total):
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
${numbered}
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
Return ONLY valid JSON, no prose, no code fences:
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
{ "titles": ["title for row 1", "title for row 2", ...] }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
The titles array MUST have exactly ${rows.length} entries, in the same order.`;
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      method: "POST",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      headers: {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        "Content-Type": "application/json",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        "x-api-key": apiKey,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        "anthropic-version": "2023-06-01",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      body: JSON.stringify({
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        model: "claude-sonnet-4-5",
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        max_tokens: 4000,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        system: SYSTEM,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        messages: [{ role: "user", content: prompt }],
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      }),
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    if (!resp.ok) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const text = await resp.text();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      console.error("Anthropic error", resp.status, text);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      return new Response(JSON.stringify({ error: `Anthropic API error: ${resp.status}` }), {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        status: resp.status === 429 ? 429 : 500,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
        headers: { ...corsHeaders, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const data = await resp.json();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const text: string = data?.content?.[0]?.text ?? "{}";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    let parsed: { titles?: string[] } = {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    try {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      parsed = JSON.parse(cleaned);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    } catch {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      const m = cleaned.match(/\{[\s\S]*\}/);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      parsed = m ? JSON.parse(m[0]) : {};
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    const titles = Array.isArray(parsed.titles) ? parsed.titles.map((t) => String(t || "")) : [];
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";

import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    return new Response(JSON.stringify({ titles }), {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      status: 200,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      headers: { ...corsHeaders, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  } catch (err) {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    console.error("generate-calendar-topics error", err);
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    return new Response(JSON.stringify({ error: (err as Error).message }), {
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      status: 500,
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
      headers: { ...corsHeaders, "Content-Type": "application/json" },
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
    });
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
  }
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
});import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
