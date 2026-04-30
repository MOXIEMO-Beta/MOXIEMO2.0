CREATE TABLE public.social_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  profile_name text,
  profile_url text,
  profile_image text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own social connections"
  ON public.social_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own social connections"
  ON public.social_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own social connections"
  ON public.social_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own social connections"
  ON public.social_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_social_connections_user_platform ON public.social_connections(user_id, platform);