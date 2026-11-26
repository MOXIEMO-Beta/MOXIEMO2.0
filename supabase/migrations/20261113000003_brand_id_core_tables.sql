-- =============================================================================
-- MOXIEMO 2.0 — brand_id on discovery_sessions, strategies, gate_answers,
--               first_moves, brand_kits, social_analytics, onboarding_responses
--
-- These tables were created in earlier Lovable-era migrations without brand_id.
-- Adding it now (before any live members) so Phase 6 multi-brand never needs
-- a breaking migration across live data.
--
-- Pattern (same as 20261108000004):
--   1. ADD COLUMN IF NOT EXISTS  → idempotent, safe to re-run
--   2. Backfill via primary_brand_for(user_id)  → 1 brand per user at launch
--   3. CREATE INDEX IF NOT EXISTS  → query performance for brand-scoped reads
-- =============================================================================

-- ─── 1. discovery_sessions ───────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'discovery_sessions' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.discovery_sessions
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.discovery_sessions
  SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discovery_sessions_brand_updated
  ON public.discovery_sessions (brand_id, updated_at DESC);

-- ─── 2. strategies ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategies' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.strategies
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.strategies
  SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategies_brand_updated
  ON public.strategies (brand_id, updated_at DESC);

-- ─── 3. gate_answers ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gate_answers' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.gate_answers
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.gate_answers
  SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

-- ─── 4. first_moves ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'first_moves' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.first_moves
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.first_moves
  SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

-- ─── 5. brand_kits ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brand_kits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_kits' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.brand_kits
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brand_kits'
  ) THEN
    UPDATE public.brand_kits SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- ─── 6. social_analytics ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_analytics'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_analytics' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.social_analytics
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_analytics'
  ) THEN
    UPDATE public.social_analytics SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_social_analytics_brand ON public.social_analytics (brand_id)';
  END IF;
END $$;

-- ─── 7. onboarding_responses ─────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'onboarding_responses'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'onboarding_responses' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.onboarding_responses
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'onboarding_responses'
  ) THEN
    UPDATE public.onboarding_responses SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;
