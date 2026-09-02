# Changelog

## 0.5.1 (in progress)
- User-testing polish: removed confusing dashboard board entry-point and redirected the legacy global board route to groups.
- Board UX polish: increased tile readability, removed tile numbering labels, and aligned read-only board visuals with playable tiles.
- Scoring and leaderboard update: switched to weighted score calculation and ranked by blackout, bingo count, score, then earliest achievement timestamp.
- Interaction reliability: fixed rapid-toggle coalescing and optimistic rollback behavior so local state stays responsive and server sync remains correct.
- User-testing follow-up: removed the manual refresh button from the Your board panel and simplified board-page helper copy.
- Leaderboard table now presents precedence metrics left-to-right as Name, Role, Bingos, Score, Blackout, Board.
- Added and updated coverage for board interactions, leaderboard ordering, and weighted scoring expectations.
- Added integration-flow service coverage for group create/join/play/leaderboard plus unauthorized leaderboard access and duplicate-join idempotency checks.

## 0.5.0
- E5-S1 derived stats: player board state now includes score, bingo count, and blackout.
- Board page now surfaces live derived stats from persisted mark state.
- Added service coverage for derived stats computation from board marks.
- E5-S2 leaderboard: added member leaderboard API and leaderboard page with score, bingo count, blackout, and board links.
- Leaderboard now shows last-updated metadata and a manual refresh action.
- E5-S3 board visibility: added a read-only member board route with group-membership access control.
- E6-S1 safety guard: template editor now shows a warning modal before post-start saves.
- Saving template edits after boards exist now requires explicit confirmation in both UI and API.
- E6-S2 mark preservation: existing player board layouts now stay stable when templates are edited mid-game.
- Replaced objectives now preserve each square's existing mark state (marked stays marked, unmarked stays unmarked).
- E6-S3 auditing: template edits after game start now record board edit events with actor, template transition, and impact metadata.
- Template save responses now include affected-board and recomputation metadata for downstream leaderboard freshness handling.
- E7-S1 polling: board and leaderboard views now auto-refresh with configurable polling intervals and exponential backoff on refresh errors.
- Added manual "Refresh now" controls and freshness indicators to board and leaderboard views.
- Mid-game replacement fairness: replaced objectives now preserve prior mark state and expose clear preserve-policy metadata in template save responses.
- E7-S2 transport abstraction: introduced a reusable sync transport interface with a polling implementation.
- Board and leaderboard live views now consume transport callbacks instead of embedding transport logic directly.
- Added ADR-0002 documenting the websocket migration path using the shared sync transport contract.

## 0.4.4
- Board template UX now uses a dedicated free-space objective input and 24 regular objectives.
- Free-space objective is now always placed in the center tile when generating player boards.
- Added admin control for whether free space is pre-marked by default on newly generated boards.
- Free-space tile can now be toggled during play when not pre-marked, matching normal tile behavior.
- Board grid now uses consistent tile sizing for cleaner visual layout.

## 0.4.3
- Fixed auth resilience when local DB is unavailable so credential sign-in no longer redirects to raw `/api/auth/error` pages.
- Register API now returns structured JSON for temporary backend failures instead of default HTML 500 responses.
- Register form now handles non-JSON error responses safely and shows a friendly fallback message.
- Added regression coverage for auth DB-unavailable and non-JSON failure paths.

## 0.4.2
- E4-S3 board play interactions: members can mark and unmark their own board tiles through a validated API.
- Board UI now supports optimistic tile toggles and preserves progress across reloads and sessions.
- Free-space tiles are treated as auto-marked and locked from manual toggling.
- Added coverage for board mark service, board mark route, and interactive board UI behavior.
- Added a Windows local startup script to bootstrap env files, Docker PostgreSQL, Prisma setup, seed data, and the dev server.
- Added a Windows local shutdown script to stop local services, with optional Docker cleanup and dev-server stop flags.

## 0.4.1
- E4-S2 player board generation: persisted one-time per-player boards from the active group template.
- Board generation keeps the designated free-space objective in place while deterministically shuffling the remaining objectives.
- Group detail page now links members to their player board and explains when template setup is still required.
- Added coverage for deterministic board generation and no-regeneration behavior.

## 0.4.0
- E4-S1 template management: admin template editor for 25 objectives and free-space selection.
- Template save API and service validation now enforce complete templates with exactly one free-space.
- Group detail page now links admins to template management.
- Added coverage for template-management service and template API route behavior.
- Fixed create-group form reset crash after successful submission.
- Create-group success state now shows an immediate full share link instead of token-only output.
- Template save confirmation no longer exposes internal version number in success copy.
- Added component regression tests for create-group and template form submission UX.

## 0.3.4
- Fixed join form runtime crash after successful invite-code submit.
- Preserved share-link callbackUrl across sign-in and register flows so users return to join after authentication.
- Clarified invalid share-link text to match current behavior (invalid only; expiry not implemented yet).

## 0.3.3
- E3-S3 role-aware dashboard UX: dashboard now lists user groups with role-based actions.
- Group detail page added for creator/admin versus player interaction paths.
- Versioning policy introduced and changelog converted to a concise version-based format.

## 0.3.2
- E3-S2 membership flows: join by invite code and share link.
- Duplicate membership prevention and join route coverage.

## 0.3.1
- Test baseline expanded for middleware, auth register route, groups routes, and group services.
- Testing policy and PR checklist requirement for behavior-change test coverage.

## 0.3.0
- E3-S1 group creation: creator auto-admin assignment plus invite code and share token generation.

## 0.2.0
- E2 complete: Auth.js baseline, credentials and optional Google OAuth, and protected route flows.

## 0.1.0
- E1 foundation: Next.js scaffold, Prisma baseline, architecture guardrails, CI, and initial docs.
