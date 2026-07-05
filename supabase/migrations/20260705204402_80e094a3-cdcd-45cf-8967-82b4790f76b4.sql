ALTER TABLE public.goal_entries
  ADD COLUMN IF NOT EXISTS mrr integer,
  ADD COLUMN IF NOT EXISTS retention_pct integer,
  ADD COLUMN IF NOT EXISTS testimonials integer;