# ADR-0002: Sync Transport Abstraction and WebSocket Migration Path

Status: Accepted
Date: 2026-08-28

## Context

Bingo Royale currently delivers board and leaderboard freshness through polling.
Realtime requirements may increase as concurrent gameplay scales, making websocket push desirable.

We need a migration path that avoids rewriting UI feature components when transport changes.

## Decision

Introduce a client sync transport interface with a polling implementation:

- `SyncTransport<TPayload>` defines `start`, `refreshNow`, and `getNextDelayMs`.
- `createPollingSyncTransport` implements this interface using interval scheduling and exponential backoff.
- Group-specific data fetch logic is isolated in sync drivers (`fetchGroupBoardSnapshot`, `fetchGroupLeaderboardSnapshot`).
- UI components consume transport interfaces instead of embedding polling mechanics.

## Consequences

Positive:

- UI consumers are transport-agnostic and only react to data/status callbacks.
- Polling logic is centralized, reducing duplication and drift.
- Websocket transport can be introduced by adding a new `SyncTransport` implementation.

Trade-offs:

- Slightly higher abstraction overhead and callback wiring.
- Requires transport-focused tests in addition to component tests.

## Migration Plan to WebSockets

1. Keep existing `SyncTransport` contract stable.
2. Add `createWebSocketSyncTransport` implementation that emits the same callbacks.
3. Reuse existing group sync drivers as fallback for reconnect and initial snapshot bootstrap.
4. Add server-side event topics for group board updates and leaderboard refresh events.
5. Roll out behind a feature flag:
   - `NEXT_PUBLIC_SYNC_TRANSPORT=polling|websocket`.
6. Keep polling implementation as fallback when websocket connection is unavailable.

## Notes

- Polling remains default for v1 reliability.
- This ADR intentionally defers backend websocket infrastructure details to a future implementation story.
