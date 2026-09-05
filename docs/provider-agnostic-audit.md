# Provider-Agnostic Readiness Audit

This document tracks implementation evidence for backlog items A1 and A2.

## A1: Runtime/platform-specific isolation

### Adapter inventory
- Realtime contract: `src/server/contracts/realtime.ts`
- Notification contract: `src/server/contracts/notifications.ts`
- File storage contract: `src/server/contracts/storage.ts`

### Isolation guardrails
- Route handlers remain thin and call service modules.
- Infrastructure concerns (logging, rate limiting, health probes) are isolated under `src/server/observability` and `src/server/rate-limit`.
- Platform-specific configuration is centralized in `src/server/config/env.ts`.

### Automated enforcement
- `npm run check:portability` enforces:
  - approved `process.env` touchpoints only
  - approved raw SQL touchpoints only

## A2: Portable PostgreSQL + Prisma patterns

### Approved data-access posture
- Core gameplay and membership flows use Prisma model APIs.
- Raw SQL is restricted to health probing (`SELECT 1`) only.

### Explicit limitations
- No provider-specific SQL extensions in service modules.
- No host-provider SDK types in domain/service code paths.

### Verification path
- CI executes portability guardrail checks on pushes and PRs.
- Any new raw SQL entrypoint requires explicit audit update.
