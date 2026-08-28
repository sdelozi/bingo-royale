# Testing Policy

## Goal
Add sufficient tests with each feature so we catch bugs early, structure implementation thinking, and guard against regressions.

## Minimum expectation for each feature branch
- Add or update tests for any behavior change.
- Cover happy path plus at least one failure path.
- Keep route/service tests near the changed code.
- Run lint and test before opening a PR.

## Suggested test mix
- Unit tests for pure logic and service rules.
- Route-level tests for auth and validation handling.
- Integration or end-to-end tests for cross-feature workflows as features mature.
