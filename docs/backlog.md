# Bingo Royale Backlog (Epics -> Stories -> Tasks)

Status key:
- TODO
- IN-PROGRESS
- DONE
- BLOCKED

Priority key:
- P0 = must-have for v1
- P1 = should-have for v1
- P2 = post-v1 or stretch

## Epic E1: Project Foundation (P0)
### Story E1-S1: App skeleton and standards
- [x] T1 Define repo structure, linting, formatting, env conventions (DONE)
- [x] T2 Set up TypeScript app framework baseline (DONE)
- [x] T3 Add CI checks for lint + tests (DONE)
- [x] T58 Define service-layer boundaries to isolate domain logic from framework/infrastructure details (DONE)
- [x] T59 Define adapter interfaces for storage, notifications, and realtime transport (DONE)
- [ ] T60 Keep ADR-0001 updated as hosting/auth constraints evolve (TODO)

### Story E1-S2: Database and ORM baseline
- [x] T4 Define initial schema for users, groups, memberships, templates, player boards, marks (DONE)
- [x] T5 Add migration flow and seed strategy (DONE)
- [x] T6 Add local/dev DB bootstrap scripts (DONE)

## Epic E2: Authentication and Accounts (P0)
### Story E2-S1: Account lifecycle
- [x] T7 Implement sign-up/sign-in/sign-out flow (DONE)
- [x] T8 Implement Google OAuth provider (DONE)
- [x] T9 Implement optional credentials login flow (DONE)
- [x] T10 Persist user session and profile retrieval (DONE)

### Story E2-S2: Route protection
- [x] T11 Protect authenticated routes (dashboard/group/board) (DONE)
- [x] T12 Add auth-aware redirects and error states (DONE)

## Epic E3: Groups, Roles, and Joining (P0)
### Story E3-S1: Group creation and ownership
- [x] T13 Create group API/UI with creator as admin (DONE)
- [x] T14 Generate unique invite code and optional share link token (DONE)

### Story E3-S2: Membership flows
- [x] T15 Join group by invite code (DONE)
- [x] T16 Join group by share link (DONE)
- [x] T17 Prevent duplicate membership entries (DONE)

### Story E3-S3: Dashboard and role-aware UX
- [x] T18 Implement user dashboard showing all groups (DONE)
- [x] T19 Show role badges and role-specific actions (DONE)

## Epic E4: Board Templates and Player Boards (P0)
### Story E4-S1: Template management
- [ ] T20 Admin creates/edits 25 objectives (TODO)
- [ ] T21 Enforce exactly one free-space objective (TODO)
- [ ] T22 Validate template completeness before activation (TODO)

### Story E4-S2: Player board generation
- [ ] T23 Build deterministic/persisted shuffle for each player board (TODO)
- [ ] T24 Preserve free-space placement rule (TODO)
- [ ] T25 Prevent re-generation after initial board creation (TODO)

### Story E4-S3: Board play interactions
- [ ] T26 Implement mark/unmark API with server validation (TODO)
- [ ] T27 Build interactive 5x5 board UI with optimistic updates (TODO)
- [ ] T28 Persist and reload board state across sessions (TODO)

## Epic E5: Leaderboard and Board Visibility (P0)
### Story E5-S1: Derived stats
- [ ] T29 Implement score calculation = marked square count (TODO)
- [ ] T30 Implement bingo counting logic (rows/cols/diagonals) (TODO)
- [ ] T31 Implement blackout detection (TODO)

### Story E5-S2: Group leaderboard
- [ ] T32 Build leaderboard API for group members (TODO)
- [ ] T33 Render table with board link, score, bingo count, blackout status (TODO)
- [ ] T34 Add last-updated and refresh state indicators (TODO)

### Story E5-S3: Player board viewing
- [ ] T35 Implement read-only player board route/view (TODO)
- [ ] T36 Add permissions so only group members can view (TODO)

## Epic E6: Mid-Game Template Editing Safety (P0)
### Story E6-S1: Warning and confirmation
- [ ] T37 Show warning modal before saving template edits post-start (TODO)
- [ ] T38 Require explicit confirmation on impact warning (TODO)

### Story E6-S2: Mark-preservation logic
- [ ] T39 Keep all unaffected marks intact (TODO)
- [ ] T40 Force unmark replaced objective squares (TODO)
- [ ] T41 Keep board layout stable; no reshuffle/no reset (TODO)

### Story E6-S3: Auditing and recomputation
- [ ] T42 Record board edit event with actor and timestamp (TODO)
- [ ] T43 Recompute affected player stats after template edit (TODO)

## Epic E7: Sync Strategy and Future Realtime Upgrade Path (P1)
### Story E7-S1: Polling v1
- [ ] T44 Implement polling for leaderboard/board freshness (TODO)
- [ ] T45 Add configurable polling intervals and backoff (TODO)

### Story E7-S2: Transport abstraction for future websockets
- [ ] T46 Introduce sync service interface abstracting transport (TODO)
- [ ] T47 Keep UI consumers transport-agnostic (TODO)
- [ ] T48 Add technical spike doc for websocket migration path (TODO)

## Epic E8: Quality, Security, and Operations (P1)
### Story E8-S1: Test coverage
- [x] T49 Unit tests for shuffle, bingo, blackout, score (DONE)
- [ ] T50 Unit tests for mid-game edit mark-preservation rules (TODO)
- [ ] T51 Integration tests for auth/group/join/play/leaderboard (TODO)
- [ ] T61 Require test additions for all behavior-changing feature work (TODO)
- [x] T62 Establish semantic versioning workflow (epic->minor, story/fix->patch) and version-based changelog updates (DONE)

### Story E8-S2: Security and resilience
- [ ] T52 Add authorization checks per group/resource (TODO)
- [ ] T53 Add rate limits for sensitive endpoints (join/auth/mark) (TODO)
- [ ] T54 Add robust error handling and structured logs (TODO)

### Story E8-S3: Deployment readiness
- [ ] T55 Build deployment checklist and environment variable matrix (TODO)
- [ ] T56 Configure production DB migrations strategy (TODO)
- [ ] T57 Add observability basics (health checks, key metrics) (TODO)

## Decision Gates (Must be closed before implementation starts)
- [x] DG-01 Confirm auth implementation provider/library details (DONE: Auth.js with Google OAuth + optional credentials for v1)
- [x] DG-02 Confirm production hosting target (DONE: provider-agnostic for now)

## Post-v1 Nice-to-Haves
- [ ] N1 Add Apple OAuth provider support (TODO)

## Provider-Agnostic Readiness Tasks (P0)
- [ ] A1 Keep runtime/platform-specific code isolated to infrastructure adapters (TODO)
- [ ] A2 Restrict core DB usage to portable PostgreSQL + Prisma patterns (TODO)
- [ ] A3 Document deployment-agnostic env var contract and secrets model (TODO)
- [ ] A4 Add smoke tests runnable across at least two hosting targets before provider lock-in (TODO)

## Suggested execution order
1. E1 -> E2 -> E3
2. E4 -> E5
3. E6
4. E7 + E8
