# NudgeFund Rebuild Design

## Product objective

NudgeFund helps users pause before discretionary purchases, reflect on the decision, record what they finally spent, and see how redirected money could grow over time.

The rebuilt repository must work as a polished portfolio project without depending on Rahul's Supabase or Expo accounts. It will support a real connected mode through a new Supabase project owned by Shlok and a credential-free demo mode for reviewers.

NudgeFund provides behavioral guidance and educational projections. It does not provide individualized investment, tax, legal, or financial advice.

## Project constraints

- Keep Expo and Expo Router so one TypeScript codebase supports web, iOS, and Android.
- Create a new Supabase project owned by Shlok; do not modify Rahul's Supabase data or Expo/EAS project.
- Preserve Rahul Rajkumar's contributor credit in the repository.
- Use free service tiers and add usage limits that protect the Gemini quota.
- Remove hardcoded project identifiers and secrets from the current source tree.
- Never expose a Gemini key through an `EXPO_PUBLIC_` variable or client bundle.
- Do not deploy the rebuilt application to production without separate approval.
- Do not force-push rewritten Git history without separate approval.
- Keep the live product claims aligned with verified behavior.

## User modes

### Connected mode

Users create an account or sign in through Supabase Auth. Purchases, decisions, AI coaching, and reports persist in Postgres and synchronize across devices.

The app enables connected mode only when both of these public environment variables exist:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Demo mode

Reviewers can enter demo mode without credentials. The app stores demo decisions on the current device and uses deterministic coaching responses instead of contacting Gemini.

Demo mode must state that:

- Data stays on the current browser or device.
- Clearing application storage can erase demo data.
- Gemini and cloud synchronization are disabled.

The login screen offers both **Sign in** and **Explore demo**.

## Product flow

### Authentication and onboarding

Connected users can sign up, sign in, reset a password, and sign out. After authentication, a short onboarding step asks for:

- Display name
- Preferred currency
- Monthly savings goal

Demo users receive a sample profile and can edit local preferences.

### Dashboard

The dashboard shows:

- Money redirected from reconsidered purchases
- This month's discretionary spending
- Progress toward the monthly savings goal
- Recent decisions
- A weekly behavioral nudge
- A call to start a new purchase check

### Purchase check

The purchase flow has four bounded steps:

1. Enter the item, planned amount, and category.
2. Answer three coaching questions.
3. Review a coaching verdict with reasons and a practical alternative.
4. Record the final item and amount.

Connected mode requests questions and verdicts from the authenticated `financial-coach` Edge Function. Demo mode generates deterministic questions and verdicts from the category, amount, and answers.

The app stores the completed decision only after the user confirms the final item and amount.

### Decision history

Users can filter completed decisions by category and verdict. Each card shows:

- Original plan
- Final decision
- Amount redirected
- Verdict
- Date

### Growth projection

The investment screen treats redirected money as an educational projection. Users choose a predefined annual return assumption and time horizon. The screen shows the projected future value and states that returns are hypothetical and not guaranteed.

### Monthly report

The report summarizes:

- Total final spending
- Total redirected amount
- Decisions by verdict
- Top spending category
- Month-over-month change when enough data exists

Connected mode can request one short Gemini summary per month. Demo mode produces the same response shape from deterministic calculations.

## Visual design

NudgeFund will use a calm behavioral-finance visual system rather than a banking-dashboard template.

- Background: warm off-white `#F4F5F0`
- Primary ink: deep green `#10251E`
- Positive accent: mint `#35B983`
- Reflection accent: amber `#E2AA3B`
- Risk accent: muted red `#C65D52`
- Surfaces: white with restrained borders and shadows
- Typography: strong numeric hierarchy, short labels, readable supporting text

The interface will use 44-pixel minimum touch targets, visible focus states on web, reduced-motion support, and layouts that work at 390, 768, 1024, and 1440 pixels.

## Application architecture

### Client layers

`app/` contains Expo Router screens and route layouts.

`features/` contains product modules:

- `auth`
- `dashboard`
- `decisions`
- `reports`
- `projections`

`lib/` contains shared infrastructure:

- Environment validation
- Platform-safe persistence
- Supabase client initialization
- Repository selection
- Currency and calculation helpers
- AI response validation

`data/` contains two implementations behind the same interface:

- `SupabaseDecisionRepository`
- `LocalDecisionRepository`

Screens consume repository interfaces rather than importing Supabase directly. This keeps demo and connected behavior consistent and testable.

### Platform-safe storage

