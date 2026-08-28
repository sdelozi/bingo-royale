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
- [x] T20 Admin creates/edits 25 objectives (DONE)
- [x] T21 Enforce exactly one free-space objective (DONE)
- [x] T22 Validate template completeness before activation (DONE)

### Story E4-S2: Player board generation
- [x] T23 Build deterministic/persisted shuffle for each player board (DONE)
- [x] T24 Preserve free-space placement rule (DONE)
- [x] T25 Prevent re-generation after initial board creation (DONE)

### Story E4-S3: Board play interactions
- [x] T26 Implement mark/unmark API with server validation (DONE)
- [x] T27 Build interactive 5x5 board UI with optimistic updates (DONE)
- [x] T28 Persist and reload board state across sessions (DONE)

## Epic E5: Leaderboard and Board Visibility (P0)
### Story E5-S1: Derived stats
- [x] T29 Implement score calculation = marked square count (DONE)
- [x] T30 Implement bingo counting logic (rows/cols/diagonals) (DONE)
- [x] T31 Implement blackout detection (DONE)

### Story E5-S2: Group leaderboard
- [x] T32 Build leaderboard API for group members (DONE)
- [x] T33 Render table with board link, score, bingo count, blackout status (DONE)
- [x] T34 Add last-updated and refresh state indicators (DONE)

### Story E5-S3: Player board viewing
- [x] T35 Implement read-only player board route/view (DONE)
- [x] T36 Add permissions so only group members can view (DONE)

## Epic E6: Mid-Game Template Editing Safety (P0)
### Story E6-S1: Warning and confirmation
- [x] T37 Show warning modal before saving template edits post-start (DONE)
- [x] T38 Require explicit confirmation on impact warning (DONE)

### Story E6-S2: Mark-preservation logic
- [x] T39 Keep all unaffected marks intact (DONE)
- [x] T40 Preserve mark state on replaced objective squares (DONE)
- [x] T41 Keep board layout stable; no reshuffle/no reset (DONE)

### Story E6-S3: Auditing and recomputation
- [x] T42 Record board edit event with actor and timestamp (DONE)
- [x] T43 Recompute affected player stats after template edit (DONE)

## Epic E7: Sync Strategy and Future Realtime Upgrade Path (P1)
### Story E7-S1: Polling v1
- [x] T44 Implement polling for leaderboard/board freshness (DONE)
- [x] T45 Add configurable polling intervals and backoff (DONE)

### Story E7-S2: Transport abstraction for future websockets
- [x] T46 Introduce sync service interface abstracting transport (DONE)
- [x] T47 Keep UI consumers transport-agnostic (DONE)
- [x] T48 Add technical spike doc for websocket migration path (DONE)

## Epic E8: Quality, Security, and Operations (P1)
### Story E8-S1: Test coverage
- [x] T49 Unit tests for shuffle, bingo, blackout, score (DONE)
- [x] T50 Unit tests for mid-game edit mark-preservation rules (DONE)
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
