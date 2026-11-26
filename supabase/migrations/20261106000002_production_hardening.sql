-- =============================================================================
-- MOXIEMO 2.0 — Production Hardening Migration
-- MOX2-1, MOX2-3, MOX2-6, MOX2-7, MOX2-8, MOX2-12/13, MOX2-14, MOX2-16
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. HELPERS
-- ---------------------------------------------------------------------------

-- Reusable updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


-- ---------------------------------------------------------------------------
-- 1. PROFILES — Stripe columns + plan normalisation
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS subscription_status     text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS current_period_end      timestamptz,
  ADD COLUMN IF NOT EXISTS business_type           text,
  ADD COLUMN IF NOT EXISTS location                text;

-- Normalise plan values that were seeded as 'free_beta' in earlier migrations
UPDATE public.profiles SET plan = 'founding_member' WHERE plan = 'free_beta';

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_plan_status
  ON public.profiles (plan, subscription_status);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);


-- ---------------------------------------------------------------------------
-- 2. FEATURE FLAGS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read feature_flags"  ON public.feature_flags;
DROP POLICY IF EXISTS "admin write feature_flags" ON public.feature_flags;

CREATE POLICY "admin read feature_flags" ON public.feature_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin write feature_flags" ON public.feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed flags — all OFF by default
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('texting_live',         false, 'SMS / Text MOXIE feature is carrier-approved and live'),
  ('early_doors',          false, 'Early doors / founding seats open pre-launch'),
  ('strategy_paywall',     true,  'Strategy page paywall active for founding_member plan'),
  ('stripe_live_mode',     false, 'Stripe is in live mode — test mode while false'),
  ('sms_outbound',         false, 'Outbound SMS sender active after 10DLC approval'),
  ('growth_reads',         false, 'Day 7/14 growth reads active'),
  ('moxie_audit_bubble',   false, 'Bubble 1 (free audit) visible — hidden until block 3 ships'),
  ('resume_bubble',        false, 'Bubble 3 (pick up where I left off) visible — hidden pre-launch'),
  ('launch_mode',          false, 'App is in pre-launch / doors-closed mode')
