-- ─────────────────────────────────────────────────────────────────────────────
-- PIPELINE SAFETY MIGRATION
-- Fixes:
--   #1 Idempotency: generation_jobs table (prevents double-generation)
--   #2 Immutable input: discovery_snapshots (pipeline reads frozen data only)
--   #3 Paid content gate at DB row level: strategy_sections with is_paid + RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. GENERATION JOBS ─────────────────────────────────────────────────────
-- One row per pipeline run. INSERT conflicts on idempotency_key = no-op.
-- Prevents double-generation if the user double-taps or a network retry fires.

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key  text        NOT NULL UNIQUE,          -- "{user_id}:{session_id}:{epoch_hour}"
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  job_type         text        NOT NULL DEFAULT 'strategy',
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','running','completed','failed','timeout')),
  lane             text,                                 -- 'lane1' | 'lane2' | 'offer_gtm'
  session_id       uuid        REFERENCES public.discovery_sessions(id) ON DELETE SET NULL,
  snapshot_id      uuid,                                 -- FK to discovery_snapshots added below
  model            text,
  prompt_chars     int,
  output_chars     int,
  duration_ms      int,
  error_detail     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  completed_at     timestamptz
);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs FORCE ROW LEVEL SECURITY;

-- Users see only their own jobs
CREATE POLICY "user_read_own_jobs" ON public.generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role writes (edge functions run with service key)
CREATE POLICY "service_all_jobs" ON public.generation_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Index for admin dashboard and cost monitoring
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_created
  ON public.generation_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_type
  ON public.generation_jobs (status, job_type);


-- ─── 2. DISCOVERY SNAPSHOTS ─────────────────────────────────────────────────
-- Immutable point-in-time freeze of a discovery session.
-- synthesize-strategy MUST write a snapshot at the start of the pipeline,
-- then read only from the snapshot — never from live discovery_sessions.messages.

CREATE TABLE IF NOT EXISTS public.discovery_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid        NOT NULL REFERENCES public.discovery_sessions(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  lane             text,
  messages         jsonb       NOT NULL DEFAULT '[]',
  answers          jsonb,
  transcript_hash  text        NOT NULL,                 -- sha256 of transcript for audit trail
  frozen_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discovery_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_snapshots FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_read_own_snapshots" ON public.discovery_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_all_snapshots" ON public.discovery_snapshots
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_discovery_snapshots_session
  ON public.discovery_snapshots (session_id, frozen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_snapshots_user
  ON public.discovery_snapshots (user_id, frozen_at DESC);

-- Add snapshot FK back to generation_jobs
ALTER TABLE public.generation_jobs
  ADD CONSTRAINT fk_generation_jobs_snapshot
  FOREIGN KEY (snapshot_id) REFERENCES public.discovery_snapshots(id) ON DELETE SET NULL;


-- ─── 3. STRATEGY SECTIONS — PAID GATE AT DB ROW LEVEL ───────────────────────
-- The strategy page shows sections from this table.
-- Rows with is_paid = true are hidden by RLS unless the user has an active paid plan.
-- The strategies.enhanced_foundation JSONB blob stays as the write-side cache;
-- this table is the read-side gate.

CREATE TABLE IF NOT EXISTS public.strategy_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id  uuid        NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_key  text        NOT NULL,                     -- e.g. 'positioning', 'voice', 'pillars'
  sort_order   smallint    NOT NULL DEFAULT 0,
  is_paid      boolean     NOT NULL DEFAULT false,
  content      jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (strategy_id, section_key)
);

ALTER TABLE public.strategy_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_sections FORCE ROW LEVEL SECURITY;

-- Free sections: visible to any authenticated user who owns the strategy
CREATE POLICY "user_read_free_sections" ON public.strategy_sections
  FOR SELECT USING (
    auth.uid() = user_id
    AND is_paid = false
  );

-- Paid sections: visible only when user has active paid plan
-- Check both profiles and accounts tables (dual-write architecture)
CREATE POLICY "user_read_paid_sections" ON public.strategy_sections
  FOR SELECT USING (
    auth.uid() = user_id
    AND is_paid = true
    AND (
      -- Check accounts table (MOX2-3 source of truth)
      EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.owner_id = auth.uid()
          AND a.subscription_status = 'active'
          AND a.plan != 'founding_member'
      )
      OR
      -- Fallback: check profiles (legacy, kept during migration period)
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.subscription_status = 'active'
          AND p.plan != 'founding_member'
      )
    )
  );

-- Service role writes all sections (synthesize-strategy populates on completion)
CREATE POLICY "service_all_sections" ON public.strategy_sections
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_strategy_sections_strategy_sort
  ON public.strategy_sections (strategy_id, is_paid, sort_order);

CREATE INDEX IF NOT EXISTS idx_strategy_sections_user
  ON public.strategy_sections (user_id, is_paid);


-- ─── 4. HELPER FUNCTION: check_strategy_access ──────────────────────────────
-- Returns whether the calling user can see paid strategy sections.
-- Call from the UI: SELECT public.check_strategy_access();

CREATE OR REPLACE FUNCTION public.check_strategy_access()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'has_access', (
      EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.owner_id = auth.uid()
          AND a.subscription_status = 'active'
          AND a.plan != 'founding_member'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.subscription_status = 'active'
          AND p.plan != 'founding_member'
      )
    ),
    'plan', (
      SELECT COALESCE(a.plan, p.plan, 'founding_member')
      FROM public.profiles p
      LEFT JOIN public.accounts a ON a.owner_id = p.id
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_strategy_access() TO authenticated;
