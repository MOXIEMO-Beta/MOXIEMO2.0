
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  domain text,
  inputs jsonb,
  model_type text,
  low_data boolean,
  signals jsonb,
  report jsonb,
  brand_audit_score int,
  status text NOT NULL DEFAULT 'generating'
);
GRANT ALL ON public.audits TO service_role;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all client access to audits"
  ON public.audits FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  audit_id uuid REFERENCES public.audits(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  source text
);
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all client access to leads"
  ON public.leads FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);
