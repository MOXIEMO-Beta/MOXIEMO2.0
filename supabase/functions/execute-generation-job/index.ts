/**
 * execute-generation-job
 *
 * Called by private.generation_queue_dispatch() (pg_cron, every 10s) with the
 * job payload already written to generation_jobs.status = 'running'.
 *
 * Responsibilities:
 *   1. Validate the payload and load the discovery snapshot (immutable input)
 *   2. Run the AI synthesis stage (strategy generation)
 *   3. Write results to strategies + strategy_sections
 *   4. Mark the job completed via complete_generation_job() RPC
 *   5. On any unrecoverable error: call fail_generation_job() RPC
 *
 * This function is NOT called directly by the browser. It is an internal
 * worker function: verify_jwt = false, but callers must supply the service
 * role key as Bearer token (enforced below).
 *
 * Timeout budget: Supabase Edge Functions hard-limit is 150s.
 * The synthesis call gets 130s; 20s is reserved for DB reads/writes.
 */

import { notifyAdminCritical } from "../_shared/anthropic-alert.ts";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
import { sanitizeDashesDeep } from "../_shared/sanitize-dashes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPayload {
  job_id:      string;
  user_id:     string;
  session_id:  string | null;
  snapshot_id: string | null;
  brand_id:    string | null;
  job_type:    string;
  lane:        string;
  stage:       string;
  checkpoint:  Record<string, unknown>;
  attempt:     number;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });


  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
  const wallStart = Date.now();
  const WALL_BUDGET_MS = 130_000;
  const remainingMs = () => Math.max(5_000, WALL_BUDGET_MS - (Date.now() - wallStart));

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey      = Deno.env.get("ANTHROPIC_API_KEY")!;

  // ── Auth: only service_role callers (the cron dispatcher) may invoke this.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7) !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: JobPayload;
  try {
    payload = await req.json() as JobPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { job_id, user_id, session_id, snapshot_id, brand_id, lane, attempt } = payload;

  if (!job_id || !user_id) {
    return new Response(JSON.stringify({ error: "Missing job_id or user_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[execute-generation-job] start job=${job_id} lane=${lane} attempt=${attempt}`);

  // ─── Shared DB helper ───────────────────────────────────────────────────────

  async function dbGet(path: string): Promise<unknown> {
    const r = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!r.ok) throw new Error(`DB GET ${path} → ${r.status}`);
    return r.json();
  }

  async function dbRpc(fn: string, args: Record<string, unknown>): Promise<void> {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`RPC ${fn} → ${r.status}: ${t}`);
    }
  }

  async function failJob(error: string) {
    const durationMs = Date.now() - wallStart;
    console.error(`[execute-generation-job] FAIL job=${job_id}: ${error}`);
    try {
      await dbRpc("fail_generation_job", { p_job_id: job_id, p_error: error.slice(0, 1000), p_duration_ms: durationMs });
    } catch (e) {
      console.error("[execute-generation-job] fail_generation_job RPC failed:", e);
    }
  }

  // Cost per 1M tokens: claude-3-5-sonnet $3 input / $15 output (chars ÷ 4 ≈ tokens)
  function estimateCostUsd(model: string | undefined, promptChars: number, outputChars: number): number {
    const inputTokens  = promptChars  / 4;
    const outputTokens = outputChars  / 4;
    if (model?.includes("opus")) {
      return (inputTokens * 15 + outputTokens * 75) / 1_000_000;
    }
    // Default: sonnet pricing
    return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }

  async function completeJob(opts: {
    snapshotId?: string;
    model?: string;
    promptChars?: number;
    outputChars?: number;
  }) {
    const durationMs = Date.now() - wallStart;
    const costUsd = opts.promptChars != null && opts.outputChars != null
      ? estimateCostUsd(opts.model, opts.promptChars, opts.outputChars)
      : null;
    try {
      await dbRpc("complete_generation_job", {
        p_job_id:       job_id,
        p_snapshot_id:  opts.snapshotId ?? null,
        p_model:        opts.model ?? null,
        p_prompt_chars: opts.promptChars ?? null,
        p_output_chars: opts.outputChars ?? null,
        p_duration_ms:  durationMs,
        p_cost_usd:     costUsd,
      });
    } catch (e) {
      console.error("[execute-generation-job] complete_generation_job RPC failed:", e);
    }
  }

  // ─── 1. Load transcript from snapshot (immutable) or fall back to session ──

  let transcript = "";
  let resolvedSnapshotId = snapshot_id;
  let offerIntake: Record<string, unknown> | null = null;
  let offerGate:   Record<string, unknown> | null = null;

  try {
    if (snapshot_id) {
      const rows = await dbGet(
        `discovery_snapshots?id=eq.${snapshot_id}&select=messages,lane`
      ) as Array<{ messages: Array<{ role: string; content: string }>; lane: string }>;
      const snap = Array.isArray(rows) ? rows[0] : null;
      if (snap?.messages?.length) {
        transcript = snap.messages
          .map((m) => `${m.role === "user" ? "USER" : "MOXIEMO"}: ${m.content}`)
          .join("\n\n");
      }
    }

    // Fallback: load live session messages (creates snapshot for next time)
    if (!transcript && session_id) {
      const sessRows = await dbGet(
        `discovery_sessions?id=eq.${session_id}&select=messages,answers,lane`
      ) as Array<{ messages: Array<{ role: string; content: string }>; answers: unknown; lane: string }>;
      const sess = Array.isArray(sessRows) ? sessRows[0] : null;
      if (sess?.messages?.length) {
        transcript = sess.messages
          .map((m) => `${m.role === "user" ? "USER" : "MOXIEMO"}: ${m.content}`)
          .join("\n\n");

        // Create snapshot so future retries use immutable data
        if (user_id && transcript) {
          try {
            const encoder = new TextEncoder();
            const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(transcript));
            const hashHex = Array.from(new Uint8Array(hashBuf))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
            const snapRes = await fetch(`${supabaseUrl}/rest/v1/discovery_snapshots`, {
              method: "POST",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                session_id,
                user_id,
                brand_id: brand_id ?? null,
                lane: lane ?? "lane1",
                messages: sess.messages,
                transcript_hash: hashHex,
              }),
            });
            if (snapRes.ok) {
              const snapRows = await snapRes.json().catch(() => []);
              const snap = Array.isArray(snapRows) ? snapRows[0] : snapRows;
              if (snap?.id) resolvedSnapshotId = snap.id;
            }
          } catch (e) {
            console.warn("[execute-generation-job] snapshot creation failed (non-blocking):", e);
          }
        }

        // Load Lane 3 intake from session answers
        if (lane === "offer_gtm" && sess.answers && typeof sess.answers === "object") {
          const ans = sess.answers as Record<string, unknown>;
          offerIntake = (ans.offer_intake ?? null) as Record<string, unknown> | null;
          offerGate   = (ans.offer_gate   ?? null) as Record<string, unknown> | null;
        }
      }
    }
  } catch (e) {
    await failJob(`transcript load failed: ${String(e)}`);
    return new Response(JSON.stringify({ error: "transcript_load_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!transcript) {
    await failJob("no transcript available — session has no messages");
    return new Response(JSON.stringify({ error: "no_transcript" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─── 2. Delegate to synthesize-strategy (the proven AI pipeline) ───────────
  // Rather than duplicate the 1174-line synthesis logic, call synthesize-strategy
  // in JSON response mode with the transcript already loaded. This keeps a single
  // source of truth for prompts, tool schemas, and post-processing.
  // The job queue's value is: retry orchestration, stuck-job recovery, and
  // cost tracking — not a rewrite of the synthesis logic itself.

  const synthUrl = `${supabaseUrl}/functions/v1/synthesize-strategy`;
  let synthResult: Record<string, unknown> | null = null;
  let promptChars = 0;
  let outputChars = 0;

  try {
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), remainingMs() - 5_000);

    // Build the same payload synthesize-strategy expects, but pass the
    // transcript directly (we already loaded it from the snapshot above)
    // and request JSON response mode so it doesn't SSE-stream.
    const synthBody: Record<string, unknown> = {
      transcript,
      sessionId:    session_id,
      lane:         lane === "offer_gtm" ? "offer_gtm" : lane,
      responseMode: "json",
    };
    if (lane === "offer_gtm") {
      synthBody.offerIntake = offerIntake;
      synthBody.offerGate   = offerGate;
    }

    promptChars = JSON.stringify(synthBody).length;

    const synthRes = await fetch(synthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${serviceKey}`,
        apikey:         serviceKey,
      },
      body: JSON.stringify(synthBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(abortTimer));

    if (!synthRes.ok) {
      const errBody = await synthRes.text().catch(() => "");
      if (synthRes.status === 409) {
        // Duplicate in-flight — this job raced with a direct synthesize-strategy
        // call from the browser. Mark completed since the result was already saved.
        console.log(`[execute-generation-job] 409 duplicate — marking completed job=${job_id}`);
        await completeJob({ snapshotId: resolvedSnapshotId ?? undefined });
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (synthRes.status === 408) {
        await failJob("SYNTHESIS_TIMEOUT");
        notifyAdminCritical(req, { functionName: "execute-generation-job", status: 408, detail: "synthesis timeout" });
        return new Response(JSON.stringify({ error: "synthesis_timeout" }), {
          status: 408,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`synthesize-strategy → ${synthRes.status}: ${errBody.slice(0, 400)}`);
    }

    synthResult = await synthRes.json().catch(() => null);
    if (!synthResult) throw new Error("synthesize-strategy returned empty body");
    outputChars = JSON.stringify(synthResult).length;

  } catch (e) {
    const err = e as Error;
    if (err?.name === "AbortError") {
      await failJob("SYNTHESIS_TIMEOUT — wall budget exceeded");
      notifyAdminCritical(req, { functionName: "execute-generation-job", status: 408, detail: "AbortError" });
      return new Response(JSON.stringify({ error: "synthesis_timeout" }), {
        status: 408,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await failJob(String(e));
    return new Response(JSON.stringify({ error: "synthesis_failed", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─── 3. Mark job completed ──────────────────────────────────────────────────

  await completeJob({
    snapshotId:  resolvedSnapshotId ?? undefined,
    model:       "claude-sonnet-4-5",
    promptChars,
    outputChars,
  });

  console.log(
    `[execute-generation-job] completed job=${job_id} lane=${lane} ` +
    `duration_ms=${Date.now() - wallStart} prompt_chars=${promptChars} output_chars=${outputChars}`
  );

  return new Response(JSON.stringify({ ok: true, job_id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
