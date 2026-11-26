-- =============================================================================
-- MOXIEMO 2.0 — Admin JWT Claim (replaces runtime profiles.is_admin query)
-- Sets app_role = 'admin' in the JWT for users where profiles.is_admin = true.
-- The claim is set by handle_auth_user_jwt() called from the JWT hook.
-- No browser-side DB query needed — the claim is in the token itself.
-- =============================================================================

-- Function called by Supabase "JWT claims" hook (Auth > Hooks > Custom JWT Claims).
-- Returns a JSON object merged into the JWT `app_metadata` section.
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Look up is_admin for this user (single fast PK lookup — no cross-row exposure)
  SELECT CASE WHEN is_admin = true THEN 'admin' ELSE 'member' END
  INTO user_role
  FROM public.profiles
  WHERE id = (event->>'userId')::uuid;

  -- Build claims. Supabase merges this into app_metadata in the JWT.
  claims := jsonb_build_object('app_role', COALESCE(user_role, 'member'));

  RETURN claims;
END;
$$;

-- Only the service role and postgres can call this function.
-- Revoke from public so no authenticated user can call it directly.
REVOKE ALL ON FUNCTION public.custom_jwt_claims(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_jwt_claims(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.custom_jwt_claims(jsonb) TO postgres;

-- ---------------------------------------------------------------------------
-- Update all RLS policies that check profiles.is_admin to ALSO accept the
-- JWT claim app_role = 'admin'. This provides defence-in-depth:
-- JWT claim check is O(1) (no DB query); profiles check is the fallback.
-- ---------------------------------------------------------------------------

-- Helper function: returns true if the calling JWT has app_role = 'admin'
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'app_role') = 'admin',
      false
    )
    OR
    -- Fallback: profiles.is_admin for callers without a refreshed token
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO service_role;

-- ---------------------------------------------------------------------------
-- Replace all existing admin RLS policies to use is_app_admin()
-- This is idempotent: DROP IF EXISTS before CREATE.
-- ---------------------------------------------------------------------------

-- feature_flags
DROP POLICY IF EXISTS "admin read feature_flags" ON public.feature_flags;
DROP POLICY IF EXISTS "admin write feature_flags" ON public.feature_flags;
CREATE POLICY "admin read feature_flags" ON public.feature_flags
  FOR SELECT USING (public.is_app_admin());
CREATE POLICY "admin write feature_flags" ON public.feature_flags
  FOR ALL USING (public.is_app_admin());

-- reservations
DROP POLICY IF EXISTS "admin read reservations" ON public.reservations;
CREATE POLICY "admin read reservations" ON public.reservations
  FOR SELECT USING (public.is_app_admin());

-- sms_consent
DROP POLICY IF EXISTS "admin read sms_consent" ON public.sms_consent;
CREATE POLICY "admin read sms_consent" ON public.sms_consent
  FOR SELECT USING (public.is_app_admin());

-- accounts
DROP POLICY IF EXISTS "admin full access accounts" ON public.accounts;
CREATE POLICY "admin full access accounts" ON public.accounts
  FOR ALL USING (public.is_app_admin());

-- brands
DROP POLICY IF EXISTS "admin full access brands" ON public.brands;
CREATE POLICY "admin full access brands" ON public.brands
  FOR ALL USING (public.is_app_admin());
