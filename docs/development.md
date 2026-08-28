# Local Development

## Prerequisites
- Node.js (see .nvmrc target)
- Docker Desktop (for local PostgreSQL)

## Quick Start
### One-command Windows startup
- Run `npm run start:local`.
- The script will:
	- create `.env` and `.env.local` from `.env.example` if they do not exist
	- generate a local `AUTH_SECRET` if the placeholder value is still present
	- start local PostgreSQL with Docker
	- generate Prisma client
	- apply committed migrations (or fall back to `db:push` if no migrations exist)
	- seed demo data
	- start the Next.js dev server
- Useful flags when running the script directly:
	- `./scripts/start-local.ps1 -SkipDevServer`
	- `./scripts/start-local.ps1 -SkipSeed`
	- `./scripts/start-local.ps1 -ForceInstall`

### One-command Windows shutdown
- Run `npm run stop:local`.
- Default behavior:
	- stops the local `postgres` Docker service
	- keeps data volumes and other containers intact
- Useful flags when running shutdown directly:
	- `./scripts/stop-local.ps1 -StopDevServer`
	- `./scripts/stop-local.ps1 -Down`
	- `./scripts/stop-local.ps1 -Down -RemoveVolumes`
	- `./scripts/stop-local.ps1 -Down -RemoveOrphans`

1. Create local env file:
- Copy `.env.example` to `.env.local`.
- Set `AUTH_SECRET` before starting the app.
- Set `NEXTAUTH_URL=http://localhost:3000` for local auth callbacks.
- Add Google OAuth credentials only if you want to test Google sign-in locally.
- Prisma CLI reads `.env` by default (not `.env.local`). Ensure `DATABASE_URL` is also available in `.env` or exported in your shell before running Prisma commands.

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
- For `/join/{shareToken}` flows while logged out, auth now preserves callback and returns to the join link after sign-in/register.

## Helpful Commands
- Open Prisma Studio: `npm run db:studio`
- Push schema without migration files: `npm run db:push`
- Deploy existing migrations: `npm run db:migrate:deploy`
- Full local shutdown and cleanup: `npm run stop:local`
