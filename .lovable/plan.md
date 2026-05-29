## Goal

When a user submits a website URL in Discovery (via the existing upload gate or the onboarding website field), scrape the homepage plus up to 3 high-value subpages, extract a structured brand profile with Claude, and use it to (a) pre-fill Discovery answers, (b) personalize the AI's follow-up question phrasing, and (c) enrich the final strategy.

The Discovery flow, the document-upload pre-fill, the 16-question structure, and existing tables stay untouched.

## Changes

### 1. Database — `discovery_sessions.brand_data`
New nullable `jsonb` column on `discovery_sessions` storing the extracted brand JSON (business_name, tagline, what_they_do, who_they_serve, services, transformation_language, voice_tone, social_proof, founder_name, founder_background, mission_or_values, pricing_signals). One migration. No other schema changes.

### 2. Edge function — `discovery-prefill` (enhance URL path only)
Document path is unchanged. When a `url` is submitted:
- Normalize URL, fetch homepage with 8 s timeout.
- Try these subpaths in parallel (8 s each, max 3 successful): `/about`, `/about-us`, `/work-with-me`, `/services`, `/coaching`, `/consulting`, `/pricing`, `/faq`, `/start-here`. Skip 404s / redirects to off-domain / fetch errors silently.
- Strip HTML → plain text per page (existing `htmlToText` helper), label each chunk by URL, cap combined text at ~40k chars.
- Run two extractions in parallel against the combined text:
  - Existing Gemini 15-question extractor (unchanged) → `answers`.
  - New Claude call (`claude-sonnet-4-20250514` via `ANTHROPIC_API_KEY`) using the user's brand-intelligence system prompt → `brand_data` JSON with `null` for low-confidence fields.
- Response now returns `{ answers, questions, brand_data }`. Failure of the Claude call returns `brand_data: null` without breaking answers; total scrape failure returns the empty result the client already handles.

### 3. Edge function — `synthesize-strategy`
Accept an optional `brandContext` field on the request body containing `mission_or_values`, `founder_background`, `pricing_signals`, `social_proof`. When present, append a short "ADDITIONAL BRAND CONTEXT FROM WEBSITE" block to the user prompt before calling Claude. No prompt rewrite, no schema change to `strategies`.

### 4. Edge function — `discovery-chat`
Accept optional `brandContext` on the request (voice_tone, transformation_language, social_proof). When present, append a short addendum to the system prompt:
- Mirror `voice_tone` in question phrasing.
- When asking Q1 (transformation), reference `transformation_language` if available.
- When asking about results / proof, reference `social_proof` if available.
No change to the 16-question structure or `[MODE:][Q:#]` tags.

### 5. Frontend — `DiscoveryUploadGate.tsx`
Extend `PrefillResult` with optional `brand_data`. Pass it through `onComplete` unchanged. No UI copy changes for the document flow. For URL submissions, the existing "MOXIEMO is finding your answers..." loader covers the new scraping work.

### 6. Frontend — `Discovery.tsx`
- `startWithPrefill` persists `brand_data` to `discovery_sessions.brand_data` and keeps it in a ref.
- On every `discovery-chat` request, pass a trimmed `brandContext` (voice_tone, transformation_language, social_proof) so the AI can personalize follow-ups.
- On `synthesize-strategy`, pass a trimmed `brandContext` (mission_or_values, founder_background, pricing_signals, social_proof).
- If the brand scrape returned a useful payload, prepend one extra summary line in the existing prefill summary screen: "Got it. We pulled some details from your site to get us started — let us know if anything needs updating." If brand_data is null/empty, behave exactly as today.

### 7. Onboarding website field (optional path)
No change in this task. The new behavior is invoked only when the URL flows through `discovery-prefill` (i.e. the Discovery upload gate). Onboarding's `fetch-brand-assets` keeps its current shallow role.

## Out of scope

- Editing the 16-question flow, document-upload pre-fill, strategy schema, or any existing table.
- Storing raw HTML.
- Surfacing scrape errors to the user (silent fallback).
- Changes to `fetch-brand-assets`.
