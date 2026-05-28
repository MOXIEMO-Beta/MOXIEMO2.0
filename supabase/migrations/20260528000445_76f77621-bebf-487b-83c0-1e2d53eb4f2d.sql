
-- Fix 1: Prevent is_admin escalation via direct profile UPDATE
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.is_admin := OLD.is_admin;
  NEW.plan := OLD.plan;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_priv_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_priv_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Fix 2a: Lock down beta_codes — drop public SELECT policy
DROP POLICY IF EXISTS "Anyone can validate beta codes" ON public.beta_codes;
REVOKE SELECT ON public.beta_codes FROM anon, authenticated;

-- Fix 2d: Remove hardcoded default beta code from waitlist
ALTER TABLE public.waitlist ALTER COLUMN beta_code_sent DROP DEFAULT;

-- Fix 4: Lock down blog_waitlist and resources_waitlist reads
REVOKE SELECT ON public.blog_waitlist FROM anon, authenticated;
REVOKE SELECT ON public.resources_waitlist FROM anon, authenticated;

CREATE POLICY "Service role only read blog waitlist"
ON public.blog_waitlist
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only read resources waitlist"
ON public.resources_waitlist
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.role() = 'service_role');

-- Fix 5: Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC and authenticated
-- Keep authenticated access only on consume_generation (called by client) — others are server/trigger only.
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_waitlist_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.consume_generation(text, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_generation(text, uuid, text, boolean) TO authenticated;

-- Fix 6: Set immutable search_path on functions that don't have one
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;