Native builds use AsyncStorage. Browser builds use `localStorage`. Static rendering uses a no-op memory adapter until the browser hydrates.

The Supabase client must not access `window` or AsyncStorage during Expo's Node-based static rendering pass. This removes the current `window is not defined` export failure.

### Supabase

Supabase provides:

- Email/password authentication
- User profiles
- Purchase-decision persistence
- AI usage logs
- An authenticated Gemini Edge Function

The client uses the project URL and publishable key. Those identifiers are public by design, but the repository stores only placeholders. The Gemini key lives only in Edge Function secrets.

### Gemini

One Edge Function named `financial-coach` accepts these request kinds:

- `questions`
- `verdict`
- `monthly_report`

Every request requires a valid Supabase user JWT. The function validates input length and numeric ranges, checks the user's hourly request count, calls the model defined by `GEMINI_MODEL`, validates structured JSON, and returns a stable response.

The default model is `gemini-2.5-flash-lite`. The operator can change it without rebuilding the client.

Gemini failures return a safe error code. The client then offers deterministic coaching instead of blocking the purchase flow.

## Data model

### `profiles`

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text`
- `currency_code text`
- `monthly_savings_goal numeric(12,2)`
- `created_at timestamptz`
- `updated_at timestamptz`

### `purchase_decisions`

- `id uuid primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `item_name text`
- `planned_amount numeric(12,2)`
- `category text`
- `questions jsonb`
- `answers jsonb`
- `verdict text`
- `recommendation text`
- `final_item_name text`
- `final_amount numeric(12,2)`
- `amount_redirected numeric(12,2)`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints require non-negative amounts, three questions and answers, and verdict values of `positive`, `neutral`, or `negative`. The database calculates `amount_redirected` as the non-negative difference between planned and final amounts.

### `private.ai_usage_events`

- `id bigint generated by default as identity primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `request_kind text`
- `created_at timestamptz`

The function uses its server-side Supabase admin client to count and insert usage events. The table is not exposed through the Data API. The function permits at most 12 coaching requests per authenticated user per rolling hour. Old usage events can be removed through a later scheduled maintenance task.

## Row Level Security

RLS is enabled on every public table.

Authenticated users can select, insert, update, and delete only public-table rows where `(select auth.uid())` equals the row's user ID.

Profile updates use both `USING` and `WITH CHECK`. Purchase-decision updates and deletes use the same ownership rule. Client roles receive no access to `private.ai_usage_events`.

The migration grants the minimum required table and sequence permissions to `authenticated`. Anonymous database access is not granted.

## Error handling

- Missing Supabase configuration activates demo mode instead of crashing.
- Invalid forms keep entered values and show field-specific messages.
- Expired sessions return users to sign-in without deleting local draft input.
- Database failures show a retry action and do not duplicate a saved decision.
- Edge Function authentication failures request a fresh session.
- Gemini failures activate deterministic coaching and label the response.
- Export and hydration code never accesses browser-only globals during static rendering.

## Security response

The current Gemini key is public in Git history and must be revoked by whoever owns its Google AI Studio project. Removing it from the latest source does not invalidate it.

The rebuild will:

- Remove the key from the current tree.
- Add secret-pattern tests and GitHub secret scanning.
- Document the required revocation.
- Use a new Gemini key only as a Supabase Edge Function secret.

Git history rewriting remains a separate destructive operation that requires explicit approval after the replacement key is active.

## Testing

### Unit tests

- Amount and projection calculations
- Purchase input validation
- Deterministic coaching
- AI response schema validation
- Environment and repository-mode selection
- Platform storage selection

### Component tests

- Login and demo entry
- Dashboard populated and empty states
- Purchase-check step transitions
- Final decision save
- Report and disclaimer rendering

### Supabase tests

- Migration contains RLS on every public table
- Policies restrict rows by user ID
- Edge Function rejects unauthenticated callers
- Edge Function rejects malformed amounts and oversized text
- Rate-limit logic blocks the thirteenth request in one hour

### Release checks

- `npm audit`
- ESLint with zero errors
- TypeScript with zero errors
- All tests pass
- Expo web export completes
- Browser smoke test passes on desktop and mobile widths
- GitHub Actions passes from a clean install

## Repository presentation

The public repository will include:

- Product-focused README
- Current screenshots
- Architecture diagram
- Local and connected setup
- Supabase migration and Edge Function instructions
- Demo limitations
- Security and privacy notes
- CI badge, MIT license, topics, and contribution attribution

The existing Vercel homepage returns 404. The rebuild will prepare correct static-export and Vercel configuration, but production deployment requires separate approval.
