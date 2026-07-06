
CREATE TABLE public.linkedin_analytics_cache (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  window_days int NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, window_days)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_analytics_cache TO authenticated;
GRANT ALL ON public.linkedin_analytics_cache TO service_role;
ALTER TABLE public.linkedin_analytics_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own linkedin cache" ON public.linkedin_analytics_cache
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
