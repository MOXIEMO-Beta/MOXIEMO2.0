ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS task_completion jsonb NOT NULL DEFAULT '{}'::jsonb;