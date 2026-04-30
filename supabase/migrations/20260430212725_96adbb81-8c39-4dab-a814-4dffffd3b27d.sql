
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.subscriber_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#ff6b6b',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriber_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own segments"
  ON public.subscriber_segments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own segments"
  ON public.subscriber_segments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own segments"
  ON public.subscriber_segments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own segments"
  ON public.subscriber_segments FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_system = false);

CREATE INDEX IF NOT EXISTS idx_subscriber_segments_user ON public.subscriber_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_tags ON public.subscribers USING GIN (tags);

ALTER TABLE public.email_sends
  ADD COLUMN IF NOT EXISTS segment text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS recipient_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
