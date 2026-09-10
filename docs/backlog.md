# Bingo Royale Backlog (Epics -> Stories -> Tasks)

Status key:
- TODO
- IN-PROGRESS
- DONE
- BLOCKED
- PAUSED

Priority key:
- P0 = must-have for v1
- P1 = should-have for v1
- P2 = post-v1 or stretch
- K0 = must land on develop before cutting the Kimberly release branch
- K1 = can continue on develop after the Kimberly release branch exists

## Epic E1: Project Foundation (P0)
### Story E1-S1: App skeleton and standards
- [x] T1 Define repo structure, linting, formatting, env conventions (DONE)
- [x] T2 Set up TypeScript app framework baseline (DONE)
- [x] T3 Add CI checks for lint + tests (DONE)
- [x] T58 Define service-layer boundaries to isolate domain logic from framework/infrastructure details (DONE)
- [x] T59 Define adapter interfaces for storage, notifications, and realtime transport (DONE)
- [x] T60 Keep ADR-0001 updated as hosting/auth constraints evolve (DONE)

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
- [x] T29 Implement weighted score calculation (marks + bingo bonuses + blackout bonus) (DONE)
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
- [x] T51 Integration tests for auth/group/join/play/leaderboard (DONE)
- [x] T61 Require test additions for all behavior-changing feature work (DONE)
- [x] T62 Establish semantic versioning workflow (epic->minor, story/fix->patch) and version-based changelog updates (DONE)

### Story E8-S2: Security and resilience
- [x] T52 Add authorization checks per group/resource (DONE)
- [x] T53 Add rate limits for sensitive endpoints (join/auth/mark) (DONE)
- [x] T54 Add robust error handling and structured logs (DONE)

### Story E8-S3: Deployment readiness
- [x] T55 Build deployment checklist and environment variable matrix (DONE)
- [x] T56 Configure production DB migrations strategy (DONE)
- [x] T57 Add observability basics (health checks, key metrics) (DONE)

## Decision Gates (Must be closed before implementation starts)
- [x] DG-01 Confirm auth implementation provider/library details (DONE: Auth.js with Google OAuth + optional credentials for v1)
- [x] DG-02 Confirm production hosting target (DONE: provider-agnostic for now)

## Post-v1 Nice-to-Haves
- [ ] N1 Add Apple OAuth provider support (TODO)

## Provider-Agnostic Readiness Tasks (P0)
- [x] A1 Keep runtime/platform-specific code isolated to infrastructure adapters (DONE)
- [x] A2 Restrict core DB usage to portable PostgreSQL + Prisma patterns (DONE)
- [x] A3 Document deployment-agnostic env var contract and secrets model (DONE)
- [x] A4 Add smoke tests runnable across at least two hosting targets before provider lock-in (DONE)

## Epic E9: Deployment Execution and Environment Operations (P0)
### Story E9-S1: Free dev deployment environment (test + early production fallback)
- [x] T63 Create deployment repo baseline structure and ownership docs (DONE)
- [ ] T64 Configure dev app hosting on free tier provider with provider-specific config externalized from app repo (PAUSED: baseline is working; resume only if deploy regression appears)
- [ ] T65 Configure dev managed Postgres on free tier and connect app runtime env contract (PAUSED: runtime DB is connected for weekend launch)
- [ ] T66 Validate migrations, auth callbacks, health endpoint, and smoke probes on deployed dev URL (PAUSED: complete after weekend launch window)

### Story E9-S2: Release process and promotion controls
- [ ] T67 Define commit-to-deploy promotion flow (dev deploy first, optional prod promotion later) (PAUSED)
- [ ] T68 Add deploy-repo checklists for rollout, rollback, and incident handling (PAUSED)
- [ ] T69 Record first release validation run using dev deployment as temporary production environment (PAUSED)

### Story E9-S3: Cheap paid production environment (when needed)
- [ ] T70 Select production provider trigger criteria (user/traffic/reliability thresholds) (PAUSED)
- [ ] T71 Stand up paid production environment using same env contract and smoke gates (PAUSED)
- [ ] T72 Cut over from dev-only runtime to separate prod environment with documented rollback (PAUSED)

## Kimberly Branch Cut Plan
- Branch cut complete: `release/kimberly` was created from validated `develop` for permanent event-only branding/content work.
- K0 before branch cut: T75, T76, T78, T79, T80, T81, T82, T83, T84.
- K1 after branch cut: T77, T85, T86, T87, T88, T89, T90, T100, T101, T102, plus paused E9 deployment-process follow-ups.

## Epic E10: V1 UI/UX Polish and Delight (P0)
- Mobile-first guardrail for all E10 stories: no story is considered done unless primary flows are validated on phone viewport first and remain fully usable on desktop.

