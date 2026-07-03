ALTER TABLE public.brand_image_cache ADD COLUMN IF NOT EXISTS search_terms jsonb;
DELETE FROM public.pillar_feed_cache;