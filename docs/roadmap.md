# Bingo Royale Roadmap (Web v1 First)

## 1) Product Intent
Build a browser-first multiplayer bingo app where players join a group, play on their own shuffled copy of a shared objective board, and track group progress over a multi-day trip.

This roadmap is optimized for incremental delivery and future migration to a downloadable app.

## 2) Confirmed Scope (from requirements)
- Account system so player progress is tied to identity and persists across sessions/days.
- Dashboard listing all games/groups a user belongs to.
- Role-aware dashboard behavior:
  - Creator/admin can manage board and group settings.
  - Non-admin players can play and view leaderboard/boards.
- Group join model:
  - Invite code plus optional share link.
- Group board model:
  - Fixed 5x5 board for v1.
  - Creator provides 25 objective items and chooses which one is the free space.
- Player board behavior:
  - Each player gets a personal shuffled copy of the objectives.
  - Free space is not shuffled out of its designated position.
- Gameplay behavior:
  - Players mark/unmark objectives on their own board.
  - Score = number of marked squares.
  - # of bingos displayed.
  - Blackout completion displayed.
- Leaderboard behavior:
  - Show each player with:
    - Link to board view
    - Total score
    - Number of bingos
    - Blackout checkmark
  - All group members can view all member boards.
- Mid-game board edits by creator:
  - Allowed after game start.
  - Warning required before save.
  - Existing player board layout should not be reset or reshuffled.
  - When a tile objective is replaced:
    - Unrelated marked tiles stay marked.
    - Replaced tile becomes unmarked even if it was marked before.
- Real-time strategy:
  - Start with near-real-time polling.
  - Implement in a way that allows future websocket upgrade with minimal refactor.
- Auth strategy intent:
  - OAuth (Google) + optional email/password for v1.
  - Apple OAuth is a post-v1 nice-to-have.

## 3) Architecture Direction (Confirmed + Decision Gates)
Reference:
- ADR-0001 in docs/adr/0001-platform-and-auth.md

### Confirmed technical direction
- TypeScript full-stack web app using Next.js + PostgreSQL + Prisma.
- Auth.js for authentication/session management.
- Deployment posture: provider-agnostic for now.

### Decision gates (resolved)
- DG-01: Auth provider implementation details
  - Resolved: Auth.js with Google OAuth + optional credentials flow in v1.
- DG-02: Hosting/deployment target
  - Resolved: Provider-agnostic in v1 code and release process.

### Provider-agnostic guardrails (to avoid future headaches)
- Keep all game/domain logic in framework-agnostic service modules.
- Keep API handlers thin: input validation, auth check, call service, map response.
- Use Prisma against standard PostgreSQL features only; avoid provider-specific SQL/extensions in core paths.
- Centralize infrastructure bindings behind interfaces:
  - File/blob storage adapter.
  - Email/notification adapter.
  - Background job/queue adapter (if introduced).
  - Realtime transport adapter (polling now, websocket later).
- Keep configuration environment-driven and platform-neutral.
- Use stateless app processes and externalize session/state storage so app hosting can change without behavior changes.
- Add migration and rollback runbooks that do not assume a specific host.

## 4) Domain Model (v1)
### Core entities
- User
  - Identity, profile, auth links, created/updated timestamps.
- Group
  - Name, join code, optional share token/link, creator/admin owner, status.
- Membership
  - User <-> Group relationship, role (admin/player), joinedAt.
- BoardTemplate
  - Canonical 25 objectives for group, with one free-space objective flag.
  - Version number for change tracking.
- Objective
  - BoardTemplate item content, stable objective identifier, free-space flag.
- PlayerBoard
  - Per user per group board mapping with fixed square positions.
- PlayerMark
  - Mark state for each player board square.
- DerivedStats (computed or materialized)
  - Score, bingoCount, blackout.
- BoardEditEvent (audit)
  - Who changed what, when, warning accepted, before/after metadata.

### Data integrity rules
- One active board template per group.
- Exactly 25 objectives for v1 template.
- Exactly one free-space objective.
- One player board per user per group.
- Objective replacement maintains player board position map, does not reshuffle.
- Replaced objective mark state is forced unmarked for all players on affected square.

## 5) Gameplay Logic Rules
### Board generation
- On player joining group (or first play), generate shuffled positions from template objectives except free-space handling.
- Persist generated layout so it is stable across sessions/devices.

### Marking behavior
- Toggle mark/unmark on eligible squares.
- Mark operations idempotent and server-validated.

