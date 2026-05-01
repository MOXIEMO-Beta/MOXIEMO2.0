-- Migration 1: Update profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS intended_use jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS brand_assets jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free_beta',
  ADD COLUMN IF NOT EXISTS beta_code_used text;

-- Migration 2: beta_codes table
CREATE TABLE IF NOT EXISTS public.beta_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  description text,
  max_uses integer DEFAULT 100,
  uses_count integer DEFAULT 0,
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can validate beta codes" ON public.beta_codes;
CREATE POLICY "Anyone can validate beta codes"
  ON public.beta_codes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Migration 3: Seed beta code
INSERT INTO public.beta_codes (code, description, max_uses, expires_at)
VALUES (
  'MOXIE2026',
  'Beta 1 founding member — lifetime free access',
  500,
  '2026-12-31 23:59:59+00'
)
ON CONFLICT (code) DO NOTHING;

-- Migration 4: onboarding_responses
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step integer NOT NULL,
  response jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, step)
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users view own onboarding responses"
  ON public.onboarding_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users insert own onboarding responses"
  ON public.onboarding_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users update own onboarding responses"
  ON public.onboarding_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Users delete own onboarding responses"
  ON public.onboarding_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Migration 5: Indexes
CREATE INDEX IF NOT EXISTS profiles_industry_idx ON public.profiles(industry);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);