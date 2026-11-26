-- =============================================================================
-- FORCE ROW LEVEL SECURITY ON ALL TABLES
--
-- Without FORCE RLS, superuser and table-owner connections bypass all policies.
-- Supabase Edge Functions run as postgres (superuser), so any function that
-- does not use service_role + explicit table policies can silently read ALL rows.
-- FORCE RLS closes this gap — policies are enforced unconditionally.
--
-- Pattern: ALTER TABLE public.X FORCE ROW LEVEL SECURITY
-- Idempotent: safe to re-run; has no effect if already forced.
-- =============================================================================

-- ─── Core user data (highest risk) ───────────────────────────────────────────
ALTER TABLE public.profiles              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_sessions    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.strategies            FORCE ROW LEVEL SECURITY;

-- ─── Social & content ────────────────────────────────────────────────────────
ALTER TABLE public.social_connections    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content_items         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_ideas        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_execution_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recommendations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_overrides FORCE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_assets   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_feed_cache     FORCE ROW LEVEL SECURITY;

-- ─── Email ───────────────────────────────────────────────────────────────────
ALTER TABLE public.email_sends           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_segments   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.suppressed_emails     FORCE ROW LEVEL SECURITY;

-- ─── Growth, usage, billing ──────────────────────────────────────────────────
ALTER TABLE public.usage_tracking        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sms_consent           FORCE ROW LEVEL SECURITY;

-- ─── Waitlists and reservations ──────────────────────────────────────────────
ALTER TABLE public.waitlist              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.beta_codes            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.beta20_founding       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reservations          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.blog_waitlist         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.resources_waitlist    FORCE ROW LEVEL SECURITY;

-- ─── Goals and onboarding ────────────────────────────────────────────────────
ALTER TABLE public.goal_entries          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.goal_definitions      FORCE ROW LEVEL SECURITY;

-- ─── Brand and audit ─────────────────────────────────────────────────────────
ALTER TABLE public.brand_kits            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kit_leads       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.brand_image_cache     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audits                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads                 FORCE ROW LEVEL SECURITY;
ALTER TABLE public.assets                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feedback              FORCE ROW LEVEL SECURITY;

-- ─── Analytics and cache ─────────────────────────────────────────────────────
ALTER TABLE public.scrape_cache          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_analytics_cache FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pending_pages_connections FORCE ROW LEVEL SECURITY;

-- ─── Feature flags (admin-managed) ───────────────────────────────────────────
ALTER TABLE public.feature_flags         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events        FORCE ROW LEVEL SECURITY;
