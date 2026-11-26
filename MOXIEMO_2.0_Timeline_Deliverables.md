# MOXIEMO 2.0 — Timeline, Deliverables & Dependency List

**Prepared:** November 13, 2026
**Last updated:** November 24, 2026
**Developer:** Santosh Nagargoje
**Product owner:** Karee Laing
**Launch target:** Wednesday, December 23, 2026
**Build done by:** December 23, 2026
**Development start:** November 21, 2026

---

## Timeline — confirmed

December 23 is the target. Build done December 23 — doors open the same day. If any launch must-have needs more time, the date moves. The must-haves do not get cut.

**What changed on November 12:** Launch scope grew. M6 (LinkedIn connect + publish + growth reporting) is now a launch must-have, not Phase 3. Every other post-launch feature stays post-launch.

**What changed on November 20:** Launch date confirmed December 23. Build done December 23. Development start confirmed as November 21. Full schedule recalculated from that date: Phase 0 Nov 21–27, M1 Nov 28–Dec 4, M2 Dec 5–11, M3 Dec 12–15, M4 Dec 16–18, M5 Dec 19–20, M6 Dec 21–23.

**What changed on November 24:** Phase 0 and M1 delivered ahead of schedule. All Phase 0 foundations (repo, database migrations, RLS, design system, admin shell, background job queue schema, auth with password reset) are complete. All M1 deliverables (goal picker, timeframe picker, readiness gate with hard block, "not yet" coaching with real MOXIE-voice content, business type picker, "your first move" AI generation, playbook rules table with admin editor and version history, question bank as database rows) are complete. Development is now entering M2 (Discovery) starting November 24.

> **Development note:** I am committed to delivering by December 23. However, as development progresses, real-world issues may arise — technical blockers, integration complexities, or scope clarifications from the PRDs — that require adjustments. If any such changes arise during development, I will flag them immediately with a clear impact on the timeline and what options exist. The timeline may be extended based on project requirements, and any extension will be communicated as early as possible — not at the deadline.

---

## Milestones & Deliverables

### Phase 0 — Nov 21 to 27 ✓ Complete (delivered ahead of schedule)
- Repo, staging and live databases built from migrations
- Full data model with brand_id on every table
- Security rules (RLS deny-by-default, FORCE RLS on all tables)
- Closed sign-up with password reset
- Design system (Tailwind, shadcn/ui, MOXIE avatar component with design tokens)
- Background job queue
- Admin shell

### M1 — Nov 28 to Dec 4 ✓ Complete (delivered ahead of schedule, Nov 24)
PRDs: 2, 4, 20

