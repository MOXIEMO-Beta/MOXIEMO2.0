const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { precheckGeneration, commitGeneration, limitErrorResponse, unauthorizedResponse } from "../_shared/usage.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const SYSTEM = `You are a content strategist for an expertise-based founder. Given a podcast / webinar / long-form transcript, you extract the best moments and turn them into platform-ready content pieces.

You write in the founder's voice — never generic marketing speak. Every piece you produce must:
- Sound like the founder based on the brand voice provided
- Be anchored to a relevant content pillar
- Use only material present in the transcript — do not invent facts, stats, or stories
- Follow the platform-specific format requested
- Include a final line: "Source: {sourceName}"`;

type Piece = { type: string; instruction: string };

const PIECE_LIBRARY: Record<string, string> = {
  "LinkedIn Post (from a key insight)":
    "Pick the single most valuable insight or framework shared in the transcript. Write a LinkedIn post (1,200–1,800 characters, sentence case, no em dashes) that opens with a punchy hook under 60 characters, unpacks the insight, and ends with a question. No links.",
  "LinkedIn Post (from a quotable moment)":
    "Pick the most quotable sentence in the transcript (under 25 words). Open the LinkedIn post with that quote as the hook on its own line, then expand on it in the founder's voice (1,200–1,800 characters total). End with a question.",
  "Instagram Caption":
    "Write an Instagram caption (150–300 characters) anchored to one specific moment from the transcript. Conversational tone, plus 5–10 relevant hashtags at the end.",
  "Short-Form Video Script (from a key story)":
    "Pick the best story or specific example in the transcript. Write a 45–90 second direct-to-camera script (120–180 words) that opens with a punchy hook, tells the story conversationally, and ends with one clear CTA. Plain text only.",
  "Email Section":
    "Write a 300–500 word email section based on a key insight from the transcript. One focused idea, conversational but structured. Plain text.",
  "Newsletter Introduction":
    "Write a newsletter introduction (150–250 words) that hooks the reader using a moment or insight from the transcript and previews what's coming.",
  "Show Notes":
    "Generate publishable show notes: episode title, one-paragraph summary (~150 words), 5–7 key takeaways as bullet points, 3 notable quotes formatted for social sharing, resources/links mentioned as placeholders, and a guest bio section if applicable.",
  "Twitter / X Thread":
    "Write a 6–10 tweet thread based on the most valuable insight or framework in the transcript. Number each tweet (1/, 2/, ...). Each tweet under 280 characters. Hook tweet must stop the scroll.",
};

function buildPrompt(opts: { transcript: string; sourceName: string; pieces: string[]; strategy: any }) {
  const s = opts.strategy ?? {};
  const voice = Array.isArray(s.voice_attributes) ? s.voice_attributes.join(", ") : (s.voice_attributes ?? "");
  const pillarsList: string[] = Array.isArray(s.content_pillars)
    ? s.content_pillars.map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? "")).filter(Boolean)
    : [];
  const pillarsBlock = pillarsList.length ? pillarsList.map((p) => `- ${p}`).join("\n") : "(not set)";

  const pieceBlocks = opts.pieces
    .map((label, i) => {
      const instr = PIECE_LIBRARY[label] ?? "Generate a content piece anchored to a moment from the transcript.";
      return `[${i + 1}] TYPE: ${label}\nINSTRUCTIONS: ${instr}`;
    })
    .join("\n\n");

  return `ABOUT THIS FOUNDER:
Positioning: ${s.positioning_statement ?? "(not set)"}
Ideal client: ${s.ideal_client ?? "(not set)"}
Pain point: ${s.pain_point ?? "(not set)"}
Transformation: ${s.transformation ?? "(not set)"}
Brand voice: ${voice || "(not set)"}
They are NOT: ${s.anti_positioning ?? "(not set)"}

CONTENT PILLARS:
${pillarsBlock}

SOURCE TRANSCRIPT (name: "${opts.sourceName}"):
"""
${opts.transcript}
"""

STEP 1 — Internally identify (do NOT output this analysis):
- The 3 most quotable sentences (under 25 words each)
- The 2–3 most valuable insights or frameworks
- The 1 best story or specific example
- Any data points or statistics mentioned

STEP 2 — Generate each of the following content pieces, using only material from the transcript:

${pieceBlocks}

OUTPUT FORMAT — Return ONLY a JSON array (no prose, no code fences, no preamble) of this exact shape:
[
  { "type": "<exact TYPE string above>", "body": "<the generated content as plain text, including the final 'Source: ${opts.sourceName}' line>" }
]

Return one object per requested piece, in the same order. Plain text only inside "body" — no markdown, no HTML.`;
}

function tryParseJsonArray(text: string): { type: string; body: string }[] | null {
  if (!text) return null;
  let t = text.trim();
  // strip code fences if model added them
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(t.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((p: any) => ({ type: String(p?.type ?? ""), body: String(p?.body ?? "") }))
      .filter((p) => p.type && p.body);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { transcript, sourceName, pieces, strategy } = await req.json();
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 100) {
      return new Response(JSON.stringify({ error: "Transcript text is required (min 100 chars)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(pieces) || pieces.length === 0) {
      return new Response(JSON.stringify({ error: "Select at least one piece to generate." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const pre = await precheckGeneration(req);
    if (!pre.allowed) {
      if (pre.error === "unauthorized") return unauthorizedResponse(corsHeaders);
      if (pre.error === "limit_reached") return limitErrorResponse(corsHeaders, pre);
      return new Response(JSON.stringify({ error: pre.error ?? "limit_check_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim transcript to a reasonable size
    const trimmed = transcript.length > 80_000 ? transcript.slice(0, 80_000) : transcript;
    const prompt = buildPrompt({
      transcript: trimmed,
      sourceName: String(sourceName ?? "transcript").slice(0, 200),
      pieces: pieces.map((p: any) => String(p)).slice(0, 12),
      strategy: strategy ?? null,
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        notifyAdminCritical(req, { functionName: "repurpose-content", status: 429 });
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        notifyAdminCritical(req, { functionName: "repurpose-content", status: 402 });
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await res.text();
      console.error("repurpose-content AI error", res.status, t);
      notifyAdminCritical(req, { functionName: "repurpose-content", status: res.status, detail: t });
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() ?? "";
    const parsed = tryParseJsonArray(raw);
    if (!parsed || parsed.length === 0) {
      console.error("repurpose-content parse fail", raw.slice(0, 400));
      return new Response(JSON.stringify({ error: "Couldn't parse generated content. Try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usage = await commitGeneration(req, {
      platform: "Repurpose",
      campaignId: null,
      preview: parsed[0]?.body ?? "",
    });

    return new Response(JSON.stringify({ pieces: parsed, usage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});