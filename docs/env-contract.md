# Environment and Secrets Contract

This contract defines deployment-agnostic configuration requirements for Bingo Royale.

## Principles
- Keep environment variable names provider-neutral.
- Keep secret values out of source control.
- Resolve server-side env access through `src/server/config/env.ts`.
- Restrict direct `process.env` access to approved configuration modules.

## Variable Contract

| Variable | Required | Secret | Example | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | No | `production` | Standard runtime mode |
| `NEXT_PUBLIC_APP_URL` | Yes | No | `https://app.example.com` | Public app URL |
| `NEXTAUTH_URL` | Yes | No | `https://app.example.com` | Auth callback base URL |
| `DATABASE_URL` | Yes | Yes | `postgresql://...` | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Yes | random long string | Auth.js signing secret |
| `GOOGLE_CLIENT_ID` | No | Yes | provider value | Optional Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Yes | provider value | Optional Google OAuth |
| `CREDENTIALS_PASSWORD_PEPPER` | No | Yes | random long string | Optional credentials hardening |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | No | No | `15000` | UI polling base |
| `NEXT_PUBLIC_POLL_MAX_INTERVAL_MS` | No | No | `120000` | UI polling max |

## Secrets Model
- `DATABASE_URL`, `AUTH_SECRET`, and OAuth credentials are managed via host secret managers.
- Secrets must not be printed in logs.
- Secret rotation should happen before high-risk releases and after incident response.

## Enforcement and Tooling
- CI portability guardrail: `npm run check:portability`
- Guardrail checks:
  - blocks new unapproved `process.env` usage in app/source files
  - blocks unapproved raw SQL entry points (`$queryRaw*`, `$executeRaw*`)

## Hosting Notes
- This contract supports multiple hosting targets without code changes.
- Any target-specific behavior must be isolated in infrastructure adapters or deployment config, not in domain services.
