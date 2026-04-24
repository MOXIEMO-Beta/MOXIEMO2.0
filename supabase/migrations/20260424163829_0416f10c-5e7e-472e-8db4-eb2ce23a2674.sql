ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS methodology TEXT,
  ADD COLUMN IF NOT EXISTS archetype JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_themes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS calendar_entries JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_health JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS use_words JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_cached JSONB DEFAULT '{}'::jsonb;