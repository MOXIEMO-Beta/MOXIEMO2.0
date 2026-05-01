
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  content_by_platform jsonb NOT NULL DEFAULT '{}'::jsonb,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  canva_design_id text,
  pillar text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  platform_post_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own social posts" ON public.social_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own social posts" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own social posts" ON public.social_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own social posts" ON public.social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON public.social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_status ON public.social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_scheduled ON public.social_posts(user_id, scheduled_for);

CREATE TRIGGER trg_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.social_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  engagement_rate numeric NOT NULL DEFAULT 0,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own social analytics" ON public.social_analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own social analytics" ON public.social_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own social analytics" ON public.social_analytics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own social analytics" ON public.social_analytics FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_analytics_user ON public.social_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_post ON public.social_analytics(post_id);
