# Local Development

## Prerequisites
- Node.js (see .nvmrc target)
- Docker Desktop (for local PostgreSQL)

## Quick Start
1. Create local env file:
- Copy `.env.example` to `.env.local`.
- Set `AUTH_SECRET` before starting the app.
- Add Google OAuth credentials only if you want to test Google sign-in locally.

2. Start PostgreSQL:
- Run `docker compose up -d postgres`.

3. Generate Prisma client:
- Run `npm run db:generate`.

4. Apply migrations:
- Run `npm run db:migrate -- --name init`.

5. Seed demo data:
- Run `npm run db:seed`.

6. Start app:
- Run `npm run dev`.

7. Test auth locally:
- Register with email/password at `/auth/register`.
- Sign in at `/auth/signin`.

## Helpful Commands
- Open Prisma Studio: `npm run db:studio`
- Push schema without migration files: `npm run db:push`
- Deploy existing migrations: `npm run db:migrate:deploy`
