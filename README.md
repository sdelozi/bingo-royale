# Bingo Royale

Browser-first multiplayer bingo for group trips.

## Current Status
Foundation and auth baseline work are in progress.

## Key Docs
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Backlog: [docs/backlog.md](docs/backlog.md)
- ADR-0001 (platform + auth): [docs/adr/0001-platform-and-auth.md](docs/adr/0001-platform-and-auth.md)
- Architecture notes: [docs/architecture.md](docs/architecture.md)
- Local setup: [docs/development.md](docs/development.md)

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

## Next Step
Build group creation, membership, and join flows.
