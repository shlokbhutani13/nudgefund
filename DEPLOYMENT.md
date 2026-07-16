# Deployment guide

This repository is deployment-ready. The commands below change external systems, so run them only from accounts and projects you control.

## 1. Release gate

Use Node.js 22 and Deno 2.

```bash
cd react-expo-app
npm ci
npm audit --omit=dev --audit-level=high
npx expo-doctor
npm test
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:e2e
cd ..
deno check supabase/functions/financial-coach/index.ts
```

Stop if any command fails.

## 2. Create the Supabase backend

Create a new Supabase project on the free plan. Store the generated database password in a password manager.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migration creates:

- `public.profiles`
- `public.purchase_decisions`
- `private.ai_usage_events`
- `public.consume_ai_quota(text)`

The public tables use row-level security. The private usage table has no client grants.

## 3. Configure and deploy the Edge Function

Create a Gemini API key in Google AI Studio. Keep it out of shell history where your environment requires stricter handling.

```bash
npx supabase secrets set \
  GEMINI_API_KEY=YOUR_GEMINI_KEY \
  GEMINI_MODEL=gemini-2.5-flash-lite

npx supabase functions deploy financial-coach
```

Confirm the function requires a valid user JWT. The function should return:

- `401` without authentication
- `422` for malformed requests
- `429` after the user's twelfth request in a rolling hour
- `503 ai_unavailable` when Gemini is not configured or unavailable

## 4. Configure the client

Create `react-expo-app/.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The Supabase URL and publishable key are public client configuration. Do not use a secret key, legacy service-role key, or Gemini key in an `EXPO_PUBLIC_` variable.

## 5. Export the web app

```bash
cd react-expo-app
npm run export:web
npx expo serve
```

Expo writes the static site to `react-expo-app/dist`.

## 6. Prepare Vercel

Create a Vercel project with `react-expo-app` as its root directory. The included `vercel.json` uses:

- Build command: `npm run export:web`
- Output directory: `dist`
- Static Expo Router output
- Basic security headers

Add these Vercel environment variables for Production, Preview, and Development:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not deploy until you intend to publish the app.

## 7. Credentialed smoke test

After deployment:

1. Create a fresh account.
2. Confirm email if the Supabase project requires it.
3. Sign in and save profile preferences.
4. Complete a purchase check.
5. Refresh and confirm the decision persists.
6. Open the history, growth, and reports tabs.
7. Sign out and sign back in.
8. Confirm a second user cannot read the first user's rows.
9. Check browser console and Supabase Function logs for errors.
10. Verify mobile and desktop layouts.

Do not add a production URL to the README until this test passes.
