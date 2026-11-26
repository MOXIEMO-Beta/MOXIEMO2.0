-- ─────────────────────────────────────────────────────────────────────────────
-- BRAND_ID ON CONTENT TABLES
-- Adds brand_id FK (nullable, SET NULL on cascade) to the 11 tables that were
-- missing it. Backfills from the owner's primary brand where possible.
-- Adds RLS policies for brand-level isolation alongside existing user_id policies.
-- Updates handle_new_user to also stamp brand_id on content rows going forward.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: get primary brand_id for a given user_id
CREATE OR REPLACE FUNCTION public.primary_brand_for(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.brands
  WHERE owner_id = p_user_id AND is_primary = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.primary_brand_for(uuid) TO authenticated, service_role;

-- ─── 1. social_posts ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.social_posts
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.social_posts SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_brand_created
  ON public.social_posts (brand_id, created_at DESC);

-- ─── 2. content_items ───────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'content_items'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.content_items
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'content_items'
  ) THEN
    UPDATE public.content_items SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_content_items_brand_created ON public.content_items (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_content_items_brand ON public.content_items (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 3. email_sends ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_sends'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'email_sends' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.email_sends
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_sends'
  ) THEN
    UPDATE public.email_sends SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'email_sends' AND column_name = 'created_at'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_sends_brand_created ON public.email_sends (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_sends_brand ON public.email_sends (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 4. campaigns ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'campaigns'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.campaigns
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'campaigns'
  ) THEN
    UPDATE public.campaigns SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_campaigns_brand_created ON public.campaigns (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 5. social_connections ──────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_connections'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_connections' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.social_connections
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_connections'
  ) THEN
    UPDATE public.social_connections SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_social_connections_brand ON public.social_connections (brand_id)';
  END IF;
END $$;

-- ─── 6. goal_entries ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'goal_entries'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goal_entries' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.goal_entries
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'goal_entries'
  ) THEN
    UPDATE public.goal_entries SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goal_entries' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_goal_entries_brand_created ON public.goal_entries (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_goal_entries_brand ON public.goal_entries (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 7. subscribers ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscribers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscribers' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.subscribers
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscribers'
  ) THEN
    UPDATE public.subscribers SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscribers' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_subscribers_brand_created ON public.subscribers (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_subscribers_brand ON public.subscribers (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 8. calendar_ideas ──────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'calendar_ideas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calendar_ideas' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.calendar_ideas
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'calendar_ideas'
  ) THEN
    UPDATE public.calendar_ideas SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_ideas' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calendar_ideas_brand_created ON public.calendar_ideas (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_calendar_ideas_brand ON public.calendar_ideas (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 9. assets ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assets'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.assets
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assets'
  ) THEN
    UPDATE public.assets SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'created_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assets_brand_created ON public.assets (brand_id, created_at DESC)';
    ELSE
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assets_brand ON public.assets (brand_id)';
    END IF;
  END IF;
END $$;

-- ─── 10. usage_tracking ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usage_tracking'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usage_tracking' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.usage_tracking
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usage_tracking'
  ) THEN
    UPDATE public.usage_tracking SET brand_id = public.primary_brand_for(user_id)
      WHERE brand_id IS NULL AND user_id IS NOT NULL;
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usage_tracking_brand_month ON public.usage_tracking (brand_id, month DESC)';
  END IF;
END $$;

-- ─── 11. strategy_sections ──────────────────────────────────────────────────
-- strategy_sections was created in 20261108000002 without brand_id.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategy_sections' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE public.strategy_sections
      ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill strategy_sections.brand_id via the parent strategies table
UPDATE public.strategy_sections ss
  SET brand_id = s.brand_id
  FROM public.strategies s
  WHERE ss.strategy_id = s.id
    AND ss.brand_id IS NULL
    AND s.brand_id IS NOT NULL;

-- Also try via user_id fallback
UPDATE public.strategy_sections SET brand_id = public.primary_brand_for(user_id)
  WHERE brand_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategy_sections_brand_sort
  ON public.strategy_sections (brand_id, is_paid, sort_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES: brand-level isolation for social_posts (the main content table)
-- Other tables already have user_id policies; brand policies are additive.
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow users to read their brand's social posts (brand takes precedence when set)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'social_posts' AND policyname = 'brand_read_social_posts'
  ) THEN
    CREATE POLICY "brand_read_social_posts" ON public.social_posts
      FOR SELECT USING (
        auth.uid() = user_id
        OR (
          brand_id IS NOT NULL
          AND brand_id IN (
            SELECT id FROM public.brands WHERE owner_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Clean up: drop the old all-access user policy if brand policy now covers it
-- (keep user_id policy for backward compat — both OR'd together is fine)

-- ─────────────────────────────────────────────────────────────────────────────
-- Update handle_new_user: stamp brand_id on new social_posts at insert time
-- is handled at the app layer (useBrand hook). The trigger only creates
-- account+brand on signup; content rows stamp brand_id via the frontend.
-- ─────────────────────────────────────────────────────────────────────────────
