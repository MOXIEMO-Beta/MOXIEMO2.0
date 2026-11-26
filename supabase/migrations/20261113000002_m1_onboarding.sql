-- ─────────────────────────────────────────────────────────────────────────────
-- M1 ONBOARDING SCHEMA
-- Adds onboarding columns to profiles, creates gate_answers, first_moves,
-- playbook_rules, questions, and question_examples tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PROFILES ADDITIONS ───────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_goal                  text,
  ADD COLUMN IF NOT EXISTS onboarding_timeframe_days        int,
  ADD COLUMN IF NOT EXISTS onboarding_timeframe_custom_date date,
  ADD COLUMN IF NOT EXISTS onboarding_business_type         text,
  ADD COLUMN IF NOT EXISTS onboarding_gate_passed           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_gate_answers          jsonb   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_first_move            text;

-- ─── 2. GATE ANSWERS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gate_answers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_key        text        NOT NULL,
  q1_answer       text        NOT NULL CHECK (q1_answer IN ('yes', 'not_yet')),
  q2_answer       text        NOT NULL CHECK (q2_answer IN ('yes', 'not_yet')),
  q3_answer       text        NOT NULL CHECK (q3_answer IN ('yes', 'not_yet')),
  passed          boolean     NOT NULL DEFAULT false,
  coaching_shown  boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gate_answers_user_goal_unique UNIQUE (user_id, goal_key)
);

ALTER TABLE public.gate_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_answers FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_own_gate" ON public.gate_answers
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gate_answers_user ON public.gate_answers (user_id, goal_key);

CREATE TRIGGER trg_gate_answers_updated
  BEFORE UPDATE ON public.gate_answers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── 3. FIRST MOVES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.first_moves (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_key      text        NOT NULL,
  business_type text        NOT NULL,
  text          text        NOT NULL,
  generated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.first_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.first_moves FORCE ROW LEVEL SECURITY;

CREATE POLICY "user_own_first_moves" ON public.first_moves
  FOR ALL USING (auth.uid() = user_id);

-- ─── 4. PLAYBOOK RULES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.playbook_rules (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version           int         NOT NULL DEFAULT 1,
  rule_key          text        NOT NULL UNIQUE,
  rule_text         text        NOT NULL,
  why_line          text        NOT NULL,
  conflict_priority int         NOT NULL DEFAULT 50,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rules FORCE ROW LEVEL SECURITY;

CREATE TRIGGER trg_playbook_rules_updated
  BEFORE UPDATE ON public.playbook_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "admin_all_playbook" ON public.playbook_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "authenticated_read_playbook" ON public.playbook_rules
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- ─── 5. PLAYBOOK RULES SEED DATA ─────────────────────────────────────────────

INSERT INTO public.playbook_rules (rule_key, rule_text, why_line, conflict_priority, is_active)
VALUES
  (
    'safety',
    'Never recommend an action that could harm the founder''s reputation, finances, or audience trust. When in doubt about risk, flag it and suggest a lower-risk alternative.',
    'Trust is the only moat a small business owner has. One bad move can cost years of goodwill.',
    10,
    true
  ),
  (
    'feasibility',
    'Only recommend actions the founder can execute with the resources they have today. No recommendation should require hiring, significant capital, or tools they do not already own.',
    'An unexecutable strategy is not a strategy. It is a to-do list that generates guilt.',
    20,
    true
  ),
  (
    'primary_goal',
    'Every recommendation must connect directly to the founder''s stated primary goal. Do not add tactics that are interesting but do not move the goal forward.',
    'Scattered effort is the most common reason small business marketing fails. Focus compounds.',
    30,
    true
  ),
  (
    'evidence',
    'Prefer recommendations grounded in what has already worked for this founder or in well-documented patterns for their business type. Flag when a recommendation is a hypothesis rather than a known path.',
    'Confidence is built on evidence, not optimism. Founders deserve to know what is a bet and what is a proven pattern.',
    40,
    true
  ),
  (
    'specificity',
    'Every recommendation must include a specific action, a specific channel or medium, and a specific time window. Vague advice is not advice.',
    'Specificity is what separates a recommendation from a platitude. Founders need to know exactly what to do next.',
    50,
    true
  ),
  (
    'channel_fit',
    'Match the recommended channel to the founder''s audience, business type, and stated comfort level. Never recommend a channel the founder has explicitly said they avoid.',
    'The best channel is the one the founder will actually use consistently. Reluctant execution beats perfect strategy every time.',
    60,
    true
  ),
  (
    'format_fit',
    'Match content format to the platform norms and to the founder''s demonstrated content strengths. Do not recommend video-first strategies to founders who have never produced video.',
    'Format mismatches produce content that feels off and underperforms. Meet the founder where they are strong.',
    70,
    true
  )
ON CONFLICT (rule_key) DO NOTHING;

-- ─── 6. QUESTIONS (Item 9) ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.questions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_key     text        NOT NULL UNIQUE,
  part           text        NOT NULL,
  set_code       text        NOT NULL,
  input_type     text        NOT NULL DEFAULT 'text',
  maps_to        text,
  signal         text,
  skip_condition text,
  sort_order     smallint    NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_examples (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  business_type text NOT NULL CHECK (business_type IN ('E', 'G', 'R')),
  example_text  text NOT NULL
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_questions" ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_write_questions" ON public.questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

ALTER TABLE public.question_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_examples FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_examples" ON public.question_examples
  FOR SELECT USING (auth.role() = 'authenticated');
