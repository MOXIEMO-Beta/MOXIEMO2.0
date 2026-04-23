ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS strength_score INTEGER,
  ADD COLUMN IF NOT EXISTS strength_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS weak_areas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strong_areas JSONB DEFAULT '[]'::jsonb;