ON CONFLICT (key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. RESERVATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text,                           -- anonymous device ID pre-auth
  email           text NOT NULL,
  business_type   text,                           -- from MoxieChatCard bubble form
  goal            text,
  session_picked  text,                           -- display label shown to user
  session_time    text,                           -- ISO or slot key
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  confirmation_sent_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert reservations"  ON public.reservations;
DROP POLICY IF EXISTS "admin read reservations"     ON public.reservations;

CREATE POLICY "public insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin read reservations" ON public.reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_email
  ON public.reservations (lower(email));

CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON public.reservations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_utm
  ON public.reservations (utm_source, utm_campaign);


-- ---------------------------------------------------------------------------
-- 4. SMS CONSENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sms_consent (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         text NOT NULL,
  consented     boolean NOT NULL DEFAULT false,
  source        text NOT NULL DEFAULT 'unknown',  -- 'settings' | '/text' | 'onboarding'
  ip_address    text,
  user_agent    text,
  consented_at  timestamptz,
  opted_out_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user read own sms_consent"   ON public.sms_consent;
DROP POLICY IF EXISTS "user insert sms_consent"     ON public.sms_consent;
DROP POLICY IF EXISTS "user update sms_consent"     ON public.sms_consent;
DROP POLICY IF EXISTS "admin read sms_consent"      ON public.sms_consent;
DROP POLICY IF EXISTS "anon insert sms_consent"     ON public.sms_consent;

CREATE POLICY "user read own sms_consent" ON public.sms_consent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user insert sms_consent" ON public.sms_consent
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "user update sms_consent" ON public.sms_consent
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "anon insert sms_consent" ON public.sms_consent
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "admin read sms_consent" ON public.sms_consent
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_sms_consent_phone_active
  ON public.sms_consent (phone)
  WHERE opted_out_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sms_consent_user
  ON public.sms_consent (user_id)
  WHERE user_id IS NOT NULL;

CREATE TRIGGER trg_sms_consent_updated
  BEFORE UPDATE ON public.sms_consent
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 5. TRACKED LINKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tracked_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  destination text NOT NULL,
  clicks      integer NOT NULL DEFAULT 0,
  post_id     uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user manage tracked_links" ON public.tracked_links;

CREATE POLICY "user manage tracked_links" ON public.tracked_links
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracked_links_slug
  ON public.tracked_links (slug);

CREATE INDEX IF NOT EXISTS idx_tracked_links_user_created
  ON public.tracked_links (user_id, created_at DESC);

CREATE TRIGGER trg_tracked_links_updated
  BEFORE UPDATE ON public.tracked_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 6. SOCIAL POSTS
-- ---------------------------------------------------------------------------

-- Rename scheduled_for → scheduled_at first (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.social_posts RENAME COLUMN scheduled_for TO scheduled_at;
  END IF;
END $$;

ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS moxie_note text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Partial index: excludes terminal states so the working set stays small
CREATE INDEX IF NOT EXISTS idx_social_posts_user_sched_status
  ON public.social_posts (user_id, scheduled_at, status)
  WHERE status NOT IN ('published', 'failed');

-- Webhook lookup by external post ID returned by Zernio / Post For Me
CREATE INDEX IF NOT EXISTS idx_social_posts_pfm_id
  ON public.social_posts (pfm_post_id)
  WHERE pfm_post_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 7. SOCIAL CONNECTIONS
-- ---------------------------------------------------------------------------

ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS external_account_id text,
  ADD COLUMN IF NOT EXISTS external_provider   text;

CREATE INDEX IF NOT EXISTS idx_sc_external_provider_account
  ON public.social_connections (external_provider, external_account_id)
  WHERE external_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sc_user_platform_type
  ON public.social_connections (user_id, platform, connection_type);


-- ---------------------------------------------------------------------------
-- 8. DISCOVERY SESSIONS
-- ---------------------------------------------------------------------------

-- GIN on the answers JSONB column; synthesize-strategy queries it by key
CREATE INDEX IF NOT EXISTS idx_discovery_answers_gin
  ON public.discovery_sessions USING GIN (answers);

CREATE INDEX IF NOT EXISTS idx_discovery_user_status
  ON public.discovery_sessions (user_id, status);


-- ---------------------------------------------------------------------------
-- 9. STRATEGIES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_strategies_user_updated
  ON public.strategies (user_id, updated_at DESC);


-- ---------------------------------------------------------------------------
-- 10. USAGE TRACKING
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month
  ON public.usage_tracking (user_id, month);


-- ---------------------------------------------------------------------------
-- 11. GENERATION HISTORY
-- ---------------------------------------------------------------------------

-- generation_history uses generated_at (not created_at); generation_type may not exist
CREATE INDEX IF NOT EXISTS idx_gen_history_user_generated
  ON public.generation_history (user_id, generated_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_history' AND column_name = 'generation_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_gen_history_type_generated ON public.generation_history (generation_type, generated_at DESC)';
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 12. WAITLIST
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_waitlist_status_created
  ON public.waitlist (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_email
  ON public.waitlist (lower(email));


-- ---------------------------------------------------------------------------
-- 13. EMAIL SENDS (uses sent_at, not created_at)
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_sends' AND column_name='sent_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_sends_user_sent ON public.email_sends (user_id, sent_at DESC)';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_sends' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_sends_user_created ON public.email_sends (user_id, created_at DESC)';
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 14. SUBSCRIBERS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='subscribers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscribers' AND column_name='status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_subscribers_user_status ON public.subscribers (user_id, status) WHERE status = ''active''';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 15. CAMPAIGNS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='campaigns') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns' AND column_name='start_date') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_campaigns_user_dates ON public.campaigns (user_id, start_date, end_date)';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 16. BRAND KITS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='brand_kits') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='brand_kits' AND column_name='created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_brand_kits_user_created ON public.brand_kits (user_id, created_at DESC)';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 17. AUDITS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audits') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audits' AND column_name='status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_audits_user_status ON public.audits (user_id, status) WHERE user_id IS NOT NULL';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 18. GOAL ENTRIES
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='goal_entries') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='goal_entries' AND column_name='period') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_goal_entries_user_period ON public.goal_entries (user_id, period DESC) WHERE period IS NOT NULL';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 19. ANALYTICS CACHE
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='linkedin_analytics_cache') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='linkedin_analytics_cache' AND column_name='fetched_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_li_analytics_user_fetched ON public.linkedin_analytics_cache (user_id, fetched_at DESC) WHERE user_id IS NOT NULL';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 20. SCRAPE CACHE
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scrape_cache') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scrape_cache' AND column_name='url') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_scrape_cache_url ON public.scrape_cache (url) WHERE url IS NOT NULL';
    END IF;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 21. WEBHOOK EVENTS — idempotency for all webhook providers
--     Zernio, Stripe, and Twilio all retry failed deliveries.
--     INSERT on duplicate id is a no-op; prevents double-processing.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              text PRIMARY KEY,            -- provider event ID used as idempotency key
  provider        text NOT NULL,               -- 'zernio' | 'stripe' | 'twilio'
  event_type      text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  processed_at    timestamptz NOT NULL DEFAULT now(),
  error           text
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type
  ON public.webhook_events (provider, event_type, processed_at DESC);


-- ---------------------------------------------------------------------------
-- 22. HERO STATE TABLE  (MOX2-7: page state read from DB, not hardcoded)
--    Controls which MOXIE bubbles and sections show based on feature_flags.
--    App reads feature_flags directly; this table is for future CMS-level control.
-- ---------------------------------------------------------------------------
-- (Bubble visibility is controlled via feature_flags: moxie_audit_bubble,
--  resume_bubble, launch_mode — no separate table needed.)


