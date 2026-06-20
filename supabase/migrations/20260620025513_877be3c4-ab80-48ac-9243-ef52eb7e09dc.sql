
DROP POLICY IF EXISTS "Anyone can join beta20 founding waitlist" ON public.beta20_founding;
REVOKE INSERT ON public.beta20_founding FROM anon, authenticated;
