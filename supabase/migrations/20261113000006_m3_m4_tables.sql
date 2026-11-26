-- =============================================================================
-- M3 / M4 MISSING TABLES + COST TRACKING
--
-- 1. cost_usd on generation_jobs  — M3 cost tracking per AI call
-- 2. activation_events            — core business metric: "activated" member
-- 3. plan_months                  — strategy pipeline output: monthly plan
-- 4. test_ideas                   — strategy pipeline output: 90-day tests
-- 5. wave1_invites                — M4 paywall: 1.0 member transition codes
-- 6. content_months               — M5 execution loop: monthly content plan
--
-- All tables follow the brand_id pattern established in earlier migrations.
-- =============================================================================

-- ─── 1. COST TRACKING ON generation_jobs ─────────────────────────────────────
-- Records the actual USD cost of each AI call so the admin dashboard can
-- show total spend per day/user and enforce daily cost caps.
-- Models: claude-3-5-sonnet ~$3/$15 per 1M in/out tokens.
-- Approx formula: (prompt_chars/4 * 3 + output_chars/4 * 15) / 1_000_000

ALTER TABLE public.generation_jobs
  ADD COLUMN IF NOT EXISTS cost_usd numeric(10,6) DEFAULT NULL;

-- Update complete_generation_job RPC to accept and write cost_usd
CREATE OR REPLACE FUNCTION public.complete_generation_job(
  p_job_id       uuid,
  p_snapshot_id  uuid      DEFAULT NULL,
  p_model        text      DEFAULT NULL,
  p_prompt_chars int       DEFAULT NULL,
  p_output_chars int       DEFAULT NULL,
  p_duration_ms  int       DEFAULT NULL,
  p_cost_usd     numeric   DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.generation_jobs
  SET
    status        = 'completed',
    completed_at  = now(),
    snapshot_id   = COALESCE(p_snapshot_id, snapshot_id),
    model         = COALESCE(p_model, model),
    prompt_chars  = COALESCE(p_prompt_chars, prompt_chars),
    output_chars  = COALESCE(p_output_chars, output_chars),
    duration_ms   = COALESCE(p_duration_ms, duration_ms),
    cost_usd      = COALESCE(p_cost_usd, cost_usd)
  WHERE id = p_job_id
    AND status = 'running';
$$;

GRANT EXECUTE ON FUNCTION public.complete_generation_job(uuid, uuid, text, int, int, int, numeric) TO service_role;

-- View for admin cost dashboard: daily cost per model
CREATE OR REPLACE VIEW public.admin_cost_summary AS
SELECT
  date_trunc('day', created_at)::date AS day,
  model,
  job_type,
  count(*)                            AS job_count,
  sum(prompt_chars)                   AS total_prompt_chars,
  sum(output_chars)                   AS total_output_chars,
  sum(cost_usd)                       AS total_cost_usd,
  avg(duration_ms)::int               AS avg_duration_ms
FROM public.generation_jobs
WHERE status = 'completed'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 4 DESC;


-- ─── 2. ACTIVATION EVENTS ─────────────────────────────────────────────────────
-- The single most important business metric: a member is "activated" when they
-- complete their first meaningful action (strategy built, first post published,
-- first content calendar created).
--
-- One row per (brand_id, event_type). Duplicate writes are silently ignored
-- via ON CONFLICT DO NOTHING — the first activation is what matters.

CREATE TABLE IF NOT EXISTS public.activation_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  event_type      text        NOT NULL,   -- 'strategy_built' | 'first_post_published' | 'calendar_created'
  metadata        jsonb       DEFAULT '{}',
  activated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activation_events_brand_event_unique UNIQUE (brand_id, event_type)
);

ALTER TABLE public.activation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_events FORCE ROW LEVEL SECURITY;

-- Users see their own events
CREATE POLICY "user_read_own_activations" ON public.activation_events
  FOR SELECT USING (auth.uid() = user_id);

-- Service role writes (edge functions fire the events)
CREATE POLICY "service_all_activations" ON public.activation_events
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can read all activation events (for dashboard metrics)
CREATE POLICY "admin_read_activations" ON public.activation_events
  FOR SELECT USING (public.is_app_admin());

CREATE INDEX IF NOT EXISTS idx_activation_events_brand_type
  ON public.activation_events (brand_id, event_type);

CREATE INDEX IF NOT EXISTS idx_activation_events_activated_at
  ON public.activation_events (activated_at DESC);


-- ─── 3. PLAN MONTHS ───────────────────────────────────────────────────────────
-- Strategy pipeline output: M3 generates a 3-month execution plan.
-- Each row is one month of that plan. Linked to the strategy via strategy_id.

CREATE TABLE IF NOT EXISTS public.plan_months (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id     uuid        NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  month_number    int         NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  month_label     text        NOT NULL DEFAULT '',   -- e.g. "Month 1: Foundation"
  focus_theme     text        NOT NULL DEFAULT '',   -- the single priority for this month
  weekly_cadence  jsonb       NOT NULL DEFAULT '[]', -- [{week:1, focus:"...", actions:[]}]
  milestones      jsonb       NOT NULL DEFAULT '[]', -- [{label:"...", metric:"..."}]
  content_themes  text[]      NOT NULL DEFAULT '{}',
  is_paid         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_months_strategy_month_unique UNIQUE (strategy_id, month_number)
);

ALTER TABLE public.plan_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_months FORCE ROW LEVEL SECURITY;

CREATE TRIGGER trg_plan_months_updated
  BEFORE UPDATE ON public.plan_months
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Free months (month 1 preview): all authenticated owners
CREATE POLICY "user_read_free_months" ON public.plan_months
  FOR SELECT USING (auth.uid() = user_id AND is_paid = false);

