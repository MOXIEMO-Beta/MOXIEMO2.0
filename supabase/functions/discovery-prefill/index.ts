import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUESTIONS: { id: string; label: string; hint: string }[] = [
  { id: "transformation", label: "Transformation you create for clients", hint: "What outcome / change clients get from working with them." },
  { id: "ideal_client", label: "Ideal client", hint: "Specific role, industry, situation." },
  { id: "pain_point", label: "#1 pain point ideal clients have", hint: "Core problem clients arrive with." },
  { id: "differentiation", label: "What makes them different / why choose them", hint: "Differentiation vs others in their space." },
  { id: "post_feeling", label: "How clients should feel after working with them", hint: "Post-engagement emotional state." },
  { id: "voice_sample", label: "A short sample of their voice", hint: "Email/post/note that sounds like them. Quote a representative passage if found." },
  { id: "never_sound", label: "What they never want to sound like", hint: "Anti-voice." },
  { id: "topics", label: "3-5 topics they could talk about endlessly", hint: "Comma-separated list." },
  { id: "channel", label: "Where their ideal client spends time / where past clients found them", hint: "Channels." },
  { id: "format", label: "Content format that energizes them most", hint: "Writing, video, or audio." },
  { id: "success_metric", label: "What success looks like in 90 days", hint: "Specific numbers if mentioned." },
  { id: "business_goal", label: "Business goal marketing supports", hint: "Revenue / growth goal." },
  { id: "time_capacity", label: "Time available for marketing weekly", hint: "Hours/week." },
  { id: "revenue_range", label: "Approximate annual revenue", hint: "If stated." },
  { id: "biggest_challenge", label: "Biggest marketing challenge right now", hint: "Top challenge." },
];

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MoxiemoBot/1.0)" },
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`Fetch ${url} → ${r.status}`);
    const html = await r.text();
    return htmlToText(html).slice(0, 40000);
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const text: string = (body.text || "").toString();
    const url: string | undefined = body.url;

    let sourceText = text;
    if (!sourceText && url) {
      sourceText = await fetchUrlText(url);
    }
    sourceText = (sourceText || "").slice(0, 40000).trim();
    if (!sourceText) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const questionsBlock = QUESTIONS.map((q, i) =>
      `${i + 1}. [${q.id}] ${q.label} — ${q.hint}`
    ).join("\n");

    const systemPrompt = `You are MOXIEMO, an AI CMO. You are given source material a founder uploaded (a brand deck, strategy doc, website copy, or LinkedIn profile). Extract concise, faithful answers to the discovery questions below. Only answer a question if the source contains a clear signal. If a question cannot be answered confidently from the source, set its answer to an empty string. Never invent facts. Keep each answer 1-3 sentences, written in first person as the founder would say it, plain prose, no markdown.`;

    const userPrompt = `SOURCE MATERIAL:\n"""\n${sourceText}\n"""\n\nQUESTIONS:\n${questionsBlock}\n\nReturn STRICT JSON of shape:\n{ "answers": { "<question_id>": "<answer or empty string>", ... } }\nOnly include the ids listed above.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("AI gateway error:", resp.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed", detail: errText.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    const answers: Record<string, string> = {};
    const raw = parsed.answers || parsed;
    for (const q of QUESTIONS) {
      const v = raw?.[q.id];
      if (typeof v === "string" && v.trim().length >= 3) {
        answers[q.id] = v.trim();
      }
    }

    return new Response(
      JSON.stringify({
        answers,
        questions: QUESTIONS.map((q) => ({ id: q.id, label: q.label })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("discovery-prefill error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});