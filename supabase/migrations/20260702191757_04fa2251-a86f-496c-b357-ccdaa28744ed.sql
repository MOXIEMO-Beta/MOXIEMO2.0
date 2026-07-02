
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'personal'
    CHECK (connection_type IN ('personal', 'company'));
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS organization_name text;

ALTER TABLE public.social_connections
  DROP CONSTRAINT IF EXISTS social_connections_user_id_platform_key;

CREATE UNIQUE INDEX IF NOT EXISTS social_connections_user_platform_type_org_uniq
  ON public.social_connections (user_id, platform, connection_type, COALESCE(organization_id, ''));

CREATE TABLE IF NOT EXISTS public.pending_pages_connections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token   text NOT NULL,
  refresh_token  text,
  expires_at     timestamptz NOT NULL,
  organizations  jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_pages_connections TO authenticated;
GRANT ALL ON public.pending_pages_connections TO service_role;

ALTER TABLE public.pending_pages_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pending connections" ON public.pending_pages_connections;
CREATE POLICY "Users manage own pending connections"
  ON public.pending_pages_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
