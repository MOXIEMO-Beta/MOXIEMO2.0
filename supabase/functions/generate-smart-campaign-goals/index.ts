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

    const { data: strategy } = await supabase
      .from("strategies")
      .select("enhanced_foundation, business_goal, success_definition")
      .eq("user_id", user.id)
      .maybeSingle();

    const ef = (strategy?.enhanced_foundation ?? {}) as any;
    const businessGoal = ef?.businessGoal ?? strategy?.business_goal ?? "";
    const successDefinition = ef?.successDefinition ?? ef?.successLooksLike ?? strategy?.success_definition ?? "";
    const successMetrics = ef?.successMetrics ?? ef?.metrics ?? "";

    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const goalType = String(body?.goalType ?? "").slice(0, 80);
    const theme = String(body?.theme ?? "").slice(0, 160);

    const prompt = `You are a marketing strategist. Based on this founder's business goals and success metrics, generate 3-4 SPECIFIC, MEASURABLE, ATTAINABLE, RELEVANT, and TIME-BOUND campaign goal options. Each must be a single, scoped, actionable objective for ONE campaign — not a restatement of the overall business mission.

Business goal: ${typeof businessGoal === "string" ? businessGoal : JSON.stringify(businessGoal)}
Success looks like: ${typeof successDefinition === "string" ? successDefinition : JSON.stringify(successDefinition)}
Success metrics: ${typeof successMetrics === "string" ? successMetrics : JSON.stringify(successMetrics)}
${goalType ? `Campaign goal type selected: ${goalType}` : ""}
${theme ? `Campaign theme selected: ${theme}` : ""}

BAD (too broad, mission-level): "Build a product founders genuinely love and grow to 500 paying users within 12 months."
GOOD (specific, measurable, scoped to one campaign): "Book 15 discovery calls from LinkedIn content over the next 30 days."
GOOD: "Grow email list by 100 subscribers through 3 lead magnet posts this month."

Return JSON only, no other text:
{
  "goals": [
    { "text": "single SMART goal sentence, max 24 words" }
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
        max_tokens: 800,
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
    let parsed: any = { goals: [] };
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch { /* keep empty */ }

    const goals = Array.isArray(parsed?.goals)
      ? parsed.goals
          .map((g: any) => ({ text: String(g?.text ?? "").trim().slice(0, 240) }))
          .filter((g: any) => g.text.length > 0)
          .slice(0, 4)
      : [];

    return new Response(JSON.stringify({ goals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});