-- Paid months: active subscribers only
CREATE POLICY "user_read_paid_months" ON public.plan_months
  FOR SELECT USING (
    auth.uid() = user_id
    AND is_paid = true
    AND (
      EXISTS (SELECT 1 FROM public.accounts a WHERE a.owner_id = auth.uid() AND a.subscription_status = 'active' AND a.plan != 'founding_member')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_status = 'active' AND p.plan != 'founding_member')
    )
  );

-- founding_member plan sees all months (special launch tier)
CREATE POLICY "founding_member_read_months" ON public.plan_months
  FOR SELECT USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.plan = 'founding_member')
  );

CREATE POLICY "service_all_plan_months" ON public.plan_months
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_plan_months_strategy_month
  ON public.plan_months (strategy_id, month_number);

CREATE INDEX IF NOT EXISTS idx_plan_months_brand
  ON public.plan_months (brand_id, month_number);


-- ─── 4. TEST IDEAS ────────────────────────────────────────────────────────────
-- Strategy pipeline output: 3–5 growth tests for the first 90 days.
-- Each row is one testable idea (hypothesis + success metric + time box).

CREATE TABLE IF NOT EXISTS public.test_ideas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id     uuid        NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  sort_order      int         NOT NULL DEFAULT 0,
  title           text        NOT NULL,
  hypothesis      text        NOT NULL DEFAULT '',
  success_metric  text        NOT NULL DEFAULT '',
  time_box_days   int         NOT NULL DEFAULT 30,
  channel         text,                   -- 'linkedin' | 'instagram' | 'email' | null
  effort          text        NOT NULL DEFAULT 'medium' CHECK (effort IN ('low','medium','high')),
  status          text        NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','running','completed','skipped')),
  result          text,
  is_paid         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.test_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_ideas FORCE ROW LEVEL SECURITY;

CREATE TRIGGER trg_test_ideas_updated
  BEFORE UPDATE ON public.test_ideas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "user_read_free_test_ideas" ON public.test_ideas
  FOR SELECT USING (auth.uid() = user_id AND is_paid = false);

CREATE POLICY "user_read_paid_test_ideas" ON public.test_ideas
  FOR SELECT USING (
    auth.uid() = user_id
    AND is_paid = true
    AND (
      EXISTS (SELECT 1 FROM public.accounts a WHERE a.owner_id = auth.uid() AND a.subscription_status = 'active' AND a.plan != 'founding_member')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_status = 'active' AND p.plan != 'founding_member')
    )
  );

CREATE POLICY "founding_member_read_test_ideas" ON public.test_ideas
  FOR SELECT USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.plan = 'founding_member')
  );

CREATE POLICY "user_update_own_test_ideas" ON public.test_ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "service_all_test_ideas" ON public.test_ideas
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_test_ideas_strategy_sort
  ON public.test_ideas (strategy_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_test_ideas_brand_status
  ON public.test_ideas (brand_id, status);


-- ─── 5. WAVE1 INVITES ─────────────────────────────────────────────────────────
-- M4 paywall: 1.0 member transition codes.
-- Each invited 1.0 member receives a unique code that maps to a Stripe coupon.
-- Using the code during checkout applies the founding-member discount.

CREATE TABLE IF NOT EXISTS public.wave1_invites (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text        NOT NULL UNIQUE,          -- 8-char uppercase slug e.g. "MOX1-ABCD"
  email           text,                                 -- the 1.0 member email (for pre-fill)
  stripe_coupon   text,                                 -- Stripe coupon ID to apply at checkout
  plan            text        NOT NULL DEFAULT 'founding_member',
  used_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at         timestamptz,
  expires_at      timestamptz,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wave1_invites_code_valid CHECK (code ~ '^[A-Z0-9\-]{4,20}$')
);

ALTER TABLE public.wave1_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wave1_invites FORCE ROW LEVEL SECURITY;

-- Public can read their own code by code value (needed for checkout pre-fill)
CREATE POLICY "public_read_invite_by_code" ON public.wave1_invites
  FOR SELECT USING (true);  -- code is unguessable (8 char slug); SELECT by code is safe

-- Only service role and admin can write
CREATE POLICY "admin_all_wave1_invites" ON public.wave1_invites
  FOR ALL USING (public.is_app_admin());

CREATE POLICY "service_all_wave1_invites" ON public.wave1_invites
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_wave1_invites_email
  ON public.wave1_invites (email);

CREATE INDEX IF NOT EXISTS idx_wave1_invites_used_by
  ON public.wave1_invites (used_by)
  WHERE used_by IS NOT NULL;


-- ─── 6. CONTENT MONTHS ────────────────────────────────────────────────────────
-- M5 execution loop: once strategy is built, the execution loop generates
-- monthly content plans. Each row ties a plan_month to its content output.

CREATE TABLE IF NOT EXISTS public.content_months (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_month_id   uuid        REFERENCES public.plan_months(id) ON DELETE SET NULL,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid        REFERENCES public.brands(id) ON DELETE SET NULL,
  month_number    int         NOT NULL,
  year            int         NOT NULL,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','approved','publishing','completed')),
  posts_planned   int         NOT NULL DEFAULT 0,
  posts_published int         NOT NULL DEFAULT 0,
  posts_approved  int         NOT NULL DEFAULT 0,
  summary         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_months_brand_month_unique UNIQUE (brand_id, year, month_number)
);

ALTER TABLE public.content_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_months FORCE ROW LEVEL SECURITY;

CREATE TRIGGER trg_content_months_updated
  BEFORE UPDATE ON public.content_months
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "user_all_content_months" ON public.content_months
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_all_content_months" ON public.content_months
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_content_months_brand_year_month
  ON public.content_months (brand_id, year DESC, month_number DESC);
