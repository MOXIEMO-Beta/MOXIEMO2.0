-- =============================================================================
-- MOXIEMO 2.0 — Admin versioning infrastructure
--
-- 1. playbook_rule_versions  — immutable audit log of every playbook rule save.
--    Admin can read the history and restore any previous version.
--
-- 2. gate_coaching            — editable coaching copy shown to founders who
--    answer "Not yet" on the readiness gate.  Admin reads/writes via RLS.
--    Onboarding reads via authenticated SELECT.
-- =============================================================================

-- ─── 1. PLAYBOOK RULE VERSIONS ───────────────────────────────────────────────
-- One row is inserted (never updated) each time a playbook rule is saved.
-- The admin UI reads these to show history and can restore by writing the
-- snapshot back to playbook_rules.

CREATE TABLE IF NOT EXISTS public.playbook_rule_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid        NOT NULL REFERENCES public.playbook_rules(id) ON DELETE CASCADE,
  rule_key        text        NOT NULL,
  version         int         NOT NULL,
  rule_text       text        NOT NULL,
  why_line        text        NOT NULL,
  conflict_priority int       NOT NULL,
  is_active       boolean     NOT NULL,
  saved_by        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  saved_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playbook_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rule_versions FORCE ROW LEVEL SECURITY;

-- Only admins can read version history (contains full rule text)
CREATE POLICY "admin_read_rule_versions" ON public.playbook_rule_versions
  FOR SELECT USING (public.is_app_admin());

-- Inserts are made by the admin save action (service role or admin user)
CREATE POLICY "admin_insert_rule_versions" ON public.playbook_rule_versions
  FOR INSERT WITH CHECK (public.is_app_admin());

CREATE INDEX IF NOT EXISTS idx_rule_versions_rule_saved
  ON public.playbook_rule_versions (rule_id, saved_at DESC);

-- ─── Trigger: auto-snapshot before each playbook_rules UPDATE ────────────────
-- This guarantees a version row is written even if the UI forgets to call the
-- insert explicitly. The trigger fires BEFORE UPDATE so it captures the OLD
-- values (what is being replaced), not the new ones.

CREATE OR REPLACE FUNCTION public.snapshot_playbook_rule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.playbook_rule_versions (
    rule_id, rule_key, version, rule_text, why_line,
    conflict_priority, is_active, saved_by
  ) VALUES (
    OLD.id, OLD.rule_key, OLD.version, OLD.rule_text, OLD.why_line,
    OLD.conflict_priority, OLD.is_active, auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_playbook_rule_snapshot
  BEFORE UPDATE ON public.playbook_rules
  FOR EACH ROW
  WHEN (
    OLD.rule_text        IS DISTINCT FROM NEW.rule_text   OR
    OLD.why_line         IS DISTINCT FROM NEW.why_line    OR
    OLD.conflict_priority IS DISTINCT FROM NEW.conflict_priority OR
    OLD.is_active        IS DISTINCT FROM NEW.is_active
  )
  EXECUTE FUNCTION public.snapshot_playbook_rule();


-- ─── 2. GATE COACHING COPY ───────────────────────────────────────────────────
-- One row per (goal_key, question_number).  Karee edits these in admin.
-- Onboarding reads them to show MOXIE's "Not yet" coaching message.
--
-- Composite unique key: (goal_key, question_number)
-- The seed rows below are the placeholders; Karee fills them on Nov 16.

CREATE TABLE IF NOT EXISTS public.gate_coaching (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_key         text        NOT NULL,
  question_number  int         NOT NULL CHECK (question_number BETWEEN 1 AND 3),
  heading          text        NOT NULL DEFAULT '',   -- bold first line, e.g. "Here is what is missing."
  body             text        NOT NULL DEFAULT '',   -- paragraph copy in MOXIE's voice
  action_line      text        NOT NULL DEFAULT '',   -- the one thing to do this week
  return_line      text        NOT NULL DEFAULT '',   -- how to come back
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT gate_coaching_unique UNIQUE (goal_key, question_number)
);

ALTER TABLE public.gate_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_coaching FORCE ROW LEVEL SECURITY;

-- Admins can read and write
CREATE POLICY "admin_all_gate_coaching" ON public.gate_coaching
  FOR ALL USING (public.is_app_admin());

-- Authenticated users (onboarding page) can read — never write
CREATE POLICY "authenticated_read_gate_coaching" ON public.gate_coaching
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE TRIGGER trg_gate_coaching_updated
  BEFORE UPDATE ON public.gate_coaching
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── Seed rows (placeholders until Karee fills them on Nov 16) ───────────────
INSERT INTO public.gate_coaching (goal_key, question_number, heading, body, action_line, return_line)
VALUES
  ('first_100', 1, '', '', '', ''),
  ('first_100', 2, '', '', '', ''),
  ('first_100', 3, '', '', '', ''),
  ('launch_offer', 1, '', '', '', ''),
  ('launch_offer', 2, '', '', '', ''),
  ('launch_offer', 3, '', '', '', '')
ON CONFLICT (goal_key, question_number) DO NOTHING;