- Goals screen with timeframe picker (First 100: 90/120 days/6 months/12 months/Pick a date; Launch an offer: 30/60/90 days/Pick a date)
- Three-question readiness gate with hard block — all three must be Yes
- "Not yet" coaching when blocked (MOXIE's voice, one gap action, how to come back)
- Business type picker — three types at launch: Expertise-based founder (E), Growing business (G), Restaurant and hospitality (R)
- Your first move — one AI-generated action for the week, based on goal + business type
- Playbook rules loaded as data rows with admin editor (ten seed rules, approved, conflict order: safety → feasibility → primary goal → evidence → specificity)

> **Dependency note:** M1 needs Phase 0's admin shell to load the ten seed playbook rules on day one. Without Phase 0 complete, the admin editor has nowhere to write to and the rules table is empty.

### M2 — Dec 5 to 11 (in progress — started Nov 24, 11 days ahead of schedule)
PRDs: 3, contract

- Full question bank as database rows (not hardcoded):
  - Part 1: A1–A11 (brand-core, everyone)
  - Part 2: Set E, G, or R (business type)
  - Part 3: C1–C6 (shared), then goal module (F for First 100, L for Launch an offer)
  - Conditional: DX1–DX5 (up to 2 per session), Sharpen (0–4 follow-ups per question)
- One question per screen, saved as the member goes
- Show me an example (one example per question per business type, hidden if no approved example)
- Help me answer (Claude draft from confirmed answers only; stored as inferred + pending until member confirms, changes, or ignores; falls back to simpler version of the question if nothing to draw on)
- Sharpen (quotes member's own answer, member replaces or adds; both versions kept; latest confirmed version goes to snapshot; no AI-written text enters snapshot as member's answer)
- Review screen listing anything missing
- Build my strategy — freezes everything into the discovery snapshot (immutable; hashed)

> **Dependency note:** M2 needs M1's goal and business type selection to know which question set to load (E, G, or R) and which goal module to run (F or L). Discovery cannot start without a confirmed goal and business type written to the DB by M1.

### M3 — Dec 12 to 15
PRDs: 4, 12, 16, contract

- Strategy engine: 7-stage background job
  1. Extract facts and evidence
  2. Reconcile and check sufficiency
  3. Diagnose
  4. Select strategy decisions
  5. Compose strategy sections
  6. Validate
  7. Save free and paid sections (server sends only free read + positioning line + locked titles until payment)
- Saved checkpoints and retries per stage
- Reveal screen: "Where you stand" and one-line positioning statement free; every other section as locked title with one line on what it holds; first 30 days as locked month grid; week 1 as locked post cards
- Full strategy screen in four groups: Where you stand, Who you are, How you sound, How you grow
- Lane pages for the lead goal
- PDF download (paid strategy, same order and words as strategy screen, in MOXIEMO's look)
- 90-day plan with 30/60/90-day targets, first month's two tests, test ideas, Why this line on every item
- Platform layout: full-width, fixed 224px sidebar, MOXIE's round button
- MOXIE companion in the product

> **Dependency note:** M3 builds the gate (locked rows, server never sends paid sections until payment confirmed). M4 builds the key (Stripe checkout, unlock flow). The full member path — reveal → paywall → unlock → full strategy — only works end-to-end once both milestones are done. M3's Friday demo is on staging for Karee only; no real member hits the reveal until M4 is live.

### M4 — Dec 16 to 18
PRDs: 13, 5, 20

- Paywall: seat counter — "Seat X of 100, 50% off for life" (counted from active founding subscriptions, not a running total; repeated webhook cannot double-count)
- Stripe checkout with founding coupon (Clarity $49.50/mo, Momentum $74.50/mo)
- 1.0 member transition codes (email-locked: code only activates if account's verified email matches Karee's 1.0 list, checked server-side; no screen/receipt/invoice says "trial")
- Refunds (30-day money-back on first payment)
- PDF and recap email (fires when Stripe confirms payment; three parts: What I heard, Your strategy in five lines, Your 30/60/90-day targets)
- Simple Brand Hub: strategy + PDF download + recap
- Admin dashboard in full

> **Dependency note:** M5 needs M4's Stripe payment confirmed before the full strategy screen, PDF, recap email, and Brand Hub are accessible to the member. The first session (Home → approve four weeks) only makes sense after the member has paid and unlocked their strategy. M5 cannot be fully tested end-to-end until M4's checkout is live on staging.

### M5 — Dec 19 to 20
PRDs: 6, 8, 12, contract

- Month setup (Your month on one page: this month's number, what is on track, what is still to find, moves with impact/effort tags and Why this line)
- Two tests per month (test 1 in weeks 1–2, test 2 in weeks 3–4), test ideas
- Posts a week ahead, each tied to a pillar, week theme, platform, and test
- Review and approval panel (post by post or a week at a time; both versions of a test approved together)
- Copy and Mark as posted (records the time each post went out)
- Tracked short links with UTM tags on every post that has a link
- Activation event: triggered when four weeks of content are approved
- The first session (four steps on Home): read strategy and recap → set up brand kit (skippable) → set up first month and its tests → approve first four weeks
- Home, This week, Start here card
- Execution brief behind every post

### M6 — Dec 21 to 23 (launch must-have)
PRDs: 11, 14

- LinkedIn connect: personal profiles (Sign In with LinkedIn, OpenID Connect, `w_member_social` scope) via MOXIEMO's own LinkedIn developer app
- LinkedIn connect: company pages (Community Management API) via separate MOXIEMO LinkedIn developer app
- LinkedIn publishing queue (post counts as published only when LinkedIn's webhook confirms it)
- Lapsed connection banner and email, "Reconnect to keep publishing" prompt; posts continue writing while disconnected (member can copy by hand)
- Growth reporting:
  - Goal progress (target and progress, by month on one page)
  - What moved (results by channel and by post, tracked link clicks)
  - What we learned (every test with day-7 early read and day-14 final read, answer in plain words, what changed)
  - Scheduled job runs reads each morning automatically
  - Run read now button in admin as backup

> **Dependency note:** M6 needs M5's posts and tests in the DB to have anything to publish or read. LinkedIn publishing only counts a post as published when the webhook confirms it — so M5's "Copy and Mark as posted" is the fallback if M6's LinkedIn connection is not yet set up. Both must be live before doors open on Dec 23 for a member to complete the full path.

---

## Post-launch (not launch — Phase 3 and beyond)

| Phase | What ships |
|-------|-----------|
| Phase 3, weekly loop | Test reads day 7 and day 14 (automated), What we learned, next month built from results, learning records |
| Phase 4, reach | Instagram and Facebook through Zernio, three plans with real limits and $6 add-on, email builder (HTML export, Klaviyo/Mailchimp/Kit), photo library, product cards, uploads, edit and rebuild |
| Phase 5, companion | Text MOXIE, month-end retro, shareable monthly update, stories, Ask MOXIE drafted changes, voice and attachments |
| Phase 6, scale | Brand switcher, team seats, blog and SEO/AEO content, Google Analytics and Search Console, MCP server |
| Later | Agency workspaces, client share links, attribution, websites |

---

## Pricing (for Stripe setup in M4)

| Plan | Regular | Founding (50% off for life) | Includes at launch |
|------|---------|-----------------------------|--------------------|
| Clarity | $99/mo | $49.50/mo | 1 brand, 3 social accounts, 2 tests/month |
| Momentum | $149/mo | $74.50/mo | 2 brands, up to 6 social accounts, 4 tests/month |
| Multiply | $249/mo | Phase 4 only | — |

- 100 shared founding seats across both plans
- 30-day money-back guarantee on first payment only
- 1.0 members: email-locked coupon (30 days free + 50% off for life), outside the 100 founding seats
- 1.0 app closes March 31, 2027

---

## What Karee needs from me (developer) — week of Nov 21

| Item | Detail |
|------|--------|
| Estimate for M1–M6 | Confirmed: Dec 23 launch, build done Dec 23. Development starts Nov 21. Full milestone breakdown above. |
| 1.0 coupon proposal | My proposal: Stripe coupon activates server-side only if the account's verified email is on Karee's 1.0 list. No screen/receipt/invoice says "trial." Awaiting Karee's confirmation or a better suggestion. |
| M2 question copy | Signed-off question wording (A1–A11, sets E/G/R, C1–C6, goal modules, DX, Sharpen) needed to load the question bank as DB rows. Without final copy, placeholder text is loaded now and replaced via admin editor — no rebuild required. |

---

## What I need from Karee — full running list

### By November 27 (before M1)

| Item | Detail |
|------|--------|
| Final founding promise wording | Draft: "Founding members get MOXIEMO at 50 percent off for life, for as long as you keep your founding membership. Choose Clarity at $49.50 a month or Momentum at $74.50 a month. Only 100 founding seats, with a 30-day money-back guarantee on your first payment." |
| Launch an offer gate — final wording | Three questions and pass rule (all three Yes). Questions are in PRD 2's goal card table. Final wording by Nov 27. |
| Not yet coaching copy | For both goals (First 100 and Launch an offer), in MOXIE's voice. Shape: say what is missing, give one thing to do this week, say how to come back. |
| Ten seed playbook rules | Ten rules with their Why lines, in final approved form. These load into the admin editor on day one of M1. Conflict order: safety → feasibility → primary goal → evidence → specificity. |

### By December 4 (before M2)

| Item | Detail |
|------|--------|
| Signed-off question wording | For all discovery questions — A1–A11, sets E, G and R, C1–C6, goal modules, DX and Sharpen. A late sign-off changes words only, never a screen or table — it is a data edit in admin, not a rebuild. |
| Example answers | One per question per business type for Show me an example. If no approved example exists for a question, the link hides. No placeholders. |

### By December 11 (before M3)

| Item | Detail |
|------|--------|
| Mockups | Reveal screen, full strategy screen, paywall |
| PDF layout | In MOXIEMO's look, same order and words as the strategy screen |
| MOXIE's build lines | Six lines, one per pipeline stage, fixed copy, final. Current draft: "I am reading everything you told me." / "I am working out what is most likely holding your growth back." / "I am shaping where you stand in your market." / "I am writing your strategy, one section at a time." / "I am planning your 90 days and your first two tests." / "I am drafting your first week." — confirm or replace. |

### By December 11 (before M3 — strategy test cases)

| Item | Detail |
|------|--------|
| Real test businesses | Four to six businesses (with their permission) for the "would I sign this strategy" test |
| Test case discovery answers | Made-up but realistic answers that trigger each of the five pipeline scenarios |
| Strategy-1.1 frozen | The prompt version that ships with M3 |

### Before December 16

| Item | Detail |
|------|--------|
| Resend API key | In the password vault |
| Alicia Smith access | Confirmed access to Supabase, Stripe, Vercel, and Resend before launch readiness |

---

## LinkedIn setup — two developer apps required

LinkedIn policy requires two separate apps registered at linkedin.com/developers:

| App | Purpose | Scopes |
|-----|---------|--------|
| App 1: MOXIEMO (Sign In) | Personal profile connect and member posting | `openid`, `profile`, `email`, `w_member_social`, `r_member_postAnalytics`, `r_member_profileAnalytics` |
| App 2: MOXIEMO Pages | Company page connect and page posting | `r_organization_admin`, `w_organization_social`, `r_organization_social`, `rw_organization_admin` |

Both apps are built in the codebase. Secrets must be added to Supabase Edge Function environment before the M6 demo.

---

## Ops secrets needed before go-live (environment setup — not code)

### Supabase Edge Function secrets
`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FOUNDATION`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`, `RESEND_API_KEY`, `RESEND_FROM`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_PAGES_CLIENT_ID`, `LINKEDIN_PAGES_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`, `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

> **Note:** Twilio removed — Text MOXIE (PRD 19) is Phase 5, not launch. Zernio handles the toll-free number at launch.

### Google OAuth setup (before launch — Supabase dashboard, not edge function secrets)
1. Create a Google Cloud project at console.cloud.google.com
2. Enable the OAuth 2.0 API and create a Web application credential
3. Add authorised redirect URI: `https://mqhipuvkdsvapbhrrzjd.supabase.co/auth/v1/callback`
4. Paste the Client ID and Client Secret into **Supabase Dashboard → Authentication → Providers → Google**

> **Note:** "Continue with Google" is already built in the codebase (`Auth.tsx`). Supabase handles the OAuth flow — no edge function secret required.

### Stripe setup (before M4)
1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase secrets
2. Register webhook endpoint pointing to the `stripe-webhook` edge function
3. Enable five event types: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
4. Create founding coupon (50% off, duration: forever) and set the coupon ID in environment

---

## Build Stack

**Frontend:** React 18.3, Vite 5.4, TypeScript 5.8, React Router, TanStack Query, shadcn/ui, Tailwind CSS, Recharts, Sentry, PostHog, Vitest

**Backend:** Supabase (PostgreSQL, Auth, RLS, 74 Edge Functions), pg_cron + pgmq, Anthropic Claude API, Stripe, Resend, Zernio, Supabase Storage

**Infrastructure:** Vercel (2.0 app hosting → app.buildwithmoxiemo.com), Lovable (1.0 brochure → buildwithmoxiemo.com), GoDaddy + Cloudflare (domain + DNS — CNAME app → Vercel), Supabase ca-central-1 (database + edge functions)

**Note — LinkedIn requires two separate developer apps:** personal profiles (Sign In with LinkedIn, OpenID Connect) and company pages (Community Management API) are separate apps per LinkedIn policy. Both are built in the codebase. Secrets for both apps must be added to Supabase Edge Function environment before the M6 demo.

---

*Source of truth: MOXIEMO 2.0 Non-Lovable Build Plan (PRDs 0–20) and Karee's answers doc dated Nov 12, 2026. Where this document and a PRD differ, the PRD wins.*