### Bingo/blackout computation
- Compute bingos from standard row/column/diagonal patterns on 5x5.
- Blackout true when all 25 squares are marked (including free space if model treats it as marked by default).
- Score = total marked squares.

### Board edit behavior (critical)
- Creator updates objective content.
- System warns about active-game impact before commit.
- On commit:
  - Preserve each player board positions.
  - Preserve marks on unaffected objectives.
  - Force unmark replaced objective square(s).
  - Recompute stats.

## 6) UX Plan (Web v1)
### Primary screens
- Auth screens
  - Sign in/up, OAuth buttons, optional credentials flow.
- User dashboard
  - Groups section with cards/list and role badge.
  - Create group action.
  - Join group action via invite code or share link.
- Group home
  - Quick status summary (members, start state, board version).
  - Entry points: My Board, Leaderboard, Group Settings (admin only).
- My board
  - 5x5 board interaction.
  - Immediate local feedback on mark toggles.
  - Visible sync state for polling refresh.
- Leaderboard
  - Player rows with board link, score, bingo count, blackout status.
  - Last updated indicator.
- Player board view
  - Read-only board state for selected player.
- Admin board editor
  - Objective list/table for 25 items.
  - Free-space assignment control.
  - Change warning modal and impact language before save.

### UX constraints to enforce
- Mobile-first responsive layout with desktop optimization.
- Accessible interaction states (focus, keyboard navigation, contrast).
- Clear distinction between editable admin controls and read-only player views.

## 7) Incremental Milestones
### M0: Foundation and scaffolding
- Initialize full-stack app structure.
- Configure DB schema baseline and migrations.
- Configure auth baseline.
- Establish API route conventions and typed service layer.

Exit criteria:
- User can sign in/out.
- Health check route and DB connectivity verified.

### M1: Groups and membership
- Create group (admin ownership).
- Join group via invite code/share link.
- Dashboard listing with role-aware views.

Exit criteria:
- User can create and join groups.
- Membership/roles persisted and reflected in UI.

### M2: Board templates and player boards
- Admin creates 25-item template and sets free space.
- Player board generation with persistent shuffle.
- My board rendering and mark toggling.

Exit criteria:
- Multiple players in same group have unique shuffled boards.
- Progress persists across sign-out/sign-in.

### M3: Leaderboard and board visibility
- Group leaderboard with score/bingo/blackout.
- Player board deep-link view from leaderboard.

Exit criteria:
- Group members can view each other boards.
- Stats are accurate under repeated mark changes.

### M4: Mid-game board editing safety
- Admin edits template after game start.
- Warning modal and audit capture.
- Mark-preservation logic for unaffected squares; replaced squares unmarked.

Exit criteria:
- No full-board reset on edit.
- Expected mark behavior verified for replacement cases.

### M5: Sync hardening and production readiness
- Polling optimization and data freshness UX.
- Abstraction layer for future websocket transport.
- Error handling, logging, test coverage, deployment hardening.

Exit criteria:
- Stable multi-user gameplay with recoverable failures.
- Production deployment checklist complete.

## 8) Deployment Note (Requested Feedback)
GitHub Pages is not a good fit for this v1 architecture because:
- It only hosts static front-end assets.
- This app requires server-side auth/session handling, database access, and protected APIs.

Better fit categories:
- Any Next.js-capable runtime + managed PostgreSQL.
- Typical low-friction option when you choose to lock provider: Vercel + managed Postgres.

Current decision:
- Keep deployment provider-agnostic for now while enforcing the guardrails in section 3.
- Select a concrete production host closer to release, after M3-M4 validation.

## 9) Quality Strategy
- Unit tests for bingo calculation, board generation, and board-edit mark-preservation rules.
- Integration tests for auth, group join, board play, leaderboard stats.
- End-to-end smoke flows for:
  - Sign in -> join group -> mark board -> view leaderboard -> view player board.
  - Admin edit after play and downstream impact checks.

## 10) Risks and Mitigations
- Risk: Mid-game edits create confusing outcomes.
  - Mitigation: Strong warning copy + preview of impact + audit trail.
- Risk: Polling staleness or race conditions under concurrent updates.
  - Mitigation: Server-side source of truth, version checks, conflict-safe writes.
- Risk: Auth complexity with multiple providers.
  - Mitigation: Phase provider setup, start with one OAuth provider plus credentials.

## 11) Future-Ready Extensions (Post v1)
- Variable board sizes beyond 5x5.
- Websocket live updates for instant leaderboard/board refresh.
- Apple OAuth support.
- Push notifications/reminders.
- Native shell/mobile packaging using shared web codebase.
