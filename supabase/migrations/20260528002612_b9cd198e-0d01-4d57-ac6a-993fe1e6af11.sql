-- feedback table: allow authenticated users to read their own feedback
CREATE POLICY "Users view own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- feedback table: allow service_role to read all feedback for admin review
CREATE POLICY "Service role can read all feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.role() = 'service_role'::text);

-- waitlist table: restrictive service_role-only SELECT policy
CREATE POLICY "Service role only read waitlist" ON public.waitlist AS RESTRICTIVE FOR SELECT TO public USING (auth.role() = 'service_role'::text);