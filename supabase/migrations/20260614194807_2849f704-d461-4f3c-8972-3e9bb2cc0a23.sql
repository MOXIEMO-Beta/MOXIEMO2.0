CREATE TABLE public.scrape_cache (
  domain TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.scrape_cache TO service_role;
ALTER TABLE public.scrape_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to scrape_cache"
  ON public.scrape_cache FOR SELECT
  USING (false);