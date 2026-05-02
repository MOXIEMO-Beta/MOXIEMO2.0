CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text,
  website_url text,
  company_name text,
  referral_source text,
  notes text,
  status text DEFAULT 'pending',
  scheduled_call_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  beta_code_sent text DEFAULT 'MOXIE2026',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update waitlist"
  ON public.waitlist FOR UPDATE
  TO authenticated
  USING (true);

CREATE TRIGGER waitlist_touch_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();