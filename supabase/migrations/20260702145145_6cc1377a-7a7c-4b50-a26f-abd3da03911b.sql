CREATE TABLE public.content_calendar_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  override_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_calendar_overrides TO authenticated;
GRANT ALL ON public.content_calendar_overrides TO service_role;

ALTER TABLE public.content_calendar_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar overrides"
  ON public.content_calendar_overrides FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER content_calendar_overrides_touch
  BEFORE UPDATE ON public.content_calendar_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX content_calendar_overrides_user_idx ON public.content_calendar_overrides (user_id);