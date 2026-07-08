CREATE TABLE public.goal_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  strategy_id uuid,
  north_star jsonb NOT NULL DEFAULT '{}'::jsonb,
  smart_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  secondary_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_model text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_definitions TO authenticated;
GRANT ALL ON public.goal_definitions TO service_role;

ALTER TABLE public.goal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal definitions"
  ON public.goal_definitions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal definitions"
  ON public.goal_definitions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal definitions"
  ON public.goal_definitions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal definitions"
  ON public.goal_definitions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER goal_definitions_touch
  BEFORE UPDATE ON public.goal_definitions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();