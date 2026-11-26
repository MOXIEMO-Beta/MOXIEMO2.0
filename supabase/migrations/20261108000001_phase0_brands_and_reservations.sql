-- =============================================================================
-- MOXIEMO 2.0 — Phase 0: Brand Isolation + Reservations Tracking
-- MOX2-3: accounts → brands → brand_id on all future tables
-- MOX2-8: confirmation_sent_at column on reservations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- MOX2-3 — accounts table
-- Top-level billing entity. One account = one Stripe customer.
-- A single user may own multiple accounts (future agency mode).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_customer_id    text,
  stripe_subscription_id text,
  subscription_status   text NOT NULL DEFAULT 'inactive'
                        CHECK (subscription_status IN ('active','trialing','past_due','canceled','inactive')),
  current_period_end    timestamptz,
  plan                  text NOT NULL DEFAULT 'founding_member',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_owner_id_idx ON public.accounts (owner_id);
CREATE INDEX IF NOT EXISTS accounts_stripe_customer_idx ON public.accounts (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read own account"
  ON public.accounts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "owner can update own account"
  ON public.accounts FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "admin full access accounts"
  ON public.accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- MOX2-3 — brands table
-- A brand belongs to one account. All content, strategy, discovery, posts
-- are scoped to a brand_id. Launch: 1 brand per account. Agency (Phase 6): N.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brands (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  owner_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name              text NOT NULL DEFAULT '',
  slug              text,
  website_url       text,
  business_type     text,
  location          text,
  is_primary        boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brands_account_id_idx   ON public.brands (account_id);
CREATE INDEX IF NOT EXISTS brands_owner_id_idx     ON public.brands (owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS brands_account_primary_idx
  ON public.brands (account_id) WHERE is_primary = true;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read own brands"
  ON public.brands FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "owner can update own brands"
  ON public.brands FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "owner can insert own brands"
  ON public.brands FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "admin full access brands"
  ON public.brands FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Backfill: create a default account + brand for every existing profile.
-- This is a one-time migration. New signups are handled by the auth hook.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r public.profiles%ROWTYPE;
  v_account_id uuid;
BEGIN
  FOR r IN SELECT * FROM public.profiles WHERE id IS NOT NULL LOOP
    -- Insert account if not already present
    INSERT INTO public.accounts (id, owner_id, plan, subscription_status,
                                  stripe_customer_id, stripe_subscription_id, current_period_end)
    VALUES (
      gen_random_uuid(),
      r.id,
      COALESCE(r.plan, 'founding_member'),
      COALESCE(r.subscription_status, 'inactive'),
      r.stripe_customer_id,
      r.stripe_subscription_id,
      r.current_period_end
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_account_id;

    IF v_account_id IS NOT NULL THEN
      -- Insert a primary brand for this account
      INSERT INTO public.brands (account_id, owner_id, name, website_url, business_type,
                                  location, is_primary)
      VALUES (
        v_account_id,
        r.id,
        COALESCE(r.full_name, ''),
        NULL,
        r.business_type,
        r.location,
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- brand_id helper view: cheapest way to look up brand_id for the caller.
-- Edge functions JOIN through this instead of re-deriving the chain.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.caller_brand AS
  SELECT b.id AS brand_id, b.account_id, b.owner_id
  FROM   public.brands b
  WHERE  b.owner_id = auth.uid()
  AND    b.is_primary = true;

-- ---------------------------------------------------------------------------
-- MOX2-3 — Add brand_id to discovery_sessions (Phase 0 tables only).
-- Downstream tables (strategy, posts, etc.) get brand_id in their own
-- milestone migrations. We do NOT retroactively rename FKs on 100+ tables
-- here — that would break the running app. Instead we add brand_id as a
-- nullable denormalised column now and enforce NOT NULL after backfill.
-- ---------------------------------------------------------------------------

ALTER TABLE public.discovery_sessions
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS discovery_sessions_brand_id_idx
  ON public.discovery_sessions (brand_id) WHERE brand_id IS NOT NULL;

ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS strategies_brand_id_idx
  ON public.strategies (brand_id) WHERE brand_id IS NOT NULL;

-- Backfill brand_id on existing rows via owner_id → brands join
UPDATE public.discovery_sessions ds
SET brand_id = b.id
FROM public.brands b
WHERE b.owner_id = ds.user_id
  AND b.is_primary = true
  AND ds.brand_id IS NULL;

UPDATE public.strategies s
SET brand_id = b.id
FROM public.brands b
WHERE b.owner_id = s.user_id
  AND b.is_primary = true
  AND s.brand_id IS NULL;

-- ---------------------------------------------------------------------------
-- MOX2-8 — Add confirmation_sent_at to reservations
-- Lets admins know the Resend email landed (or at least was dispatched).
-- ---------------------------------------------------------------------------

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS reservations_created_at_idx
  ON public.reservations (created_at DESC);

-- Flag rows where reserve-spot already fired (email was sent if RESEND_API_KEY existed).
-- We can't know retroactively if Resend accepted — set to created_at as a best estimate
-- for all rows that predate this migration.
UPDATE public.reservations
SET confirmation_sent_at = created_at
WHERE confirmation_sent_at IS NULL;

-- ---------------------------------------------------------------------------
-- Extend handle_new_user trigger: atomically create account + brand on signup
-- Replaces the previous version which only inserted into profiles.
-- SECURITY DEFINER so it runs with the function owner's rights, not the
-- new user's rights, allowing insert into accounts + brands before RLS
-- policies on those tables would otherwise permit it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account_id uuid;
BEGIN
  -- 1. Profile row
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'founding_member')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Account row (1:1 with user at launch; N:1 for agency in Phase 6)
  INSERT INTO public.accounts (owner_id, plan, subscription_status)
  VALUES (NEW.id, 'founding_member', 'inactive')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_account_id;

  -- 3. Primary brand row
  IF v_account_id IS NOT NULL THEN
    INSERT INTO public.brands (account_id, owner_id, name, is_primary)
    VALUES (v_account_id, NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Security: prevent non-admin lateral reads across brands
-- RLS additions for brands table reads from service-role edge functions
-- must pass brand_id explicitly; never rely on a user_id wildcard.
-- ---------------------------------------------------------------------------

-- Ensure deny-by-default is in place for new tables (defensive, idempotent)
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.brands   FORCE ROW LEVEL SECURITY;
