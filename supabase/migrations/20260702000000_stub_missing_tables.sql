-- =============================================================================
-- STUB: Tables and functions created directly in production by Lovable that
-- were never captured in migration files. This stub ensures local dev works.
-- All statements use CREATE IF NOT EXISTS so they are no-ops in production.
-- =============================================================================

-- assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  url           text NOT NULL,
  filename      text,
  file_type     text,
  file_size_kb  numeric,
  platform_tag  text,
  uploaded_at   timestamptz DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assets' AND policyname='assets_owner') THEN
    CREATE POLICY "assets_owner" ON public.assets FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- brand_image_cache table
CREATE TABLE IF NOT EXISTS public.brand_image_cache (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  images_json   jsonb NOT NULL DEFAULT '[]',
  search_terms  jsonb,
  generated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_image_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brand_image_cache' AND policyname='brand_image_cache_owner') THEN
    CREATE POLICY "brand_image_cache_owner" ON public.brand_image_cache FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- email_queue_wake and email_queue_dispatch stub functions
-- (created by Lovable platform, moved to private schema by later migrations)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION public.email_queue_wake()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.email_queue_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NULL;
END;
$function$;
