
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.social_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  url text NOT NULL,
  filename text,
  media_type text CHECK (media_type IN ('image','video')),
  size_bytes integer
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_assets TO authenticated;
GRANT ALL ON public.social_media_assets TO service_role;
ALTER TABLE public.social_media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social assets" ON public.social_media_assets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.pillar_feed_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  angles_json jsonb NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pillar_feed_cache TO authenticated;
GRANT ALL ON public.pillar_feed_cache TO service_role;
ALTER TABLE public.pillar_feed_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pillar cache" ON public.pillar_feed_cache
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
