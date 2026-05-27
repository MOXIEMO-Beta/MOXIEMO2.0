-- Remove the authenticated SELECT policy to prevent exposure of internal fields
-- (beta_code_sent, approved_by, notes, status) to users reading their own row.
-- Admin access continues through the admin-waitlist edge function with service_role.
DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.waitlist;