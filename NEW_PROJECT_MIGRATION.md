# MOXIEMO 2.0 — New Supabase Project Migration (ca-central-1 → us-east-1)
# Prepared: Nov 14, 2026
# Estimated time: 2–3 hours

---

## Why
Current project: ca-central-1 (Montreal)
Members: Georgia, USA
Round-trip latency: ~180ms per request
After move to us-east-1 (North Virginia): ~15ms per request
Strategy pipeline time saved: 1–2 minutes per full run

---

## STEP 1 — Create new Supabase project (5 min)

1. Go to supabase.com/dashboard
2. Click "New project"
3. Name: MOXIEMO-2.0-PROD
4. Region: **US East (North Virginia) — us-east-1**  ← critical
5. Generate a strong database password — save it in your password vault
6. Click "Create new project"
7. Wait for it to provision (~2 min)
8. Go to Settings → General — copy the new **Project ID** (looks like: abcdefghijklmnop)

---

## STEP 2 — Upgrade to Pro (2 min)

1. Settings → Billing → Upgrade to Pro ($25/month)
2. Do this BEFORE running migrations — Pro gives you more DB resources during migration

---

## STEP 3 — Link the new project locally (2 min)

Run in terminal inside /Users/santro93/marketing_product/moxiemo-platform:

```bash
supabase link --project-ref YOUR_NEW_PROJECT_ID
```

Enter the database password you set in Step 1 when prompted.

---

## STEP 4 — Run all migrations (5–10 min)

```bash
supabase db push --linked
```

This runs all 101 migrations in order automatically.
Watch for any errors — if one fails, the rest stop. Fix and re-run.

---

## STEP 5 — Set all edge function secrets (10 min)

Run each of these in terminal (replace values with your actual keys from the old project):

```bash
supabase secrets set --project-ref YOUR_NEW_PROJECT_ID \
  ANTHROPIC_API_KEY="sk-ant-..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  RESEND_API_KEY="re_..." \
  RESEND_FROM="hello@buildwithmoxiemo.com" \
  LINKEDIN_CLIENT_ID="..." \
  LINKEDIN_CLIENT_SECRET="..." \
  LINKEDIN_PAGES_CLIENT_ID="..." \
  LINKEDIN_PAGES_CLIENT_SECRET="..." \
  LINKEDIN_REDIRECT_URI="https://YOUR_NEW_PROJECT_ID.supabase.co/functions/v1/social-oauth-callback" \
  APP_URL="https://app.buildwithmoxiemo.com" \
  PEXELS_API_KEY="..." \
  ZERNIO_API_KEY="..." \
  ZERNIO_WEBHOOK_SECRET="..." \
  STRIPE_PRICE_FOUNDATION="price_..." \
  STRIPE_PRICE_GROWTH="price_..." \
  STRIPE_PRICE_SCALE="price_..." \
  LOVABLE_API_KEY="..."
```

To verify all secrets are set:
```bash
supabase secrets list --project-ref YOUR_NEW_PROJECT_ID
```

---

## STEP 6 — Deploy edge functions (3 min)

```bash
supabase functions deploy --project-ref YOUR_NEW_PROJECT_ID
```

This deploys all 71 edge functions at once.

---

## STEP 7 — Manual dashboard steps (15 min)

These CANNOT be done via CLI — must be done in the Supabase dashboard for the new project.

### 7a — Auth: Custom JWT Claims hook
1. Dashboard → Authentication → Hooks
2. Add hook: "Custom Access Token"
3. Function: `public.handle_auth_user_jwt`
4. This wires the is_admin claim into every JWT — without this, admin panel breaks

### 7b — Auth: Email hook
1. Dashboard → Authentication → Hooks
2. Add hook: "Send Email"
3. Edge function: `auth-email-hook`
4. This routes all auth emails (password reset, magic link) through Resend

### 7c — Auth: Email settings
1. Dashboard → Authentication → Email Templates — verify templates look correct
2. Dashboard → Authentication → URL Configuration:
   - Site URL: `https://app.buildwithmoxiemo.com`
   - Redirect URLs: add `https://app.buildwithmoxiemo.com/**`

