ALTER TABLE public.discovery_sessions
  ADD COLUMN IF NOT EXISTS synthesis_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS synthesis_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS synthesis_last_error TEXT,
  ADD COLUMN IF NOT EXISTS synthesis_completed_at TIMESTAMPTZ;

ALTER TABLE public.discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_synthesis_status_check;
ALTER TABLE public.discovery_sessions
  ADD CONSTRAINT discovery_sessions_synthesis_status_check
  CHECK (synthesis_status IN ('pending','in_progress','completed','failed'));

-- Backfill: completed sessions with a strategy row → completed.
UPDATE public.discovery_sessions ds
   SET synthesis_status = 'completed',
       synthesis_completed_at = COALESCE(ds.synthesis_completed_at, ds.completed_at, now())
 WHERE ds.status = 'completed'
   AND EXISTS (SELECT 1 FROM public.strategies s WHERE s.user_id = ds.user_id);

-- Backfill: completed sessions without strategy → pending so they re-trigger.
UPDATE public.discovery_sessions ds
   SET synthesis_status = 'pending',
       synthesis_attempts = 0,
       synthesis_last_error = NULL
 WHERE ds.status = 'completed'
   AND NOT EXISTS (SELECT 1 FROM public.strategies s WHERE s.user_id = ds.user_id);

-- In-progress / not-completed sessions: pending makes most sense.
UPDATE public.discovery_sessions
   SET synthesis_status = 'pending'
 WHERE synthesis_status IS NULL;