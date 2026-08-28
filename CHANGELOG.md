# Changelog

## 0.4.0 (in progress)
- E4-S1 template management: admin template editor for 25 objectives and free-space selection.
- Template save API and service validation now enforce complete templates with exactly one free-space.
- Group detail page now links admins to template management.
- Added coverage for template-management service and template API route behavior.

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
