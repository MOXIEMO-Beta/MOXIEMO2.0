-- Add ownership column for row-level security
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the overly permissive SELECT policy (any authenticated user could read all entries)
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON public.waitlist;

-- Drop the overly permissive UPDATE policy (any authenticated user could modify any entry)
DROP POLICY IF EXISTS "Authenticated users can update waitlist" ON public.waitlist;

-- Users can only view their own waitlist entry
CREATE POLICY "Users can view own waitlist entry"
ON public.waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);