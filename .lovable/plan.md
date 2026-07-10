
# Phase 3: Offer GTM Downstream Wiring & Verification

## Pre-plan finding on Step 0 (needs your confirmation)

I pulled the stored `enhanced_foundation` for both Lane 3 accounts (`info@klmg-us.com`, `kareelaing@gmail.com`) directly from the DB:

- `channelPlan.channels[].name` values are stored **complete** and clean, e.g.
  `"Direct outreach (email and DM)"`, `"LinkedIn"`, `"Email to engaged subscribers"`, `"Referral partners"`.
- The `contentCalendar[].platform` values are **also complete** and short: only `"Instagram"`, `"Email"`, `"LinkedIn"` appear. No `"Direct outreach to..."` string is stored on any calendar row.
- The string `"Direct outreach"` does not appear in any `.ts/.tsx` file.

So a Channel column showing "Direct outreach to" cut off cannot be reproduced from any renderer or DB field I've inspected. Before I fix anything, I need to know:

**Where exactly is that column?** Screenshot, or the route + tab name (Strategy > Content? Content > 30-day calendar? Campaign Planner > Schedule? A generated PDF?). Once I have that, Step 0 is a ~1-call diagnosis (data vs render) and a targeted fix.

## Steps

### 0. Calendar Channel truncation
Once view is confirmed, inspect the exact renderer, cross-check the field it binds to against DB. Report verdict "data was truncated" vs "render clipped". If render: remove the truncation (likely a `.slice(0, N)` or a fixed-width cell). If data: fix `generate-execution-plan` prompt/schema field length, regenerate for the test account, verify.

### 1. Goals (verify + guard)
- Read `generate-goal-definitions/index.ts`. Confirm it inspects `strategy.strategy_lane === "offer_gtm"` and pulls `offerPositioning`, `firstMove.metric`, `channelPlan` to shape:
  - **North Star** = single sell-N-by-date metric (e.g. "12 retreat spots sold by 2026-08-15")
  - **SMART cards** = launch-shaped (sales, warm-list conversations, conversion %, waitlist growth). No brand-shaped defaults ("build authority", "grow following").
- If it does not: add an `offer_gtm` branch that maps intake target + deadline to North Star and derives 3-4 launch cards.
- Verify **Update Your Numbers** modal renders one field per goal with short metric labels, saves to `goal_entries`, updates each card's "Now" value on close.

### 2. Dashboard: firstMove as Today's Focus
- In `src/pages/app/Dashboard.tsx`, add a Lane 3 branch to Today's Focus: if `strategy.strategy_lane === "offer_gtm"` and `ef.firstMove` exists and is not marked done/dismissed, show `firstMove.type`, one-line summary from `firstMove.copy`/`firstMove.why`, and a primary action that opens a modal with the full `firstMove.copy` and the warm-list recipients from `discovery.intake` (or `enhanced_foundation.warmList`).
- Persist done/dismissed per-user in a small local pref (or a `firstMove_state` field on the strategy). Stays top-of-list until then.
- Verify strategy recap band, North Star band, goals-at-a-glance already render offer content correctly (no code changes expected).

### 3. Campaign Planner seed
- New helper `seedLaunchCampaign(strategy)` that reads `channelPlan`, `launchMessaging`, `firstMove` and inserts:
  - one `campaigns` row (2-3 weeks, status `draft`, goal from North Star)
  - `campaign_execution_items` mapped day-by-day across launch pillars/cadence, `firstMove` pinned as day 1, all `status: "draft"` / `planned`.
- Trigger seeding once per strategy (guard on a flag in `enhanced_foundation.launchCampaignSeeded`).
- Verify no auto-publish path is touched.

### 4. Downstream sweep (Lane 3 test account)
- Content generates from launch pillars in account voice (spot-check via existing generate-content path).
- Brand Hub strategy card shows offer positioning, Brand Kit inherits archetype from `strategy.enhanced_foundation.brandArchetype`.
- Confirm no fallback / wrong-lane content anywhere (MOX-160 class).
- Media Library, Social queue, Analytics load without errors.

### 5. Resume path
- Create/verify a Lane 3 test account left mid-discovery. Sign in, confirm `Discovery.tsx` resumes at the last completed step, finishes cleanly, `synthesize-strategy` fires normally, downstream lights up.

## Gate tests
Run through gates 1-8 including pulling Lane 3 synthesis duration from edge function logs and reporting it.

## Constraints
- No em-dashes, no contractions in any new copy.
- Lanes 1 and 2 code paths untouched (all changes gated on `strategy_lane === "offer_gtm"`).
- No auto-publish anywhere.
- No changes to auth, RLS, or Supabase client.

## What I need from you before I start
1. The exact view where the "Direct outreach to" truncation shows (screenshot or route + tab). Everything else I can start on immediately in parallel once you approve.
