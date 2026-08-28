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

### Changed
- Planning docs expanded with roadmap, backlog, and ADR-0001.

### Fixed
- _Nothing yet._

### Removed
- _Nothing yet._
