# Contributing

Thanks for improving NudgeFund.

## Before opening a pull request

1. Create a focused branch.
2. Keep credentials and personal data out of fixtures, logs, screenshots, and commits.
3. Add or update tests for behavior changes.
4. Run the local release checks.

```bash
cd react-expo-app
npm ci
npm test
npm run lint
npm run typecheck
npm run test:e2e
```

Run `deno check supabase/functions/financial-coach/index.ts` when you change the Edge Function or shared server contracts.

## Project boundaries

- Screens consume repositories and the financial coach through `AppServicesContext`.
- Demo behavior belongs in local adapters and deterministic coaching.
- Connected behavior belongs in Supabase adapters, migrations, and Edge Functions.
- Client code may use only the Supabase URL and publishable key.
- Database changes require a new migration. Do not edit an applied production migration.

## Pull requests

Describe:

- The user-visible change
- The implementation boundary
- Tests you ran
- Security or data-model impact
- Screenshots for UI changes

Keep unrelated cleanup out of the same pull request.
