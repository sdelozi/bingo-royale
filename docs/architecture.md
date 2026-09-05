# Architecture Notes

## Repository Structure
- `src/app`: Next.js routes, layouts, and UI entry points.
- `src/lib`: framework-agnostic shared utilities.
- `src/server/db`: Prisma client and database-specific helpers.
- `src/server/contracts`: infrastructure interfaces for provider-dependent capabilities.
- `src/server/services`: framework-agnostic application/service layer.
- `prisma`: schema, migrations, and seed scripts.
- `docs`: roadmap, backlog, ADRs, architecture notes, and development docs.

## Responsibility Boundaries
- Route handlers and server actions should validate input, enforce authorization, call a service, and map the response.
- Service modules own application rules and orchestration.
- Database access should be encapsulated behind the service layer.
- Provider-specific behavior belongs behind contracts in `src/server/contracts`.

## Environment Conventions
- Commit `.env.example`; do not commit real `.env*` secrets.
- Prefer portable environment names over provider-specific names.
- Access environment variables through `src/server/config/env.ts` rather than `process.env` scattered across the codebase.
- Follow the deployment-agnostic env/secrets contract in `docs/env-contract.md`.

## Adapter Conventions
- Start with no-op or local implementations when a provider is not yet selected.
- Keep adapter interfaces narrow and task-oriented.
- Avoid leaking provider SDK types into service modules.

## Provider-Agnostic Governance
- Provider and runtime portability guardrails are tracked in `docs/provider-agnostic-audit.md`.
- CI enforces portability constraints through `npm run check:portability`.
