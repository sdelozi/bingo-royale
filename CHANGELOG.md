# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project adheres to Semantic Versioning where applicable.

## [Unreleased]

### Added
- Initial Next.js + TypeScript web scaffold (App Router) for M0 foundation.
- Baseline lint/test toolchain with ESLint and Vitest.
- CI workflow for lint + test on develop and feature branches.
- Core bingo utility module with initial unit tests for score, bingo count, and blackout logic.
- Prisma ORM baseline with initial domain schema models for users, groups, memberships, board templates, player boards, marks, and board edit events.
- Local PostgreSQL bootstrap via Docker Compose and a development guide.
- Prisma seed script and reusable database workflow scripts.
- Shared Prisma client singleton for server-side usage.
- Architecture notes defining repository structure, service boundaries, and environment conventions.
- Initial provider-agnostic adapter contracts for notifications, realtime, and file storage.
- Shared server-side service context and centralized environment contract.
- Auth.js baseline with Prisma-backed sessions, credentials auth, and optional Google OAuth.
- Registration API plus sign-in, sign-out, and dashboard placeholder flows.
- NextAuth-compatible Prisma schema extensions for users, accounts, sessions, and verification tokens.
- Route middleware protection for dashboard, group, and board paths with callback-aware sign-in redirects.
- Auth-aware redirects that send signed-in users away from sign-in/register pages to dashboard.
- Initial protected placeholder pages for groups and board routes.
- Group creation API and groups page UI with creator auto-assigned as admin.
- Unique invite-code and share-token generation for new groups.
- Group list view showing role, invite code, and share link token path.
- Test baseline for middleware auth redirects, auth register API route, group service logic, and groups API route.
- Testing policy document and PR checklist item requiring tests for behavior-changing work.
- Join-group flow via invite code and share-link token with duplicate-membership protection.
- Join API route and groups-page join form, plus share-link landing page.
- Additional tests for middleware join protection, join service logic, and join API route behavior.

### Changed
- Planning docs expanded with roadmap, backlog, and ADR-0001.
- Development docs and environment template updated for local auth setup.

### Fixed
- _Nothing yet._

### Removed
- _Nothing yet._
