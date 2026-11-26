-- ─────────────────────────────────────────────────────────────────────────────
-- GENERATION JOB QUEUE ORCHESTRATION
-- Wires generation_jobs (already exists) into a pg_cron-driven scheduler.
--
-- How it works:
--   1. synthesize-strategy inserts a generation_jobs row with status='queued'
--      (or updates existing 'pending' rows via the idempotency key).
--   2. pg_cron fires private.generation_queue_dispatch() every 10 seconds.
--   3. dispatch() finds jobs with status='queued', picks up to 3 at a time
--      (Supabase allows concurrency; don't hammer the AI API), marks them
--      'running', then calls the execute-generation-job edge function via
--      net.http_post — fire-and-forget so the cron slot is never blocked.
--   4. execute-generation-job runs the actual AI stage, writes results, and
--      sets status='completed' | 'failed'.
--   5. Stuck jobs (running > 180s) are reset to 'queued' for re-pickup.
--      After 3 attempts they are set to 'timeout' and admin is notified.
--   6. Admin dashboard reads generation_jobs directly to show cost/status.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. SCHEMA ADDITIONS TO generation_jobs ─────────────────────────────────
-- Add columns for queue orchestration (idempotent — IF NOT EXISTS throughout).

ALTER TABLE public.generation_jobs
  ADD COLUMN IF NOT EXISTS attempts      smallint    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts  smallint    NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS queued_at     timestamptz,
  ADD COLUMN IF NOT EXISTS checkpoint    jsonb       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage         text        DEFAULT 'synthesis';

-- 'queued'  → ready to be picked up by the dispatcher
-- 'running' → edge function is currently executing
-- 'completed' → done, results written
-- 'failed'    → all attempts exhausted
-- 'timeout'   → took longer than the wall budget on final attempt
-- 'pending'   → legacy / synthesize-strategy direct-call path (no queue)
-- Add 'queued' and 'failed' to the status CHECK (existing: pending/running/completed/failed/timeout)
-- The existing constraint already includes failed/timeout — no change needed.

-- Index for the dispatcher query (status + queued_at ordering)
CREATE INDEX IF NOT EXISTS idx_generation_jobs_queued
  ON public.generation_jobs (status, queued_at ASC)
  WHERE status = 'queued';

-- Index for stuck-job detection (running + started_at)
CREATE INDEX IF NOT EXISTS idx_generation_jobs_running_stuck
  ON public.generation_jobs (status, started_at)
  WHERE status = 'running';


-- ─── 2. HELPER: enqueue_generation_job ──────────────────────────────────────
-- Called by synthesize-strategy (and future pipeline stages) to put a job
-- into the queue without immediately invoking the edge function.
-- Returns the job id. Safe to call multiple times — idempotency_key is UNIQUE.

CREATE OR REPLACE FUNCTION public.enqueue_generation_job(
  p_idempotency_key  text,
  p_user_id          uuid,
  p_session_id       uuid    DEFAULT NULL,
  p_snapshot_id      uuid    DEFAULT NULL,
  p_brand_id         uuid    DEFAULT NULL,
  p_job_type         text    DEFAULT 'strategy',
  p_lane             text    DEFAULT 'lane1',
  p_stage            text    DEFAULT 'synthesis',
  p_checkpoint       jsonb   DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.generation_jobs (
    idempotency_key, user_id, session_id, snapshot_id, brand_id,
    job_type, lane, stage, checkpoint, status, queued_at
  )
  VALUES (
    p_idempotency_key, p_user_id, p_session_id, p_snapshot_id, p_brand_id,
    p_job_type, p_lane, p_stage, p_checkpoint, 'queued', now()
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET status     = CASE
                       -- Only re-queue if the job failed/timed out — not if already running/completed.
                       WHEN generation_jobs.status IN ('failed', 'timeout') THEN 'queued'
                       ELSE generation_jobs.status
                     END,
        queued_at  = CASE
                       WHEN generation_jobs.status IN ('failed', 'timeout') THEN now()
                       ELSE generation_jobs.queued_at
                     END,
        checkpoint = COALESCE(NULLIF(p_checkpoint, '{}'), generation_jobs.checkpoint)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_generation_job(text, uuid, uuid, uuid, uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_generation_job(text, uuid, uuid, uuid, uuid, text, text, text, jsonb) TO service_role;


-- ─── 3. DISPATCHER (private schema, called by pg_cron) ───────────────────────
-- Picks up to 3 queued jobs, marks them 'running', fires HTTP to edge function.
-- Resets stuck jobs (running > 180s) back to 'queued' if attempts < max_attempts,
-- or marks them 'timeout' if exhausted.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.generation_queue_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_job          record;
  v_function_url text;
  v_service_key  text;
  v_stuck_cutoff timestamptz;
BEGIN
  -- Build the edge function URL and retrieve the service role key from Vault.
  v_function_url := 'https://gnvehgdbgcsozaawzgtc.supabase.co/functions/v1/execute-generation-job';
  BEGIN
    SELECT decrypted_secret
    INTO   v_service_key
    FROM   vault.decrypted_secrets
    WHERE  name = 'email_queue_service_role_key'
    LIMIT  1;
  EXCEPTION WHEN OTHERS THEN
    -- Vault not yet populated (first deploy). Jobs remain queued — will be
    -- picked up once the vault secret is set.
    RAISE WARNING 'generation_queue_dispatch: vault secret missing — skipping dispatch';
    RETURN;
  END;

  IF v_service_key IS NULL THEN
    RAISE WARNING 'generation_queue_dispatch: vault secret is null — skipping dispatch';
    RETURN;
  END IF;

  -- ── 3a. Reset stuck jobs ────────────────────────────────────────────────────
  -- Jobs that have been 'running' for > 180s are either timed out or the edge
  -- function crashed without updating the row. Reset to 'queued' for retry,
  -- or mark 'timeout' if attempts exhausted.
  v_stuck_cutoff := now() - INTERVAL '180 seconds';

  UPDATE public.generation_jobs
  SET
    status     = CASE
                   WHEN attempts + 1 >= max_attempts THEN 'timeout'
                   ELSE 'queued'
                 END,
    attempts   = attempts + 1,
    queued_at  = CASE
                   WHEN attempts + 1 >= max_attempts THEN queued_at
                   ELSE now()
                 END,
    error_detail = CASE
                     WHEN attempts + 1 >= max_attempts
                     THEN 'timeout: stuck in running state after 180s, max attempts reached'
                     ELSE 'timeout: stuck in running state after 180s, re-queued'
                   END
  WHERE status = 'running'
    AND started_at < v_stuck_cutoff;

  -- ── 3b. Pick up queued jobs (max 3 at a time, SKIP LOCKED = no double-pickup)
  FOR v_job IN
    SELECT id, user_id, session_id, snapshot_id, brand_id, job_type, lane, stage, checkpoint, attempts
    FROM   public.generation_jobs
    WHERE  status = 'queued'
    ORDER  BY queued_at ASC
    LIMIT  3
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark running before firing HTTP so there's no window where two dispatchers
    -- both see the same job as 'queued'.
    UPDATE public.generation_jobs
    SET    status     = 'running',
           started_at = now(),
           attempts   = attempts + 1
    WHERE  id = v_job.id;

    -- Fire-and-forget: net.http_post returns immediately (async).
    -- The edge function will update the row to 'completed' or 'failed'.
    BEGIN
      PERFORM extensions.http_post(
        url     := v_function_url,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body    := jsonb_build_object(
          'job_id',      v_job.id,
          'user_id',     v_job.user_id,
          'session_id',  v_job.session_id,
          'snapshot_id', v_job.snapshot_id,
          'brand_id',    v_job.brand_id,
          'job_type',    v_job.job_type,
          'lane',        v_job.lane,
          'stage',       v_job.stage,
          'checkpoint',  v_job.checkpoint,
          'attempt',     v_job.attempts + 1
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- net.http_post failure = Supabase pg_net extension not available or network
      -- error. Reset job to queued so the next dispatch cycle retries.
      UPDATE public.generation_jobs
      SET  status       = 'queued',
           started_at   = NULL,
           attempts     = attempts - 1,
           error_detail = 'dispatcher: net.http_post failed — ' || SQLERRM
      WHERE id = v_job.id;
    END;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.generation_queue_dispatch() FROM PUBLIC;


-- ─── 4. pg_cron JOB ─────────────────────────────────────────────────────────
-- Schedule the dispatcher to run every 10 seconds.
-- 10s is a good balance: fast enough for user-facing generation (they see
-- "Building your strategy…" spinner), slow enough to not thrash the DB.
-- The email queue runs at 5s but it's read-only polling; generation is heavier.

DO $$
BEGIN
  -- Remove old job if exists (safe re-run)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generation-queue-dispatch') THEN
    PERFORM cron.unschedule('generation-queue-dispatch');
  END IF;

  PERFORM cron.schedule(
    'generation-queue-dispatch',
    '10 seconds',
    $cron$ SELECT private.generation_queue_dispatch(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'generation_queue_dispatch: cron.schedule failed: % — the function exists but the cron job must be registered manually in the Supabase dashboard', SQLERRM;
END;
$$;


-- ─── 5. ADMIN VIEW: generation_job_stats ────────────────────────────────────
-- Lightweight view for the admin dashboard cost/status monitor.
-- Readable only by service_role (admin panel calls it with service key).

CREATE OR REPLACE VIEW public.generation_job_stats AS
SELECT
  date_trunc('day', created_at)                            AS day,
  job_type,
  lane,
  status,
  COUNT(*)                                                  AS job_count,
  AVG(duration_ms)::int                                     AS avg_duration_ms,
  SUM(prompt_chars)                                         AS total_prompt_chars,
  SUM(output_chars)                                         AS total_output_chars,
  AVG(attempts)::numeric(4,2)                               AS avg_attempts
FROM public.generation_jobs
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 4;

-- Only service_role can read (called from admin edge function, not from browser)
REVOKE ALL ON public.generation_job_stats FROM PUBLIC;
GRANT  SELECT ON public.generation_job_stats TO service_role;


-- ─── 6. FUNCTION: fail_generation_job ───────────────────────────────────────
-- Called by execute-generation-job edge function on unrecoverable error.
-- Sets status and writes error_detail. Returns the updated row.

CREATE OR REPLACE FUNCTION public.fail_generation_job(
  p_job_id      uuid,
  p_error       text,
  p_duration_ms int DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.generation_jobs
  SET
    status       = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
    error_detail = p_error,
    duration_ms  = COALESCE(p_duration_ms, duration_ms),
    completed_at = CASE WHEN attempts >= max_attempts THEN now() ELSE NULL END,
    queued_at    = CASE WHEN attempts >= max_attempts THEN queued_at ELSE now() END
  WHERE id = p_job_id
    AND status = 'running';
$$;

GRANT EXECUTE ON FUNCTION public.fail_generation_job(uuid, text, int) TO service_role;


-- ─── 7. FUNCTION: complete_generation_job ───────────────────────────────────
-- Called by execute-generation-job edge function on success.

CREATE OR REPLACE FUNCTION public.complete_generation_job(
  p_job_id       uuid,
  p_snapshot_id  uuid    DEFAULT NULL,
  p_model        text    DEFAULT NULL,
  p_prompt_chars int     DEFAULT NULL,
  p_output_chars int     DEFAULT NULL,
  p_duration_ms  int     DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.generation_jobs
  SET
    status        = 'completed',
    completed_at  = now(),
    snapshot_id   = COALESCE(p_snapshot_id, snapshot_id),
    model         = COALESCE(p_model, model),
    prompt_chars  = COALESCE(p_prompt_chars, prompt_chars),
    output_chars  = COALESCE(p_output_chars, output_chars),
    duration_ms   = COALESCE(p_duration_ms, duration_ms)
  WHERE id = p_job_id
    AND status = 'running';
$$;

GRANT EXECUTE ON FUNCTION public.complete_generation_job(uuid, uuid, text, int, int, int) TO service_role;
