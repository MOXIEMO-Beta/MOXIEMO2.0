DROP POLICY IF EXISTS "Service role can read all feedback" ON public.feedback;

CREATE POLICY "Admins can read all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "Service role only read beta codes" ON public.beta_codes;

CREATE POLICY "Service role only read beta codes"
ON public.beta_codes
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (auth.role() = 'service_role');