# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or exposed credential.

Use GitHub's private vulnerability reporting for this repository. Include:

- Affected file, route, function, or database object
- Reproduction steps
- Expected and observed behavior
- Potential impact
- A suggested fix, if available

Do not access data that does not belong to you.

## Known credential history

An earlier version of this repository contained a Gemini API key in client source. Removing the key from the current tree does not revoke it or remove it from Git history.

The owner of that Google AI Studio project must treat the key as compromised, revoke it, review usage, and create a replacement. The replacement belongs only in Supabase Edge Function secrets.

The current client source contains no Gemini key, Supabase secret key, service-role key, or embedded legacy JWT.

## Dependency audit note

The current npm audit reports 11 moderate advisories in Expo's native build-tool chain through `xcode` and `uuid`. It reports zero high or critical advisories. npm's forced fix would install an incompatible Expo version, so the repository does not apply it. Recheck this advisory when Expo publishes a compatible upstream update.

## Security model

- Supabase email/password authentication identifies connected users.
- Row-level security restricts profiles and purchase decisions to their owner.
- Explicit grants limit authenticated clients to required data operations.
- AI usage events live in a private schema with no client grants.
- The quota function derives the user ID from `auth.uid()`.
- The Edge Function verifies the caller and never accepts a user ID from the request body.
- Demo mode uses local storage and does not contact Gemini.

## Operator responsibilities

Operators must:

- Use a Supabase project they control.
- Keep `.env.local` and function secrets out of Git.
- Revoke leaked credentials.
- Review Supabase Auth settings before public launch.
- Configure backups, retention, logs, and incident response for their deployment.
- Re-run the release gate after dependency or backend changes.

## Supported version

Security fixes target the latest commit on the default branch.
