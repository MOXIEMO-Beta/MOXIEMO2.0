import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await supabase.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Derive user id ONLY from JWT — never from request body.
    const { data: strategy } = await supabase
      .from("strategies")
      .select("enhanced_foundation, content_pillars, ideal_client, business_goal")
      .eq("user_id", user.id)
      .maybeSingle();

    const ef = (strategy?.enhanced_foundation ?? {}) as any;
    const hasFoundation = ef && Object.keys(ef).length > 0;
    if (!hasFoundation && !strategy?.content_pillars) {
      return new Response(JSON.stringify({
        recommendations: [],
        message: "Complete Discovery to receive campaign recommendations.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pillarsRaw = ef?.contentPillars ?? strategy?.content_pillars ?? [];
    const pillars = (Array.isArray(pillarsRaw) ? pillarsRaw : [])
      .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
      .filter(Boolean).slice(0, 6);
    const icp = ef?.idealClient ?? strategy?.ideal_client ?? "";
    const positioning = ef?.positioning ?? ef?.brandPositioning ?? "";
    const businessGoal = ef?.businessGoal ?? strategy?.business_goal ?? "";
    const differentiators = ef?.differentiators ?? ef?.uniqueValue ?? "";

    const prompt = `You are a campaign strategist for a founder. Based on THIS founder's strategy foundation below, recommend 3 campaign ideas they should consider running next.

Founder's pillars: ${JSON.stringify(pillars)}
Founder's ICP: ${typeof icp === "string" ? icp : JSON.stringify(icp)}
Founder's positioning: ${typeof positioning === "string" ? positioning : JSON.stringify(positioning)}
Founder's business goal: ${typeof businessGoal === "string" ? businessGoal : JSON.stringify(businessGoal)}
Founder's differentiators: ${typeof differentiators === "string" ? differentiators : JSON.stringify(differentiators)}

Each recommendation is either a "Gap" (something their strategy identifies but they haven't addressed) or an "Opportunity" (a high-leverage move their strategy points to).
Ground every recommendation in THIS founder's specific pillars, ICP, and positioning. Do NOT use generic marketing advice.

Return JSON only, no other text:
{
  "recommendations": [
    { "type": "Gap" | "Opportunity", "title": "campaign title (max 12 words)", "description": "2-3 sentence explanation grounded in this founder's pillars, ICP, and positioning", "cta": "Plan this campaign" }
  ]
}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: "claude_error", detail: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    let parsed: any = { recommendations: [] };
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch { /* keep empty */ }

    const recommendations = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations.map((r: any) => ({
          type: r?.type === "Opportunity" ? "Opportunity" : "Gap",
          title: String(r?.title ?? "").slice(0, 160),
          description: String(r?.description ?? "").slice(0, 500),
          cta: r?.cta || "Plan this campaign",
        }))
      : [];

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});