### Story E10-S1: Visual foundation and design tokens
- [x] T73 Establish a visual direction for V1 (palette, typography pair, spacing scale, radii, shadows) with CSS variables and reusable token names (DONE)
- [x] T74 Add app-wide shell styling baseline (page background treatment, card surfaces, elevation, border system) without changing core behaviors (DONE)
- [x] T75 Define reusable component variants for button, input, select, badge, alert, modal, table, tabs, and empty state (DONE, K0)

### Story E10-S2: Information architecture and navigation clarity
- [x] T76 Improve header/navigation hierarchy (primary actions, user menu, signed-in context, group context) for quicker task completion (DONE, K0)
- [x] T77 Add clear page headers and subheaders on dashboard/groups/leaderboard/template pages (DONE, K1)
- [x] T78 Standardize section spacing and responsive breakpoints so key controls remain reachable on mobile during gameplay (DONE, K0)

### Story E10-S3: Board gameplay experience polish
- [x] T79 Redesign interactive player board square states (idle/hover/pressed/marked/disabled) with strong visual contrast and playful feedback (DONE, K0)
- [x] T80 Add quick feedback patterns for mark/unmark sync states (pending/success/error) with accessible non-blocking messaging (DONE, K0)
- [x] T81 Improve readability and scannability of objectives on 5x5 grid across phone and desktop form factors (DONE, K0)

### Story E10-S4: Leaderboard and group management polish
- [x] T83 Improve group list and group detail cards with clearer action affordances (join, open board, open template, invite context) (DONE, K0)
- [x] T82 Improve leaderboard visual hierarchy (rank emphasis, score emphasis, status chips, last-updated signal) while preserving current data semantics (DONE, K0)
- [x] T84 Add polished empty/loading/error states for dashboard, groups, board, and leaderboard views (DONE, K0)

### Story E10-S5: Accessibility, motion, and responsive quality bar
- [ ] T85 Add keyboard-visible focus styles and verify full keyboard operability for core game flows (TODO, K1)
- [ ] T86 Ensure color contrast and text sizing pass baseline accessibility checks for core screens (TODO, K1)
- [ ] T87 Add lightweight purposeful motion (page transitions/staggered reveals/interaction feedback) with reduced-motion support (TODO, K1)

### Story E10-S6: UX copy and conversion polish
- [ ] T88 Refine auth/join/create-group copy for confidence and fun tone without changing backend behavior (TODO, K1)
- [ ] T89 Add contextual helper text and success confirmations for high-friction actions (join code, template save, registration) (TODO, K1)
- [ ] T90 Add an optional launch banner pattern that can be toggled per release/theme (TODO, K1)

## Epic E11: Theme System and One-Off Event Release Path (P0)
### Story E11-S1: Theme architecture and switch mechanism
- [x] T91 Introduce a theme contract (tokens + assets + optional overrides) that supports default and event-specific themes without branching app logic (DONE)
- [x] T92 Implement runtime theme selection via env/config flag (for example: DEFAULT_THEME_KEY) with safe fallback to default theme (DONE)
- [x] T93 Isolate theme-specific assets (banners/backgrounds/iconography) under a predictable directory structure and loading convention (DONE)

### Story E11-S2: Event customization capabilities (Kimberly branch-ready)
- [x] T94 Add extensibility points for themed header/footer/banner/background image slots per route group (DONE)
- [x] T95 Add themed typography hooks (font family tokens) so event branch can swap fonts without touching component logic (DONE)
- [x] T96 Add themed CTA/button style variants and decorative accents (stickers/badges/avatar frames) for party-specific flair (DONE)

### Story E11-S3: Safety rails for one-off branch strategy
- [x] T97 Document branch strategy for one-off event release (fork from develop, no back-merge policy, post-event archival checklist) (DONE)
- [x] T98 Keep core UX improvements merge-safe by landing structural/token work on develop before event-only content is added in branch (DONE)
- [x] T99 Add event-content checklist (image rights, content sizing, mobile crop behavior, fallback assets, cache busting) (DONE)

### Story E11-S4: Theme QA and release readiness
- [ ] T100 Validate default theme and event theme parity for core flows (auth, group join, board play, leaderboard) (TODO, K1)
- [ ] T101 Validate event theme performance budget (image size, LCP impact, layout shift) on mobile network profiles (TODO, K1)
- [x] T102 Add quick rollback path to default theme via config toggle and redeploy procedure (DONE, K1)


## Suggested execution order
1. E1 -> E2 -> E3
2. E4 -> E5
3. E6
4. E7 + E8
5. E10 -> E11
6. E9 (resume after weekend launch window)
