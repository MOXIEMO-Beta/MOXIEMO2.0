CREATE TABLE public.brand_kit_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  source TEXT NOT NULL DEFAULT 'brand_kit_tool',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX brand_kit_leads_email_idx ON public.brand_kit_leads (email);
CREATE INDEX brand_kit_leads_created_at_idx ON public.brand_kit_leads (created_at DESC);

GRANT INSERT ON public.brand_kit_leads TO anon, authenticated;
GRANT ALL ON public.brand_kit_leads TO service_role;

ALTER TABLE public.brand_kit_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a brand kit lead"
  ON public.brand_kit_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 80
    AND char_length(last_name) BETWEEN 1 AND 80
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

CREATE POLICY "Service role manages brand kit leads"
  ON public.brand_kit_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);