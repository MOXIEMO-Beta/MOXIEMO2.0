
-- Explicit deny: nobody (anon/authenticated) reads beta_codes via PostgREST
CREATE POLICY "Service role only read beta codes"
ON public.beta_codes
AS PERMISSIVE
FOR SELECT
TO public
USING (auth.role() = 'service_role');
