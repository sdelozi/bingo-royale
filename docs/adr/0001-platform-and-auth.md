# ADR-0001: Platform Posture and Authentication Strategy

- Status: Accepted
- Date: 2026-08-27
- Owners: Bingo Royale team

## Context
Bingo Royale v1 is a browser-first multiplayer app with persistent accounts, group gameplay, and shared progress features. The team wants fast iteration now without introducing avoidable lock-in that makes future feature work or hosting changes harder.

Two architecture choices needed to be finalized before implementation:
1. Deployment and hosting posture.
2. Authentication strategy for v1.

## Decision
1. Deployment posture: provider-agnostic for now.
2. Authentication strategy for v1: Auth.js with Google OAuth plus optional email/password credentials.
3. Apple OAuth: explicitly out of v1 scope; tracked as post-v1 nice-to-have.

## Rationale
### Why provider-agnostic now
- Keeps initial execution fast while preserving ability to choose hosting based on validated product usage.
- Avoids early coupling to provider-specific platform primitives.
- Reduces migration risk when adding future features (realtime, mobile shell support, background processing).

### Why Auth.js now
- Strong fit for Next.js architecture and session handling needs.
- Enables Google OAuth quickly while allowing credentials flow in v1.
- Keeps OAuth provider expansion (including Apple) straightforward post-v1.

## Guardrails (Non-Negotiable)
1. Core game/domain logic must live in framework-agnostic service modules.
2. API handlers must remain thin:
- Validate input.
- Enforce authorization.
- Call service layer.
- Map response.
3. Data layer portability:
- Use Prisma with standard PostgreSQL patterns.
- Avoid provider-specific SQL/extensions in core gameplay paths.
4. Infrastructure isolation through adapters/interfaces:
- Realtime transport (polling now, websocket later).
- Notification/email.
- Optional file/blob storage.
- Optional background jobs/queue.
5. Environment and operations portability:
- Keep config environment-driven and platform-neutral.
- Maintain migration/rollback runbooks independent of host provider.

## Consequences
### Positive
- Lower long-term switching cost between hosting providers.
- Cleaner architecture for incremental feature additions.
- Faster path to post-v1 websocket and additional OAuth providers.

### Tradeoffs
- Slightly higher upfront design discipline (service boundaries, adapter contracts).
- Some infrastructure features may ship later than they would with provider-specific shortcuts.

## Out of Scope
- Final provider selection for production hosting.
- Apple OAuth implementation details.

## Implementation Notes
- Add adapter contracts early in foundation milestone.
- Keep all gameplay workflows covered by tests at service-layer boundaries.
- Add cross-host smoke checks before locking production provider.

## 2026-09-04 Follow-up Notes
- Provider-agnostic guardrails are now enforced in CI via `npm run check:portability`.
- Deployment checklist, environment contract, and production migration strategy are documented in `docs/deployment-readiness.md` and `docs/env-contract.md`.
- Cross-host smoke checks are operationalized via the `Hosting Smoke Targets` workflow with two target URLs.

## Review Trigger
Revisit this ADR if any of the following change:
1. Team commits to a single hosting provider with required proprietary features.
2. Authentication requirements change materially (for example enterprise SSO or strict provider mandates).
3. Realtime requirements move from polling to mandatory low-latency push in v1.
4. Team introduces required provider-specific infrastructure not isolated behind contracts.
