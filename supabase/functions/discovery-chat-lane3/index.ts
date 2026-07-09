import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function streamClientError(message: string, upstreamStatus = 0, detail = ""): Response {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({
    type: "error",
    message,
    upstream_status: upstreamStatus,
    detail: detail.slice(0, 300),
  });
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function formatIntake(intake: Record<string, unknown> | undefined | null): string {
  if (!intake || typeof intake !== "object") return "(no intake provided)";
  const labels: Record<string, string> = {
    offer_one_line: "Offer (one sentence)",
    offer_deliverables: "What the buyer gets",
    offer_price: "Price",
    offer_transformation: "Transformation",
    buyer_who: "Buyer (who specifically)",
    buyer_trigger: "Trigger moment",
    buyer_pain: "Pain in buyer words",
    buyer_tried: "What they already tried",
    diff_why_you: "Why you",
    diff_proof: "Proof in hand",
    diff_cost_of_inaction: "Cost of inaction",
    goal_sell_number: "Sell this many",
    goal_by_date: "By this date",
    goal_revenue: "Revenue equivalent",
    warm_list: "Warm list",
  };
  const lines: string[] = [];
  for (const [k, label] of Object.entries(labels)) {
    const v = (intake as Record<string, unknown>)[k];
    lines.push(`- ${label}: ${v ? String(v).trim() : "(blank)"}`);
  }
  return lines.join("\n");
}

function buildSystemPrompt(opts: {
  firstName?: string;
  businessName?: string;
  intake?: Record<string, unknown> | null;
}): string {
  const firstName = (opts.firstName || "there").trim() || "there";
  const intakeBlock = formatIntake(opts.intake ?? null);
  const opening = `Hey ${firstName}. I read through your offer intake. Let us sharpen the parts that will make or break the launch. Ready?`;

  return `You are MOXIEMO, an AI Chief Marketing Officer working with a founder who is launching one specific offer. The founder has already completed a structured intake worksheet covering the offer, the buyer, the differentiation, and the revenue goal. Your ONLY job in this conversation is to review that intake, find the weakest and thinnest answers, and sharpen them through a short, focused conversation.

DO NOT re-ask questions the intake already answered. Reference what they wrote and probe from there.
DO NOT tell the user you cannot help them or that their offer is not ready. Readiness was already validated. Your job is to sharpen, not to gate.
DO NOT use em dashes or contractions.

TONE: Direct, warm, respectful. Like a senior strategist who values their time. Acknowledge briefly, then move on. No fluff.

HOW TO WORK:
1. Read the intake below.
2. Pick the 4 to 6 weakest or thinnest answers. Weak means: vague, generic, missing a specific, or internally inconsistent with another answer.
3. Ask ONE sharpening question at a time. Reference the intake directly. Example: "You wrote that your buyer is a founder who is stuck. Which founder, at what stage, stuck on what."
4. Confirm each sharper answer in a single sentence, then move to the next.
5. If everything looks strong, tell the user that plainly and ask only 1 or 2 clarifying questions.

FORMAT:
- Announce a short section header when you shift focus, for example "Sharpening: the buyer" or "Sharpening: the goal".
- At the END of every response, append on its own line: [MODE:standard|coaching|placeholder] [Q:1-6]
- After you have sharpened the last item and confirmed it, output the token <STRATEGY_COMPLETE> on its own line, then on the next line write exactly this closing message and nothing else: "Your answers are locked in. The full go to market build for this offer is next."

FOUNDER INTAKE:
${intakeBlock}

CONVERSATION START:
Open with this exact message and then ask your first sharpening question: "${opening}"`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, userContext, offerIntake } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const systemPrompt = buildSystemPrompt({
      firstName: userContext?.firstName,
      businessName: userContext?.businessName,
      intake: offerIntake ?? null,
    });

    const anthropicMessages = Array.isArray(messages) && messages.length > 0
      ? messages.map((m: any) => ({ role: m.role, content: m.content }))
      : [{ role: "user", content: "Start the review conversation." }];

    async function callAnthropic(timeoutMs: number): Promise<Response> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            stream: true,
            system: systemPrompt,
            messages: anthropicMessages,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    }

    let response: Response | null = null;
    let lastStatus = 0;
    let lastErrText = "";
    const backoffMs = [2000, 5000];
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const r = await callAnthropic(30000);
        if (r.ok) { response = r; break; }
        lastStatus = r.status;
        lastErrText = await r.text().catch(() => "");
        console.error(`Anthropic error (attempt ${attempt}):`, r.status, lastErrText);
        if (r.status === 429 || r.status === 402) {
          notifyAdminCritical(req, { functionName: "discovery-chat-lane3", status: r.status, detail: lastErrText });
        }
        const retryable = r.status === 429 || r.status >= 500;
        if (!retryable) break;
        if (attempt < maxAttempts) {
          const retryAfterHeader = r.headers.get("retry-after");
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
          const baseDelay = !isNaN(retryAfterSec) && retryAfterSec > 0
            ? Math.min(retryAfterSec * 1000, 8000)
            : backoffMs[attempt - 1];
          const jitter = Math.floor(Math.random() * 400);
          await new Promise((res) => setTimeout(res, baseDelay + jitter));
        }
      } catch (err) {
        console.warn(`discovery-chat-lane3 attempt ${attempt} threw:`, String(err));
        lastErrText = String(err);
        if (attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, backoffMs[attempt - 1] + Math.floor(Math.random() * 400)));
        }
      }
    }

    if (!response) {
      return streamClientError("MOXIEMO is thinking, just a moment.", lastStatus, lastErrText);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response!.body!.getReader();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta") {
                  const text = parsed.delta?.text ?? "";
                  if (text) {
                    const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
                    controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                  }
                }
                if (parsed.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // skip
              }
            }
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("discovery-chat-lane3 error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});