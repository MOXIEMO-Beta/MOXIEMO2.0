
CREATE TABLE public.beta20_founding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  role TEXT,
  company TEXT,
  website TEXT,
  tier_interest TEXT NOT NULL DEFAULT 'unsure' CHECK (tier_interest IN ('foundation','growth','scale','unsure')),
  referral_source TEXT,
  source TEXT NOT NULL DEFAULT 'pricing_page',
  status TEXT NOT NULL DEFAULT 'waitlisted',
  user_id UUID
);

GRANT INSERT ON public.beta20_founding TO anon, authenticated;
GRANT ALL ON public.beta20_founding TO service_role;

ALTER TABLE public.beta20_founding ENABLE ROW LEVEL SECURITY;

-- Anyone may add themselves to the Beta 2.0 founding waitlist
CREATE POLICY "Anyone can join beta20 founding waitlist"
ON public.beta20_founding FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can read/update/delete
CREATE POLICY "Admins can view beta20 founding"
ON public.beta20_founding FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update beta20 founding"
ON public.beta20_founding FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can delete beta20 founding"
ON public.beta20_founding FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