-- ---------------------------------------------------------------------------
-- 23. AUTOVACUUM tuning — write-heavy tables
--     Default scale_factor=0.2 means vacuum only triggers after 20% of rows change.
--     For tables with high insert/update rates, 0.01 triggers vacuum much sooner,
--     keeping dead tuple bloat low and index scans fast.
-- ---------------------------------------------------------------------------

ALTER TABLE public.social_posts
  SET (autovacuum_vacuum_scale_factor = 0.01,
       autovacuum_analyze_scale_factor = 0.005);

ALTER TABLE public.social_connections
  SET (autovacuum_vacuum_scale_factor = 0.01,
       autovacuum_analyze_scale_factor = 0.005);

ALTER TABLE public.usage_tracking
  SET (autovacuum_vacuum_scale_factor = 0.01,
       autovacuum_analyze_scale_factor = 0.005);

ALTER TABLE public.profiles
  SET (autovacuum_vacuum_scale_factor = 0.01,
       autovacuum_analyze_scale_factor = 0.005);


-- ---------------------------------------------------------------------------
-- 24. RLS — enable on tables that may have been created without it
-- ---------------------------------------------------------------------------

-- goal_entries
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='goal_entries') THEN
    ALTER TABLE public.goal_entries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- goal_definitions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='goal_definitions') THEN
    ALTER TABLE public.goal_definitions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- campaign_execution_items
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='campaign_execution_items') THEN
    ALTER TABLE public.campaign_execution_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- campaign_recommendations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='campaign_recommendations') THEN
    ALTER TABLE public.campaign_recommendations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- social_media_assets
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='social_media_assets') THEN
    ALTER TABLE public.social_media_assets ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- pillar_feed_cache
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='pillar_feed_cache') THEN
    ALTER TABLE public.pillar_feed_cache ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- brand_image_cache
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='brand_image_cache') THEN
    ALTER TABLE public.brand_image_cache ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- tracked_links (already done above)
-- webhook_events (already done above)


-- ---------------------------------------------------------------------------
-- 25. FUNCTION: get_feature_flag(key text) → boolean
--    Called from edge functions to check flags without a separate DB round-trip.
--    Returns false if flag does not exist (safe default).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_feature_flag(flag_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.feature_flags WHERE key = flag_key),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_feature_flag(text) TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 26. FUNCTION: reserve_spot_idempotent
--    Upsert a reservation — same email = update, not duplicate.
--    Called by reserve-spot edge function.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reserve_spot(
  p_email          text,
  p_business_type  text DEFAULT NULL,
  p_goal           text DEFAULT NULL,
  p_session_picked text DEFAULT NULL,
  p_session_time   text DEFAULT NULL,
  p_visitor_id     text DEFAULT NULL,
  p_utm_source     text DEFAULT NULL,
  p_utm_medium     text DEFAULT NULL,
  p_utm_campaign   text DEFAULT NULL,
  p_utm_content    text DEFAULT NULL,
  p_utm_term       text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.reservations (
    email, business_type, goal, session_picked, session_time, visitor_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term
  ) VALUES (
    lower(p_email), p_business_type, p_goal, p_session_picked, p_session_time, p_visitor_id,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term
  )
  ON CONFLICT (lower(email)) DO UPDATE
    SET business_type  = EXCLUDED.business_type,
        goal           = COALESCE(EXCLUDED.goal, reservations.goal),
        session_picked = COALESCE(EXCLUDED.session_picked, reservations.session_picked),
        session_time   = COALESCE(EXCLUDED.session_time, reservations.session_time),
        utm_source     = COALESCE(EXCLUDED.utm_source, reservations.utm_source),
        utm_medium     = COALESCE(EXCLUDED.utm_medium, reservations.utm_medium),
        utm_campaign   = COALESCE(EXCLUDED.utm_campaign, reservations.utm_campaign)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_spot TO anon, authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 27. FUNCTION: increment_link_clicks(slug text)
--    Atomic counter increment — no race condition vs SELECT+UPDATE.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_link_clicks(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.tracked_links SET clicks = clicks + 1 WHERE slug = p_slug;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_clicks(text) TO anon, authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 28. STRIPE COLUMNS on profiles (guard if added in prior migration)
-- ---------------------------------------------------------------------------

-- Already handled via IF NOT EXISTS in Section 1 above.
-- Webhook events idempotency for Stripe added in Section 21.


-- ---------------------------------------------------------------------------
-- 29. ANALYSE all modified tables so the query planner uses new indexes
-- ---------------------------------------------------------------------------

ANALYZE public.profiles;
ANALYZE public.social_posts;
ANALYZE public.social_connections;
ANALYZE public.usage_tracking;
ANALYZE public.strategies;
ANALYZE public.discovery_sessions;
ANALYZE public.reservations;
ANALYZE public.feature_flags;
ANALYZE public.sms_consent;
ANALYZE public.tracked_links;
