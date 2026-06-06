# Add Lane 2 (Service-Based Businesses) to Discovery

This is **additive only**. Lane 1 (expertise-based) stays exactly as it is today — same prompt, same 15 questions, same synthesis path. Lane 2 is a parallel flow gated by a new business-model detector question asked before any other discovery question.

## 1. Database

Add a nullable column on `discovery_sessions` so we can persist the chosen lane and recover sessions on reload:

- `lane` `text` — values: `lane1` (expertise) or `lane2` (service business). Nullable. Default `null` until the detector answer is given.

No other schema changes. Strategy output continues to write into `strategies` using the existing schema; Lane 2 outputs are mapped onto the existing fields (positioning_statement, ideal_client, pain_point, transformation, voice_attributes, content_pillars, primary_channel, success_definition, business_goal, time_capacity) plus `enhanced_foundation` for the deeper sections.

## 2. Business-model detector (new gate before chat starts)

After the existing `DiscoveryUploadGate` / prefill summary, before any `discovery-chat` streaming begins, render a small in-page card with the question:

> "How would you describe your business model?"

Options:
1. **I sell my expertise directly** — coaching, consulting, advisory, or fractional services → `lane1`
2. **I run a service-based business** that delivers services through a team or providers → `lane2`
3. **I operate a platform or marketplace** connecting customers with service providers → `lane2`
4. **Other** → show follow-up textarea "Tell us a little more about how your business works", then run a tiny classifier on the text and route to the best-fit lane (default `lane2` unless the text clearly matches solo expertise patterns like "1:1 coaching", "consulting", "fractional", "advisory").

The chosen lane is persisted on `discovery_sessions.lane` and then chat begins. Existing prefill answers still pre-populate input wherever the Q numbers map.

## 3. Lane 1 — unchanged

If `lane === 'lane1'`, the app uses the existing `discovery-chat` edge function and existing `synthesize-strategy` path exactly as today. No edits to that system prompt, no edits to the 15-question flow.

## 4. Lane 2 — new conversational flow

### Edge function: `discovery-chat-lane2` (new)

Mirrors `discovery-chat`'s streaming/retry/SSE shape, but ships a different system prompt:

- Same conversational MOXIEMO voice and same `[MODE:standard|coaching|placeholder] [Q:1-15]` tagging convention so the frontend's progress UI keeps working without changes.
- 5 visible sections shown to the user as section headers in the message stream ("Section 1 — Business foundation", etc.).
- 15 questions, asked one at a time, using the **exact** copy from the spec, with option lists rendered inline:
  - Section 1: Q1 service description; Q2 problem/consequences; Q3 revenue model (options).
  - Section 2: Q4 primary customer (options); Q5 ideal customer; Q6 geography (options); Q7 customer choosing between you and a competitor.
  - Section 3: Q8 differentiation; Q9 best-customer quotes; Q10 brand personality (open with suggestions); Q11 never-want-to-feel.
  - Section 4: Q12 biggest growth challenge (options); Q13 customer acquisition today (multi-select + open follow-up); Q14 top 1–2 competitors.
  - Section 5: Q15 12-month success + number.
- After Q15, emit `<STRATEGY_COMPLETE>` token (same convention as Lane 1) so the existing client completion handler triggers synthesis.
- **No hard rejection prompts.** This system prompt never terminates the session. For ambiguous answers, the model asks a clarifying question (coaching mode) instead of rejecting.

### Edge function: `synthesize-strategy` (extended)

Accept a new optional request field `lane: "lane1" | "lane2"`. When `lane === 'lane2'`:

- Use a Lane 2 system prompt and user-content template that maps answers per the spec (Positioning = Q1+Q8+Q6 anchored to the business brand not personal expertise; Problem/solution = Q2+Q7; ICP = Q4+Q5+Q6; Brand pillars 3–5 from Q8+Q9+Q11 centered on trust/reliability/service quality/CX; Messaging framework = Q2+Q7+Q8; Voice = Q10+Q11 business-brand voice; Competitive positioning = Q14+Q8 ownable gap; Strategic priority weighting from Q12; Content strategy = Q9+Q1+Q5 with testimonials/before-after/behind-the-scenes/community/seasonal/referrals; Distribution = Q13+Q6 prioritizing GBP/local FB+IG/Nextdoor/referrals/local partnerships, doubling down on what's working in Q13; Goals = Q15 with 2–3 tracking metrics).
- Output is written into the **existing** `strategies` schema fields so the rest of the app (Strategy page, channels tab, content tab, etc.) renders without changes. `enhanced_foundation.brandArchetype` and `enhanced_foundation.voiceGuidelines` are still populated but framed as a business brand, not a personal/founder brand.
- Strength scoring stays in place; the Lane 2 path uses the same `parseModes` / score function since Q1–Q15 are still tagged.

### Lane 2 system prompt removes hard rejection

The existing Lane 1 prompt doesn't actually emit "MOXIEMO cannot build an effective strategy for [business name]" today, but we'll do a project-wide search to make sure no edge function, frontend toast, or system message can fire that string. Any match is removed and replaced with "Let's clarify a couple of things about your business" + a follow-up question.

## 5. Frontend: `src/pages/app/Discovery.tsx`

- New `lane` state, hydrated from `discovery_sessions.lane`.
- New `LaneDetector` component rendered when `uploadStage === 'chat'` and `lane === null`. Posts the selected lane to the session, then calls `startConversation`.
- `streamReply` routes to `/functions/v1/discovery-chat` when `lane === 'lane1'` and `/functions/v1/discovery-chat-lane2` when `lane === 'lane2'`. Same body shape, same SSE parsing.
- `synthesize` passes `lane` in the body to `synthesize-strategy`.
- Section header and progress UI: keep `TOTAL_QUESTIONS = 15` already shown; for Lane 2 the section labels come from a parallel `LANE2_SECTIONS` array. The existing progress bar keeps working since both lanes ask 15 questions.
- Prefill `prefillByQRef` only applies to Lane 1 (the prefill schema is expertise-shaped). For Lane 2, prefill is skipped; brand_data is still passed through to synthesis as `brandContext` for context only.

## 6. Out of scope

- No changes to Lane 1's prompt, flow, synthesis prompt, or strategy schema.
- No changes to `fetch-brand-assets`, `discovery-prefill`, or the upload gate.
- No new tables; the existing `strategies` schema is reused for Lane 2 output.
- Onboarding flow unchanged.

## 7. QA

- **Scenario A** (home services marketplace): detector → option 3 → routes to Lane 2 → 15 Lane 2 questions → strategy uses Lane 2 synthesis prompt → output has positioning anchored to the business brand, distribution prioritizes GBP / local FB+IG / Nextdoor / referrals based on Q13, content includes testimonials/before-after/community involvement, no references to thought leadership or personal expertise.
- **Scenario B** (executive coach): detector → option 1 → routes to existing Lane 1 → unchanged behavior end-to-end.
- **Scenario C**: confirm no code path can emit "MOXIEMO cannot build an effective strategy for…".
