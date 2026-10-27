CREATE TABLE public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id uuid NOT NULL,
  version text NOT NULL,
  preferences boolean NOT NULL DEFAULT false,
  analytics boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  gpc boolean NOT NULL DEFAULT false,
  source text NOT NULL CHECK (source IN ('banner_accept_all', 'banner_reject_all', 'panel_save', 'gpc_auto')),
  page_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cookie_consents TO anon, authenticated;
GRANT ALL ON public.cookie_consents TO service_role;
REVOKE SELECT, UPDATE, DELETE ON public.cookie_consents FROM anon, authenticated;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can append cookie choices" ON public.cookie_consents FOR INSERT TO anon, authenticated WITH CHECK (true);
COMMENT ON TABLE public.cookie_consents IS 'Append-only visitor consent evidence. Version resolves to the cookie notice and categories shown. No IP address is collected.';