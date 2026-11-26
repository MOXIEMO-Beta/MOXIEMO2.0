-- Stripe columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status   text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS current_period_end    timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- feature_flags table (Karee can toggle features without a deploy)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write feature_flags
CREATE POLICY "admin read feature_flags" ON public.feature_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin write feature_flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed required flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('texting_live',         false, 'SMS / Text MOXIE feature is live'),
  ('early_doors',          false, 'Early doors / founding seats open'),
  ('strategy_paywall',     false, 'Strategy page paywall is active'),
  ('stripe_live_mode',     false, 'Stripe is in live mode (not test)'),
  ('sms_outbound',         false, 'Outbound SMS sender active'),
  ('growth_reads',         false, 'Day 7/14 growth reads active')
ON CONFLICT (key) DO NOTHING;

-- reservations table (hold-a-spot, MOX2-8)
CREATE TABLE IF NOT EXISTS public.reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text,
  email           text NOT NULL,
  business_type   text,
  goal            text,
  session_picked  text,
  session_time    text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can reserve), only admins can read
CREATE POLICY "public insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin read reservations" ON public.reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- sms_consent table (legal requirement for texting)
CREATE TABLE IF NOT EXISTS public.sms_consent (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       text NOT NULL,
  consented   boolean NOT NULL DEFAULT false,
  source      text,     -- 'settings', '/text', 'onboarding'
  ip_address  text,
  user_agent  text,
  consented_at timestamptz,
  opted_out_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.sms_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user read own sms_consent" ON public.sms_consent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user insert sms_consent" ON public.sms_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user update sms_consent" ON public.sms_consent
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "admin read sms_consent" ON public.sms_consent
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- tracked_links table (moxie.link short URLs)
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        text UNIQUE NOT NULL,
  destination text NOT NULL,
  clicks      integer NOT NULL DEFAULT 0,
  post_id     uuid,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manage tracked_links" ON public.tracked_links
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tracked_links_slug ON public.tracked_links (slug);
CREATE INDEX IF NOT EXISTS idx_tracked_links_user ON public.tracked_links (user_id);
