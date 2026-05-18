
CREATE TABLE IF NOT EXISTS public.generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text,
  campaign_id uuid,
  content_preview text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_history_user_time
  ON public.generation_history (user_id, generated_at DESC);

ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generation history"
  ON public.generation_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own generation history"
  ON public.generation_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_generation(
  p_platform text,
  p_campaign_id uuid,
  p_preview text,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_limit int;
  v_month text := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
  v_used int := 0;
  v_unlimited boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'unauthorized');
  END IF;

  SELECT COALESCE(plan, 'founding_member') INTO v_plan
    FROM public.profiles WHERE id = v_user;
  IF v_plan IS NULL THEN v_plan := 'founding_member'; END IF;

  v_limit := CASE v_plan
    WHEN 'founding_member' THEN 25
    WHEN 'foundation' THEN 100
    ELSE NULL
  END;
  v_unlimited := v_limit IS NULL;

  -- Ensure a row exists for the current UTC month (handles rollover)
  INSERT INTO public.usage_tracking (user_id, month, generations_used, last_reset)
  VALUES (v_user, v_month, 0, now())
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT generations_used INTO v_used
    FROM public.usage_tracking
    WHERE user_id = v_user AND month = v_month;

  IF NOT v_unlimited AND v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'limit_reached',
      'plan', v_plan,
      'used', v_used,
      'limit', v_limit,
      'month', v_month
    );
  END IF;

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'plan', v_plan,
      'used', v_used,
      'limit', v_limit,
      'month', v_month
    );
  END IF;

  UPDATE public.usage_tracking
    SET generations_used = generations_used + 1
    WHERE user_id = v_user AND month = v_month
    RETURNING generations_used INTO v_used;

  INSERT INTO public.generation_history (user_id, platform, campaign_id, content_preview)
  VALUES (v_user, p_platform, p_campaign_id, LEFT(COALESCE(p_preview, ''), 100));

  RETURN jsonb_build_object(
    'allowed', true,
    'plan', v_plan,
    'used', v_used,
    'limit', v_limit,
    'month', v_month
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_generation(text, uuid, text, boolean) TO authenticated;
