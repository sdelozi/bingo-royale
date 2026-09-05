# Deployment Readiness Runbook

This runbook covers Epic E8 Story E8-S3 tasks:
- T55 deployment checklist and environment variable matrix
- T56 production database migration strategy
- T57 observability basics

## 1. Pre-Deployment Checklist (T55)

### Source and CI gates
- Branch is up to date with `develop`.
- Pull request is approved.
- CI checks pass (`lint`, `test`, and required PR checks).
- Changelog is updated for behavior-changing work.

### Application readiness
- `npm ci` succeeds in a clean environment.
- `npm run build` succeeds.
- Critical user journeys are smoke-tested:
  - register/sign-in
  - create or join group
  - board mark/unmark
  - leaderboard load

### Database readiness
- New Prisma migration files are committed when schema changes exist.
- Production deploy plan uses `npm run db:migrate:deploy`.
- Rollback plan for this release is documented before deployment.

### Runtime readiness
- Required environment variables are set for target environment.
- Secrets are rotated/validated where required.
- Health endpoint returns `200` before traffic cutover.

## 2. Environment Variable Matrix (T55)

| Variable | Required | Scope | Example | Purpose |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | app | `production` | Runtime mode |
| `NEXT_PUBLIC_APP_URL` | Yes | app | `https://app.example.com` | Canonical app URL |
| `NEXTAUTH_URL` | Yes | auth | `https://app.example.com` | Auth callback/base URL |
| `DATABASE_URL` | Yes | db | `postgresql://...` | Primary PostgreSQL connection |
| `AUTH_SECRET` | Yes | auth | random long string | Auth.js token/session signing |
| `GOOGLE_CLIENT_ID` | No | auth | provider value | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | No | auth | provider value | Google OAuth client secret |
| `CREDENTIALS_PASSWORD_PEPPER` | No | auth | random long string | Additional credentials hash hardening |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | No | ui | `15000` | Initial polling interval |
| `NEXT_PUBLIC_POLL_MAX_INTERVAL_MS` | No | ui | `120000` | Polling backoff cap |

## 3. Production DB Migration Strategy (T56)

### Principles
- Never use `prisma db push` in production.
- Use committed migration files only.
- Apply migrations before promoting a new app version.
- Keep migrations backward-compatible with at least one app version where practical.

### Standard deployment sequence
1. Verify the release commit contains all expected migration files.
2. Deploy app artifact in a non-serving or maintenance-safe mode (or pre-traffic phase).
3. Run:
   - `npm run db:migrate:deploy`
4. Start or promote application runtime.
5. Validate `/api/health` returns `200` and smoke-test key flows.

### Failure handling
- If `db:migrate:deploy` fails:
  - stop rollout,
  - do not continue application promotion,
  - inspect migration status and database logs,
  - apply corrective migration or rollback release depending on impact.
- If app deploy fails after successful migration:
  - roll forward with a fixed app build when possible,
  - avoid ad-hoc schema reversions unless a prepared down-plan exists.

### Local and CI notes
- Development schema iteration can use `npm run db:migrate`.
- CI should run migrations in ephemeral environments when integration coverage expands.

## 4. Observability Basics (T57)

### Health checks
- Endpoint: `GET /api/health`
- Behavior:
  - Returns `200` with `{ status: "ok" }` when app and DB checks pass.
  - Returns `503` with `{ status: "degraded" }` when DB check fails.

### Key metrics
- Endpoint: `GET /api/metrics`
- Includes:
  - process uptime (`uptimeSeconds`)
  - process memory RSS (`memoryRssBytes`)
  - in-memory counters (`counters`)
- Counters include:
  - `errors.unexpected_total`
  - `errors.event.*`
  - `rate_limit.exceeded_total`
  - `rate_limit.exceeded_scope.*`

### Logging
- Unexpected API failures are logged as structured JSON via server logger.
- Log payload includes:
  - event name
  - timestamp
  - route/method context
  - error name/message/stack when available

## 5. Operational Verification Commands
- Validate build: `npm run build`
- Validate tests: `npm run test`
- Validate portability guardrails: `npm run check:portability`
- Apply production migrations: `npm run db:migrate:deploy`
- Health probe: `curl -i http://localhost:3000/api/health`
- Metrics probe: `curl -i http://localhost:3000/api/metrics`

## 6. Cross-Host Smoke Checks (A4)
- Run workflow: `Hosting Smoke Targets` (`.github/workflows/hosting-smoke-targets.yml`).
- Provide two independently deployed URLs as workflow inputs:
  - `target_a_url`
  - `target_b_url`
- The workflow runs the same smoke probes against both targets:
  - `/api/health` returns `{ status: "ok" }`
  - `/api/metrics` returns `{ status: "ok" }`
  - `/groups` responds with valid authenticated-route behavior (200 or redirect)
