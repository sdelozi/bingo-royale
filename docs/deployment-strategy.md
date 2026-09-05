# Deployment Strategy

This document records the recommended environment split for Bingo Royale while keeping the application deployment-agnostic.

## Recommendation

### Dev environment
- **Host:** Vercel Hobby
- **Database:** Neon free tier
- **Purpose:** testing deployment, preview validation, and low-risk release rehearsal

Why this is the dev choice:
- Best Next.js runtime fit for a free tier.
- Fastest path to a real deployed URL for smoke testing.
- Good enough for low-volume validation without committing the app to provider-specific code.

### Production environment
- **Host:** Render small paid web service
- **Database:** Neon paid small plan
- **Purpose:** real production traffic with low monthly cost and predictable runtime behavior

Why this is the production choice:
- Low operational cost without relying on fragile free-tier behavior.
- Straightforward SSR/API hosting for the app.
- Keeps the production path conventional while still letting the app remain portable.

## Config File Recommendation

### Recommendation: keep provider-specific deployment config in a separate repo

Store provider-specific deployment manifests and project wiring in an infra/deployment repo, not in the application repo.

#### Keep in this repo
- Portable app code.
- Environment contract documentation.
- Health and metrics endpoints.
- Smoke-test scripts/workflows that operate against any deployed URL.
- ADRs and architecture notes.

#### Keep in the deployment repo or host dashboards
- Provider-specific app settings.
- Build/deploy manifests tied to a specific host.
- Secret/environment wiring for each environment.
- Domain, scaling, and region settings.

Why this is the better fit:
- Preserves the deployment-agnostic release boundary.
- Prevents app releases from being coupled to provider-specific manifest churn.
- Lets dev and prod evolve independently.
- Makes it easier to swap the provider for either environment later.

## Operating Model
- Deploy the same app commit to dev first.
- Run smoke checks on dev.
- Promote the same commit to prod after validation.
- Keep environment values externalized and environment-specific.
- Keep provider-specific config out of the app repository whenever possible.

## Notes
- This strategy is compatible with the existing portability guardrails in CI.
- The app repository remains the source of truth for runtime behavior; the deployment repo is the source of truth for host-specific wiring.
