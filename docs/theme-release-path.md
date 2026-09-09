# Theme Release Path

This document defines the shared theme structure that must stay on `develop` before event-only branches such as the Kimberly release diverge.

## Asset Convention
- Store theme-owned assets under `public/themes/<theme-key>/`.
- Keep route-shared shell assets on stable names so branches can replace files without touching component code:
  - `banner.svg`
  - `background.svg`
  - `footer.svg`
- Prefer local assets over remote URLs for default theme behavior.
- Use `NEXT_PUBLIC_THEME_BANNER_IMAGE_URL` only as an override when a deployment needs to point at a different already-prepared asset.

## Route Group Slots
Theme-aware shell surfaces resolve against three route groups:
- `public`: landing and join entry points
- `auth`: sign-in and registration flows
- `app`: dashboard, groups, board, leaderboard, and template flows

Each route group can provide its own:
- headline and tagline
- banner text
- banner image
- background art
- footer art and footer note
- preferred primary CTA variant

## Kimberly Branch Strategy
- Cut the Kimberly branch from `develop` only after the shared theme shell and mobile-first UX hooks are in place.
- Treat the Kimberly branch as permanent and event-specific.
- Do not back-merge Kimberly-only copy, assets, or styling into `develop`.
- Merge only bug fixes by re-applying the minimal shared fix onto both branches when needed.

## Event Content Checklist
- Confirm image rights and source ownership before adding event assets.
- Export banner, background, and footer art at mobile-first crops first.
- Verify text remains readable over imagery on narrow phone widths.
- Keep a fallback asset in the same directory for each visual slot before swapping finals.
- Use versioned filenames when replacing shipped assets to avoid stale CDN/browser caches.
- Re-test auth, join, board, and leaderboard flows after every major asset swap.

## Archive Checklist
- Freeze the final Kimberly branch commit hash used for the event.
- Capture screenshots of landing, auth, board, and leaderboard routes.
- Record any event-only environment overrides that were required.
- Remove unused large assets from future event branches instead of carrying them forward by default.
