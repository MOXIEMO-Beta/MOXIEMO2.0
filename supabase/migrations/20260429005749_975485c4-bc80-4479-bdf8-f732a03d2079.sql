CREATE TABLE IF NOT EXISTS public.goal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_of date NOT NULL,
  discovery_calls integer NOT NULL DEFAULT 0,
  posts_published integer NOT NULL DEFAULT 0,
  email_opens integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_of)
);

ALTER TABLE public.goal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own goal entries"
  ON public.goal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own goal entries"
  ON public.goal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own goal entries"
  ON public.goal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own goal entries"
  ON public.goal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER goal_entries_touch_updated_at
  BEFORE UPDATE ON public.goal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS goal_entries_user_week_idx
  ON public.goal_entries (user_id, week_of DESC);