### 7d — Stripe webhook
1. Go to dashboard.stripe.com → Webhooks → Add endpoint
2. URL: `https://YOUR_NEW_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the new webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_NEW_VALUE" --project-ref YOUR_NEW_PROJECT_ID
   ```

### 7e — pg_cron: verify cron jobs registered
The migrations register cron jobs automatically, but verify in the Supabase SQL editor:

```sql
SELECT jobname, schedule, command FROM cron.job;
```

Expected jobs:
- `process-email-queue` — every 5 seconds
- `generation-queue-dispatch` — every 10 seconds

If missing, run manually:
```sql
SELECT cron.schedule('process-email-queue', '5 seconds', $$ SELECT private.email_queue_dispatch(); $$);
SELECT cron.schedule('generation-queue-dispatch', '10 seconds', $$ SELECT private.generation_queue_dispatch(); $$);
```

---

## STEP 8 — Update .env file (2 min)

Edit /Users/santro93/marketing_product/moxiemo-platform/.env:

```
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
```

Get the new anon key from: Dashboard → Settings → API → Project API keys → anon public

---

## STEP 9 — Update supabase/config.toml (1 min)

```
project_id = "YOUR_NEW_PROJECT_ID"
```

---

## STEP 10 — Update Vercel environment variables (5 min)

1. Go to vercel.com → your project → Settings → Environment Variables
2. Update these three for Production, Preview, and Development:
   - `VITE_SUPABASE_URL` → `https://YOUR_NEW_PROJECT_ID.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → new anon key
   - `VITE_SUPABASE_PROJECT_ID` → new project ID
3. Redeploy: Deployments → three dots → Redeploy

---

## STEP 11 — LinkedIn OAuth redirect URIs (5 min)

The LinkedIn apps have hardcoded redirect URIs. Update both apps:

1. linkedin.com/developers → App 1 (MOXIEMO Sign In)
   - Auth → Redirect URLs → add: `https://YOUR_NEW_PROJECT_ID.supabase.co/functions/v1/social-oauth-callback`

2. linkedin.com/developers → App 2 (MOXIEMO Pages)
   - Auth → Redirect URLs → add: `https://YOUR_NEW_PROJECT_ID.supabase.co/functions/v1/social-oauth-pages-callback`

---

## STEP 12 — Smoke test (20 min)

Run these tests on the new project before switching DNS:

| Test | Expected |
|------|----------|
| Sign up new account | Profile + account + brand rows created |
| Password reset email | Arrives via Resend within 30 seconds |
| Complete onboarding (all 6 steps) | Redirects to /app/discovery |
| Discovery chat — first message | MOXIE responds within 5 seconds |
| Generate first move (step 5) | AI response within 15 seconds |
| Strategy page load | Loads without spinner freeze |
| Admin panel (Karee's account) | Shows admin UI, not redirect |

---

## STEP 13 — Old project (do NOT delete yet)

Keep the old ca-central-1 project running for 7 days after go-live.
Reason: if any member data was written to the old project during the transition window,
you can recover it. After 7 days with no issues, pause or delete it.

---

## Keys to get from old project before you start

Go to old project dashboard → Settings → API:
- Project URL (you have this: mqhipuvkdsvapbhrrzjd)
- anon/public key (you have this in .env)
- service_role key (Settings → API → service_role — keep this secret)

Go to old project dashboard → Edge Functions → each function's logs if you need to verify any secrets.

---

## Summary of what changes vs what stays the same

| Item | Changes | Stays same |
|------|---------|-----------|
| Project ID | YES — new ID | — |
| Anon key | YES — new key | — |
| Service role key | YES — new key | — |
| All secrets (API keys) | NO — same values, just re-entered | ✓ |
| Stripe price IDs | NO | ✓ |
| Stripe product IDs | NO | ✓ |
| LinkedIn app credentials | NO — same values | ✓ |
| All migrations / schema | NO — same SQL runs on new DB | ✓ |
| All edge function code | NO — same code deploys | ✓ |
| Vercel frontend code | NO | ✓ |
| App domain | NO | ✓ |
