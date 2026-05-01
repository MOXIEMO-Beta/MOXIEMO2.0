const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "improve" | "shorter" | "longer" | "punchier" | "rewrite" | "instruction";

const actionInstructions: Record<Exclude<Action, "instruction">, string> = {
  improve:
    "Improve this text — make it clearer, more compelling, and more on-brand. Keep approximately the same length.",
  shorter: "Make this text shorter and punchier. Cut words, not meaning.",
  longer:
    "Expand this text with more detail, a specific example, or a stronger insight. Stay in the same voice.",
  punchier:
    "Make this text more direct, confident, and impactful. Cut soft language. Lead with conviction.",
  rewrite:
    "Completely rewrite this text in a fresh way. Same point, totally different angle and wording.",
};

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
      action,
      selectedText,
      fullPost,
      platform,
      strategy,
      instruction,
    }: {
      action?: Action;
      selectedText?: string;
      fullPost?: string;
      platform?: string;
      strategy?: Record<string, unknown>;
      instruction?: string;
    } = body ?? {};

    if (!action || !platform || typeof selectedText !== "string" || typeof fullPost !== "string") {
      return new Response(
        JSON.stringify({ error: "action, platform, selectedText, fullPost required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const s = strategy ?? {};
    const instructionLine =
      action === "instruction"
        ? `Apply this specific instruction to the post: "${instruction ?? ""}"
Keep everything that doesn't need to change. Only modify what the instruction asks for.
Maintain the exact same voice, tone, and platform format.`
        : actionInstructions[action];

    const prompt = `You are MOXIE editing a ${platform} post for a founder.

VOICE: ${JSON.stringify(s.voice_attributes ?? [])}
ANTI-POSITIONING: ${(s.anti_positioning as string) ?? "(not set)"}

FULL POST CONTEXT:
${fullPost}

SELECTED TEXT TO EDIT:
"${selectedText}"

INSTRUCTION: ${instructionLine}

Return ONLY the edited version of the selected text. No explanation, no preamble.
Match the surrounding tone and voice exactly.`;

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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Anthropic error", resp.status, text);
      return new Response(JSON.stringify({ error: `Anthropic API error: ${resp.status}` }), {
        status: resp.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    let text: string = data?.content?.[0]?.text ?? "";
    text = text.trim();
    // strip wrapping quotes if model returned them
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1).trim();
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("edit-social-post error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});