
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS photographer text,
  ADD COLUMN IF NOT EXISTS pexels_url text,
  ADD COLUMN IF NOT EXISTS pexels_id bigint;

-- Backfill display_name from filename where missing
UPDATE public.assets
  SET display_name = COALESCE(display_name, filename)
  WHERE display_name IS NULL;

-- Helpful indexes for search + sort
CREATE INDEX IF NOT EXISTS assets_user_uploaded_at_idx ON public.assets (user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS assets_tags_gin_idx ON public.assets USING GIN (tags);
CREATE UNIQUE INDEX IF NOT EXISTS assets_user_pexels_id_idx ON public.assets (user_id, pexels_id) WHERE pexels_id IS NOT NULL;
