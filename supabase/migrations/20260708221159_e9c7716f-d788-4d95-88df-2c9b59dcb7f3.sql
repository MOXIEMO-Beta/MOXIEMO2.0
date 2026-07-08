ALTER TABLE public.goal_entries
  DROP CONSTRAINT IF EXISTS goal_entries_user_id_week_of_key;

ALTER TABLE public.goal_entries
  ADD CONSTRAINT goal_entries_goal_definition_id_fkey
  FOREIGN KEY (goal_definition_id)
  REFERENCES public.goal_definitions(id)
  ON DELETE CASCADE;

DROP INDEX IF EXISTS public.goal_entries_user_metric_period_uidx;
CREATE UNIQUE INDEX goal_entries_user_goal_metric_period_uidx
  ON public.goal_entries (user_id, goal_definition_id, metric_key, period)
  WHERE goal_definition_id IS NOT NULL AND metric_key IS NOT NULL AND period IS NOT NULL;