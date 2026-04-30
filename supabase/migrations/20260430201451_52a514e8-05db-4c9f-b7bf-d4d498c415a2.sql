
CREATE TABLE public.subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text,
  status text DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscribers" ON public.subscribers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscribers" ON public.subscribers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscribers" ON public.subscribers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subscribers" ON public.subscribers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);

CREATE TABLE public.email_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text,
  body text,
  sent_at timestamptz,
  recipient_count integer,
  resend_email_id text,
  open_rate numeric,
  click_rate numeric
);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email sends" ON public.email_sends FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own email sends" ON public.email_sends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own email sends" ON public.email_sends FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own email sends" ON public.email_sends FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_email_sends_user_id ON public.email_sends(user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{}';
