# Environment and Secrets Contract

This contract defines deployment-agnostic configuration requirements for Bingo Royale.

## Principles
- Keep environment variable names provider-neutral.
- Keep secret values out of source control.
- Resolve server-side env access through `src/server/config/env.ts`.
- Restrict direct `process.env` access to approved configuration modules.

## Environment Split
- The same contract applies to both the free dev deployment and the cheap production deployment.
- Environment-specific values must be injected externally; the app code must not depend on provider-specific config files.

## Variable Contract

| Variable | Required | Secret | Example | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | Yes | No | `production` | Standard runtime mode |
| `NEXT_PUBLIC_APP_URL` | Yes | No | `https://app.example.com` | Public app URL |
| `NEXTAUTH_URL` | Yes (Production) | No | `https://app.example.com` | Auth callback base URL; see Vercel deployment-URL note below |
| `DATABASE_URL` | Yes | Yes | `postgresql://...` | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Yes | random long string | Auth.js signing secret |
| `GOOGLE_CLIENT_ID` | No | Yes | provider value | Optional Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Yes | provider value | Optional Google OAuth |
| `GOOGLE_ALLOW_DANGEROUS_EMAIL_ACCOUNT_LINKING` | No | No | `false` | Optional: allow Google login to link with existing same-email credentials accounts |
| `CREDENTIALS_PASSWORD_PEPPER` | No | Yes | random long string | Optional credentials hardening |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | No | No | `15000` | UI polling base |
| `NEXT_PUBLIC_POLL_MAX_INTERVAL_MS` | No | No | `120000` | UI polling max |
| `NEXT_PUBLIC_ENABLE_FOUR_CORNERS_SCORING` | No | No | `false` | Optional scoring mode that adds a four-corners bonus |
| `NEXT_PUBLIC_SHARE_BASE_URL` | No | No | unset | Optional canonical public origin for all generated invite/share links |
| `NEXT_PUBLIC_THEME_KEY` | No | No | `arcade-neon` | Theme preset (`arcade-neon`, `lake-blue`, or `kimberly`) |
| `NEXT_PUBLIC_THEME_BANNER_TEXT` | No | No | launch message | Optional top banner text |
| `NEXT_PUBLIC_THEME_BANNER_IMAGE_URL` | No | No | `/themes/lake-blue/banner.svg` | Optional top banner image override; local `public/` paths preferred |
| `NEXT_PUBLIC_THEME_FOOTER_NOTE` | No | No | custom footer copy | Optional footer text override |

## Theme Asset Convention
- Default theme assets live under `public/themes/<theme-key>/`.
- Stable shell asset names are `banner.svg`, `background.svg`, and `footer.svg`.
- Route groups (`public`, `auth`, `app`) resolve against the active theme preset and can reuse or replace those assets without changing page components.
- If `NEXT_PUBLIC_THEME_BANNER_IMAGE_URL` is set, use either a full URL or a root-relative asset path.

## Secrets Model
- `DATABASE_URL`, `AUTH_SECRET`, and OAuth credentials are managed via host secret managers.
- Secrets must not be printed in logs.
- Secret rotation should happen before high-risk releases and after incident response.

## Vercel Deployment URL and NEXTAUTH_URL
- If `NEXTAUTH_URL` is not set, NextAuth.js falls back to Vercel's `VERCEL_URL`, which is a unique, ephemeral hostname per deployment (for example `bingo-royale-ncgvl39tx-intx1.vercel.app`).
- This causes two symptoms: users get redirected after sign-in to that ephemeral deployment URL (404 once the deployment is deleted), and Google OAuth sends a `redirect_uri` that does not match anything registered in Google Cloud Console (`redirect_uri_mismatch`), even for brand-new users with no existing account.
- Fix: set `NEXTAUTH_URL` to the stable production domain (custom domain or the stable `*.vercel.app` alias) in the Vercel project's **Production** environment variables only. Do not set it for **Preview** deployments, or every preview build will incorrectly redirect to the fixed production URL instead of its own preview URL.
- After setting it, redeploy Production so the value is baked into the build.

## Google OAuth Account Linking
- Default behavior: Google OAuth will not automatically link to an existing same-email credentials account.
- If users see `OAuthAccountNotLinked`, they signed up previously with a different method for that email.
- To allow linking in this app, set `GOOGLE_ALLOW_DANGEROUS_EMAIL_ACCOUNT_LINKING=true` and redeploy.
- Only enable this if you explicitly accept the account-linking risk tradeoff for your user base.
- `redirect_uri_mismatch` is unrelated to account linking and affects every user, including brand-new sign-ups. In Google Cloud Console, under the OAuth Client's Authorized redirect URIs, register exactly `${NEXTAUTH_URL}/api/auth/callback/google` (the stable production domain), and remove any stale entries pointing at old ephemeral deployment URLs.

## Enforcement and Tooling
- CI portability guardrail: `npm run check:portability`
- Guardrail checks:
  - blocks new unapproved `process.env` usage in app/source files
  - blocks unapproved raw SQL entry points (`$queryRaw*`, `$executeRaw*`)

## Hosting Notes
- This contract supports multiple hosting targets without code changes.
- Any target-specific behavior must be isolated in infrastructure adapters or deployment config, not in domain services.
