DROP INDEX IF EXISTS public.goal_entries_user_goal_metric_period_uidx;
CREATE UNIQUE INDEX goal_entries_user_goal_metric_period_uidx
  ON public.goal_entries (user_id, goal_definition_id, metric_key, period);