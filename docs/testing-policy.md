# Testing Policy

## Goal
Add sufficient tests with each feature so we catch bugs early, structure implementation thinking, and guard against regressions.

## Minimum expectation for each feature branch
- Add or update tests for any behavior change.
- Cover happy path plus at least one failure path.
- Keep route/service tests near the changed code.
- Run lint and test before opening a PR.

## Pull request enforcement
- PRs that modify behavior-changing source files in `src/` (or `middleware.ts`) must check the PR checklist item: `tests added or updated for behavior changes`.
- The `PR Test Requirement` GitHub Action enforces this check on pull requests to `develop`.

## Suggested test mix
- Unit tests for pure logic and service rules.
- Route-level tests for auth and validation handling.
- Integration or end-to-end tests for cross-feature workflows as features mature.
