
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  theme text,
  campaign_type text DEFAULT 'quarterly',
  start_date date,
  end_date date,
  status text DEFAULT 'planned',
  channels text[] DEFAULT '{}',
  content_plan jsonb DEFAULT '{}'::jsonb,
  goals text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER campaigns_touch_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

ALTER TABLE public.email_sends
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.calendar_ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  idea_text text NOT NULL,
  idea_type text,
  channel text,
  pillar text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false,
  converted boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.calendar_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own calendar ideas" ON public.calendar_ideas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own calendar ideas" ON public.calendar_ideas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own calendar ideas" ON public.calendar_ideas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own calendar ideas" ON public.calendar_ideas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS campaigns_user_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS calendar_ideas_user_idx ON public.calendar_ideas(user_id);
CREATE INDEX IF NOT EXISTS social_posts_campaign_idx ON public.social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS content_items_campaign_idx ON public.content_items(campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_campaign_idx ON public.email_sends(campaign_id);
