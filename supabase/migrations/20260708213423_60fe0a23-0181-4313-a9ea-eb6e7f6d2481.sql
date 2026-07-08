
ALTER TABLE public.goal_entries ALTER COLUMN paying_users DROP NOT NULL;
ALTER TABLE public.goal_entries ALTER COLUMN discovery_calls DROP NOT NULL;
ALTER TABLE public.goal_entries ALTER COLUMN posts_published DROP NOT NULL;
ALTER TABLE public.goal_entries ALTER COLUMN email_opens DROP NOT NULL;
ALTER TABLE public.goal_entries ALTER COLUMN week_of DROP NOT NULL;

ALTER TABLE public.goal_entries ADD COLUMN IF NOT EXISTS metric_key text;
ALTER TABLE public.goal_entries ADD COLUMN IF NOT EXISTS value numeric;
ALTER TABLE public.goal_entries ADD COLUMN IF NOT EXISTS period text;
ALTER TABLE public.goal_entries ADD COLUMN IF NOT EXISTS goal_definition_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS goal_entries_user_metric_period_uidx
  ON public.goal_entries (user_id, metric_key, period)
  WHERE metric_key IS NOT NULL;
