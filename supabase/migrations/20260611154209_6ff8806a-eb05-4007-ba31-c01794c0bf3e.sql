
CREATE OR REPLACE FUNCTION public.consume_generation(p_platform text, p_campaign_id uuid, p_preview text, p_dry_run boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_limit int;
  v_used int := 0;
  v_unlimited boolean := false;
  v_reset_date timestamptz;
  v_last_reset timestamptz;
  v_month text;
  v_row_id uuid;
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

  -- Find the user's most recent usage row (active 30-day period).
  -- We no longer key by calendar month — that caused apparent resets on the
  -- 1st of each calendar month. Now we maintain a single rolling window per
  -- user and only reset once 30 days have elapsed since last_reset.
  SELECT id, month, generations_used, last_reset, reset_date
    INTO v_row_id, v_month, v_used, v_last_reset, v_reset_date
    FROM public.usage_tracking
    WHERE user_id = v_user
    ORDER BY COALESCE(last_reset, created_at) DESC NULLS LAST
    LIMIT 1;

  IF v_row_id IS NULL THEN
    -- First-ever generation row for this user.
    v_month := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
    v_last_reset := now();
    v_reset_date := now() + interval '30 days';
    INSERT INTO public.usage_tracking (user_id, month, generations_used, last_reset, reset_date)
    VALUES (v_user, v_month, 0, v_last_reset, v_reset_date)
    ON CONFLICT (user_id, month) DO UPDATE
      SET last_reset = EXCLUDED.last_reset,
          reset_date = EXCLUDED.reset_date
    RETURNING id, generations_used INTO v_row_id, v_used;
  END IF;

  -- Backfill reset_date for legacy rows.
  IF v_reset_date IS NULL THEN
    v_reset_date := COALESCE(v_last_reset, now()) + interval '30 days';
    UPDATE public.usage_tracking
      SET reset_date = v_reset_date
      WHERE id = v_row_id;
  END IF;

  -- Rolling 30-day reset: only fire when the current period has truly elapsed.
  IF now() >= v_reset_date THEN
    -- Advance the window in 30-day increments to avoid drift.
    WHILE now() >= v_reset_date LOOP
      v_reset_date := v_reset_date + interval '30 days';
    END LOOP;
    v_last_reset := now();
    v_month := to_char((v_last_reset AT TIME ZONE 'UTC'), 'YYYY-MM');

    -- Try to update in place; if the new month label collides with another
    -- legacy row for this user, just keep the existing month label.
    BEGIN
      UPDATE public.usage_tracking
        SET generations_used = 0,
            last_reset = v_last_reset,
            reset_date = v_reset_date,
            month = v_month
        WHERE id = v_row_id;
    EXCEPTION WHEN unique_violation THEN
      UPDATE public.usage_tracking
        SET generations_used = 0,
            last_reset = v_last_reset,
            reset_date = v_reset_date
        WHERE id = v_row_id
        RETURNING month INTO v_month;
    END;
    v_used := 0;
  END IF;

  IF NOT v_unlimited AND v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'limit_reached',
      'plan', v_plan,
      'used', v_used,
      'limit', v_limit,
      'month', v_month,
      'reset_date', v_reset_date
    );
  END IF;

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'plan', v_plan,
      'used', v_used,
      'limit', v_limit,
      'month', v_month,
      'reset_date', v_reset_date
    );
  END IF;

  UPDATE public.usage_tracking
    SET generations_used = generations_used + 1
    WHERE id = v_row_id
    RETURNING generations_used INTO v_used;

  INSERT INTO public.generation_history (user_id, platform, campaign_id, content_preview)
  VALUES (v_user, p_platform, p_campaign_id, LEFT(COALESCE(p_preview, ''), 100));

  RETURN jsonb_build_object(
    'allowed', true,
    'plan', v_plan,
    'used', v_used,
    'limit', v_limit,
    'month', v_month,
    'reset_date', v_reset_date
  );
END;
$function$;
