# Bingo Royale

Browser-first multiplayer bingo for group trips.

## Current Status
Epic 8 Story 3 (deployment readiness) is in progress.

## Key Docs
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Backlog: [docs/backlog.md](docs/backlog.md)
- ADR-0001 (platform + auth): [docs/adr/0001-platform-and-auth.md](docs/adr/0001-platform-and-auth.md)
- Architecture notes: [docs/architecture.md](docs/architecture.md)
- Local setup: [docs/development.md](docs/development.md)
- Deployment readiness runbook: [docs/deployment-readiness.md](docs/deployment-readiness.md)
- Environment and secrets contract: [docs/env-contract.md](docs/env-contract.md)
- Provider-agnostic readiness audit: [docs/provider-agnostic-audit.md](docs/provider-agnostic-audit.md)
- Testing policy: [docs/testing-policy.md](docs/testing-policy.md)
- Versioning: [docs/versioning.md](docs/versioning.md)

## Current Version
- 0.5.1 (in progress)

## v1 Snapshot
- Web app first (5x5 boards)
- Auth.js + Google OAuth + optional credentials
- Provider-agnostic deployment posture
- Invite-code/share-link group join
- Leaderboard with score, bingos, blackout

## Available Now
- Email/password registration and sign-in
- Auth.js session-backed sign-in/sign-out flow
- Optional Google OAuth when provider credentials are configured
- Group creation and join by invite code
- Share-link group join route for authenticated users
- Share-link callback is preserved through sign-in/register flows
- Admin template editor with 25 objectives and one free-space selection

## Next Step
Complete Epic 8 Story 3 deployment readiness and merge to develop.
