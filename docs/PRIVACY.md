# Privacy notes

This document describes the repository's behavior. A public operator must publish a policy that matches their deployment, jurisdiction, vendors, retention rules, and contact details.

## Demo mode

Demo mode:

- Does not require an account
- Stores profile preferences and decisions on the current browser or device
- Does not call Gemini
- Does not sync across devices

Clearing browser or application storage can erase demo data.

## Connected mode

Connected mode sends data to the operator's Supabase project:

- Email and authentication metadata
- Display name, currency, and monthly goal
- Purchase plans, reflection questions, answers, outcomes, and timestamps
- AI request timestamps used for rate limiting

Supabase row-level security restricts profile and decision rows to their owner.

## AI processing

Connected coaching sends the validated purchase context or monthly summary from the Edge Function to Gemini. The Edge Function does not need a user's email address for coaching and does not include it in prompts.

Operators should review Google's current data handling terms before launch.

## Financial limitation

NudgeFund provides educational prompts and hypothetical growth calculations. Users should not treat its output as investment, tax, legal, or individualized financial advice.

## Deletion

The app lets users remove individual purchase decisions. An operator should add an account-deletion workflow and retention policy before a broad public launch.
