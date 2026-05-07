const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MOXIE, an AI CMO generating content for a specific marketing campaign.

You write in the founder's voice — never generic marketing speak. Every piece of content you produce must:
- Map to one of the founder's content pillars
- Advance the stated campaign goal
- Speak directly to the ideal client's pain point or transformation
- Sound like the founder, using their voice attributes — never the anti-positioning language
- Follow the platform-specific rules exactly`;

function buildPrompt(opts: {
  topic: string;
  platform: string;
  contentType: string;
  strategy: any;
  campaign?: any;
  slot?: { scheduled_date?: string | null; pillar?: string | null };
}) {
  const s = opts.strategy ?? {};
  const voice = Array.isArray(s.voice_attributes)
    ? s.voice_attributes.join(", ")
    : (s.voice_attributes ?? "");
  const pillarsList: string[] = Array.isArray(s.content_pillars)
    ? s.content_pillars
        .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
        .filter(Boolean)
    : [];
  const pillarsBlock = pillarsList.length
    ? pillarsList.map((p) => `- ${p}`).join("\n")
    : "(not set)";
  const c = opts.campaign ?? {};
  const slot = opts.slot ?? {};

  const richFormats = new Set(["Newsletter Section", "Long-Form Article", "Standalone Newsletter (full)"]);
  const isRich = richFormats.has(opts.platform);
  const platformRules = `PLATFORM-SPECIFIC RULES:
- LinkedIn: 1,200–1,800 characters, sentence case, no em dashes, punchy hook under 60 characters, end with a question, no links in the body
- Instagram: conversational, 150–300 characters for the caption, 5–10 relevant hashtags at the end
- Facebook: 100–250 characters, casual tone, question or poll format preferred
- Email: subject line + preview text + body, conversational but structured, clear single CTA
- Newsletter Section: 300–500 words, one focused idea
- Long-Form Article: 800–1,500 words, clear intro/body/conclusion structure
- Standalone Newsletter (full): 500–900 words, greeting, body with subheads, sign-off
- X / Twitter: under 280 characters total, punchy, no fluff`;
  const formatHint = isRich
    ? "Return formatted HTML using <h1>, <h2>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <hr>. No <html> or <body> wrappers. No code fences."
    : "Return only plain text. No markdown, no HTML, no code fences.";

  const campaignBlock = c && (c.name || c.goals || c.theme)
    ? `CAMPAIGN CONTEXT:
Campaign name: ${c.name ?? "(unnamed)"}
Campaign goal: ${c.goals ?? c.objective ?? c.theme ?? "(not set)"}
Campaign runs: ${c.start_date ?? "?"} to ${c.end_date ?? "?"}
Active channels: ${Array.isArray(c.channels) ? c.channels.join(", ") : "(not set)"}`
    : `CAMPAIGN CONTEXT:
(No specific campaign — treat this as a standalone post that still maps to a content pillar.)`;

  return `ABOUT THIS FOUNDER:
Positioning: ${s.positioning_statement ?? "(not set)"}
Ideal client: ${s.ideal_client ?? "(not set)"}
Their pain point: ${s.pain_point ?? "(not set)"}
The transformation they deliver: ${s.transformation ?? "(not set)"}
Brand voice: ${voice || "(not set)"}
They are NOT: ${s.anti_positioning ?? "(not set)"}
Their methodology/framework: ${s.methodology ?? "(not set)"}

CONTENT PILLARS (all content must map to one of these):
${pillarsBlock}

${campaignBlock}

CONTENT REQUEST:
Platform: ${opts.platform}
Content type: ${opts.contentType}
Scheduled date: ${slot.scheduled_date ?? "(not set)"}
${slot.pillar ? `Anchor pillar: ${slot.pillar}` : ""}
Founder's idea / angle: ${opts.topic}

${platformRules}

Generate ONE piece of content for this platform that:
1. Advances the campaign goal stated above
2. Maps to one of the content pillars${slot.pillar ? ` (use "${slot.pillar}" as the anchor pillar)` : ""}
3. Speaks directly to the ideal client's pain point or transformation
4. Uses the founder's voice attributes — not generic marketing language
5. Follows the platform rules above

${formatHint}

Return only the content itself — no preamble, no explanation, no "here's your post."`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { topic, platform, contentType, strategy, campaign, slot, mode, text, existing, instruction } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const callClaude = async (system: string, userPrompt: string, maxTokens = 1024) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      return res;
    };

    if (mode === "hashtags") {
      const snippet = String(text ?? "").slice(0, 200);
      const res = await callClaude(
        "You generate concise, relevant LinkedIn hashtags.",
        `Generate 4-6 relevant LinkedIn hashtags for this post. Return only the hashtags, space-separated, no explanation: ${snippet}`,
        200,
      );
      if (!res.ok) {
        const t = await res.text();
        console.error("hashtags AI error", res.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const hashtags = data.content?.[0]?.text?.trim() ?? "";
      return new Response(JSON.stringify({ hashtags }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "refine") {
      if (!existing || !instruction) {
        return new Response(JSON.stringify({ error: "existing and instruction required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refinePrompt = `Here is a piece of ${platform ?? "content"} (${contentType ?? "post"}):\n\n"""\n${existing}\n"""\n\nApply this refinement instruction from the user:\n"${instruction}"\n\nReturn ONLY the revised content. No preamble. Match the same format as the original (plain text or HTML).`;
      const res = await callClaude(SYSTEM, refinePrompt, 1500);
      if (!res.ok) {
        if (res.status === 429)
          return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        const t = await res.text();
        console.error("refine AI error", res.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const body = data.content?.[0]?.text?.trim() ?? "";
      return new Response(JSON.stringify({ body }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!topic || !platform || !contentType) {
      return new Response(JSON.stringify({ error: "topic, platform, contentType required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt({ topic, platform, contentType, strategy, campaign, slot });

    const longForm = ["Newsletter Section", "Long-Form Article", "Standalone Newsletter (full)"].includes(platform);
    const res = await callClaude(SYSTEM, prompt, longForm ? 3000 : 1024);

    if (!res.ok) {
      if (res.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (res.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await res.text();
      console.error("generate-content AI error", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const body = data.content?.[0]?.text?.trim() ?? "";
    return new Response(JSON.stringify({ body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});