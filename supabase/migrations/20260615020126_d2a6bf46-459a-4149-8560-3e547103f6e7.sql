ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS raw_report jsonb,
  ADD COLUMN IF NOT EXISTS validation jsonb;