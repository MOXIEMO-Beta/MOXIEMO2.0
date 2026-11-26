-- =============================================================================
-- MOXIEMO 2.0 — Cookie Consent Log
-- Records consent choices for GDPR/CCPA compliance audit trail.
-- cookieConsent.ts writes here on every saveConsent() call.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id     text,                               -- pre-auth anonymous identifier
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  version     text        NOT NULL,               -- CONSENT_VERSION constant from cookieConsent.ts
  necessary   boolean     NOT NULL DEFAULT true,
  preferences boolean     NOT NULL DEFAULT false,
  analytics   boolean     NOT NULL DEFAULT false,
  marketing   boolean     NOT NULL DEFAULT false,
  gpc         boolean     NOT NULL DEFAULT false,  -- Global Privacy Control signal
  source      text,                               -- 'banner_accept_all' | 'banner_reject_all' | 'panel_save' | 'gpc_auto'
  page_path   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents FORCE ROW LEVEL SECURITY;

-- Users can read their own consent records
CREATE POLICY "user_read_own_consents" ON public.cookie_consents
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone (including anonymous) can INSERT a consent record
CREATE POLICY "anyone_insert_consent" ON public.cookie_consents
  FOR INSERT WITH CHECK (true);

-- Service role full access for admin queries
CREATE POLICY "service_all_consents" ON public.cookie_consents
  FOR ALL USING (auth.role() = 'service_role');

-- Index for compliance queries (by user, by date)
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_created
  ON public.cookie_consents (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cookie_consents_anon_created
  ON public.cookie_consents (anon_id, created_at DESC)
  WHERE anon_id IS NOT NULL;
