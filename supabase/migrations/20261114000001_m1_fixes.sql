-- =============================================================================
-- M1 FIXES
-- 1. complete_gate RPC — atomically writes gate_answers + profiles in one
--    transaction, eliminating the partial-write bug in goToStep4().
-- 2. gate_coaching seed rows updated with real MOXIE-voice content so
--    launch members never see "More guidance coming soon."
-- =============================================================================

-- ─── 1. ATOMIC GATE COMPLETION RPC ──────────────────────────────────────────
-- Replaces the two-step client write (upsert gate_answers, then update profiles).
-- Called by the browser with the user's own JWT — SECURITY INVOKER so RLS
-- policies on both tables apply normally.

CREATE OR REPLACE FUNCTION public.complete_gate(
  p_goal_key        text,
  p_q1              text,
  p_q2              text,
  p_q3              text,
  p_coaching_shown  boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate answers server-side so a crafted request cannot bypass the gate.
  IF p_q1 NOT IN ('yes', 'not_yet') OR
     p_q2 NOT IN ('yes', 'not_yet') OR
     p_q3 NOT IN ('yes', 'not_yet') THEN
    RAISE EXCEPTION 'invalid_answer' USING ERRCODE = 'P0001';
  END IF;

  IF p_q1 <> 'yes' OR p_q2 <> 'yes' OR p_q3 <> 'yes' THEN
    RAISE EXCEPTION 'gate_not_passed' USING ERRCODE = 'P0001';
  END IF;

  -- Write gate_answers (upsert — idempotent on retry).
  INSERT INTO public.gate_answers (
    user_id, goal_key, q1_answer, q2_answer, q3_answer, passed, coaching_shown
  )
  VALUES (
    auth.uid(), p_goal_key, p_q1, p_q2, p_q3, true, p_coaching_shown
  )
  ON CONFLICT (user_id, goal_key) DO UPDATE SET
    q1_answer      = EXCLUDED.q1_answer,
    q2_answer      = EXCLUDED.q2_answer,
    q3_answer      = EXCLUDED.q3_answer,
    passed         = true,
    coaching_shown = EXCLUDED.coaching_shown,
    updated_at     = now();

  -- Write profiles (single UPDATE in the same transaction).
  UPDATE public.profiles
  SET
    onboarding_gate_passed  = true,
    onboarding_gate_answers = jsonb_build_object(
      'q1_answer', p_q1,
      'q2_answer', p_q2,
      'q3_answer', p_q3
    )
  WHERE id = auth.uid();
END;
$$;

-- Authenticated users call this for their own gate.
GRANT EXECUTE ON FUNCTION public.complete_gate(text, text, text, text, boolean) TO authenticated;


-- ─── 2. GATE COACHING REAL CONTENT ──────────────────────────────────────────
-- Replaces the empty placeholder rows with real MOXIE-voice coaching copy.
-- These are pre-launch defaults; Karee can refine them via the admin editor
-- (gate_coaching table is editable by admin, reads are authenticated-only).
-- Format: heading = what is missing, body = context, action_line = this week,
--         return_line = how to come back.

INSERT INTO public.gate_coaching (goal_key, question_number, heading, body, action_line, return_line)
VALUES
  -- First 100: Q1 — clear description of who you help
  ('first_100', 1,
   'You need a clear picture of who you help.',
   'Without knowing exactly who your best customer is, your marketing will speak to everyone and reach no one. The strategy we build only works if it is aimed at a real, specific person.',
   'Write one sentence: "I help [specific type of person] who [has this specific problem] so they can [get this specific result]." Do not use "anyone" or "businesses." Name the person.',
   'Come back once you can say that sentence out loud without hesitating.'),

  -- First 100: Q2 — something to offer today
  ('first_100', 2,
   'You need something ready to sell right now.',
   'A strategy built around an offer that does not exist yet is a plan for a business you do not have yet. We build around what someone could buy from you this week.',
   'Name your offer: what it is, who it is for, what it costs, and how someone buys it. If you cannot fill in all four, that is what to build this week.',
   'Come back once someone could hand you money for it today.'),

  -- First 100: Q3 — a way to reach potential customers
  ('first_100', 3,
   'You need a channel where your buyers already are.',
   'Without a path to your first customer, the strategy has nowhere to go. This does not have to be a big audience — a network of 50 real people who know and trust you is enough.',
   'List three places where the person you described in Q1 actually spends time. Pick one you already have access to. That is your channel.',
   'Come back once you can name the channel you will use to reach your first ten customers.'),

  -- Launch offer: Q1 — can deliver right now
  ('launch_offer', 1,
   'You need to be able to fulfill this offer today.',
   'A go-to-market plan for an offer you cannot yet deliver will generate leads you cannot convert. The momentum you build during launch has to land somewhere real.',
   'Walk through your fulfillment process start to finish. If there is a step that requires something you do not have yet, build that step first.',
   'Come back once you could start delivering the day after someone pays.'),

  -- Launch offer: Q2 — real demand signal
  ('launch_offer', 2,
   'You need a real signal that someone will pay.',
   'Polite interest is not demand. A strategy built on assumption generates expensive noise. Even one real sale or one genuine "I would pay for that" with a name attached changes everything.',
   'Reach out to three people who fit your buyer profile and ask directly: "Would you pay [price] for [offer]? If yes, I can start in two weeks." A real reply is your signal.',
   'Come back once you have at least one genuine expression of willingness to pay.'),

  -- Launch offer: Q3 — it is priced
  ('launch_offer', 3,
   'You need a price before we can build a launch.',
   '"It depends" is not a price. A launch strategy without a price has no conversion point — there is nothing for the plan to drive people toward.',
   'Set one price or a simple good/better/best structure with clear numbers. If you are genuinely unsure, pick the number you would feel proud charging and test it.',
   'Come back with a price written down. It can change after launch. It needs to exist before we build the plan.')

ON CONFLICT (goal_key, question_number) DO UPDATE SET
  heading     = EXCLUDED.heading,
  body        = EXCLUDED.body,
  action_line = EXCLUDED.action_line,
  return_line = EXCLUDED.return_line,
  updated_at  = now();
