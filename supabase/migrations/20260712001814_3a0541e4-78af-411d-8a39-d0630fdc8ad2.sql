
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS external_account_id text,
  ADD COLUMN IF NOT EXISTS external_provider text;

CREATE INDEX IF NOT EXISTS idx_social_connections_external
  ON public.social_connections (external_provider, external_account_id);

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS pfm_post_id text;

CREATE INDEX IF NOT EXISTS idx_social_posts_pfm_post_id
  ON public.social_posts (pfm_post_id);
