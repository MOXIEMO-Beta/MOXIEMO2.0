import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { precheckGeneration, commitGeneration, limitErrorResponse, unauthorizedResponse } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT =
  "You are MOXIEMO. Write the single most important first marketing action for this founder given their goal and business type. One specific, concrete action they can take this week. 2-3 sentences max. No em-dashes. No contractions.";

const GOAL_LABELS: Record<string, string> = {
  first_100: "Get first 100 customers",
  launch_offer: "Launch a specific offer",
};

const BUSINESS_LABELS: Record<string, string> = {
  E: "Expertise Business (coaching, consulting, methodology)",
  G: "Growing Business (team-based service or product)",
  R: "Restaurant or Hospitality (physical location)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse(corsHeaders);
    }

    // ── Server-side cap: max 3 lifetime first-move generations per user ──────
    // Count rows in first_moves for this user. Using service role so RLS
    // doesn't interfere with the count query.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { count: existingCount } = await adminClient
      .from("first_moves")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((existingCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "generation_limit_reached", limit: 3, used: existingCount }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Monthly plan limit check (shared usage gate) ─────────────────────────
    const precheck = await precheckGeneration(req);
    if (!precheck.allowed) {
      return limitErrorResponse(corsHeaders, precheck);
    }

    const { goal_key, business_type, strategy_summary } = await req.json() as {
      goal_key: string;
      business_type: string;
      strategy_summary?: string;
    };
    const user_id = user.id;

    if (!goal_key || !business_type) {
      return new Response(
        JSON.stringify({ error: "goal_key and business_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const goalLabel = GOAL_LABELS[goal_key] ?? goal_key;
    const businessLabel = BUSINESS_LABELS[business_type] ?? business_type;

    const userContent = [
      `Goal: ${goalLabel}`,
      `Business type: ${businessLabel}`,
      strategy_summary ? `Strategy context: ${strategy_summary}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      console.error("Anthropic error:", anthropicResponse.status, errBody);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicData = await anthropicResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = anthropicData.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Commit usage against the user's monthly plan limit.
    await commitGeneration(req, { platform: "first_move" });

    const { error: insertError } = await adminClient.from("first_moves").insert({
      user_id,
      goal_key,
      business_type,
      text,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
