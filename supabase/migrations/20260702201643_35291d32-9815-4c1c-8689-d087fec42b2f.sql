DROP INDEX IF EXISTS public.social_connections_user_platform_type_org_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS uq_social_connections_personal
  ON public.social_connections (user_id, platform)
  WHERE connection_type = 'personal';

CREATE UNIQUE INDEX IF NOT EXISTS uq_social_connections_company
  ON public.social_connections (user_id, platform, organization_id)
  WHERE connection_type = 'company';