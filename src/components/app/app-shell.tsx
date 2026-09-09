"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  getThemeCtaClassName,
  resolveThemeRoutePresentation,
  type ResolvedThemeConfig
} from "@/lib/theme-shell";

type AppShellProps = {
  children: ReactNode;
  isSignedIn: boolean;
  theme: ResolvedThemeConfig;
  userLabel: string;
};

export function AppShell({ children, isSignedIn, theme, userLabel }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const routePresentation = resolveThemeRoutePresentation(pathname, theme.routes);
  const bannerText = theme.bannerText ?? routePresentation.bannerText;
  const bannerImageUrl = theme.bannerImageUrl ?? routePresentation.bannerImageUrl;
  const footerNote = theme.footerNote ?? routePresentation.footerNote ?? "Built for flexible multiplayer sessions.";
  const primaryActionClassName = getThemeCtaClassName(routePresentation.primaryCtaVariant);

  return (
    <div className="app-shell" data-route-group={routePresentation.routeGroup}>
      {routePresentation.backgroundImageUrl ? (
        <div
          className="app-shell-backdrop"
          aria-hidden="true"
          style={{ backgroundImage: `url(${routePresentation.backgroundImageUrl})` }}
        />
      ) : null}

      <header className="app-header">
        {bannerImageUrl ? (
          <div className="app-banner-image-wrap" aria-hidden="true">
            <div className="app-banner-image" style={{ backgroundImage: `url(${bannerImageUrl})` }} />
          </div>
        ) : null}

        <div className="app-header-top">
          <div className="app-brand-block">
            <p className="app-kicker">Bingo Royale</p>
            <div className="app-title-row">
              <p className="app-title">{routePresentation.headline}</p>
              <span className="app-route-chip">{routePresentation.routeLabel}</span>
            </div>
            <p className="app-tagline">{routePresentation.tagline}</p>
            {bannerText ? <p className="app-banner-note">{bannerText}</p> : null}
          </div>

          <p className="app-user-chip">{userLabel}</p>
        </div>

        <nav className="app-nav" aria-label="Primary">
          <div className="app-nav-links">
            <Link className="ui-link-button ui-link-button-secondary" href="/">
              Home
            </Link>
            {isSignedIn ? (
              <>
                <Link className={primaryActionClassName} href="/dashboard">
                  Dashboard
                </Link>
                <Link className="ui-link-button ui-link-button-secondary" href="/groups">
                  Groups
                </Link>
              </>
            ) : (
              <>
                <Link className={primaryActionClassName} href="/auth/signin">
                  Sign in
                </Link>
                <Link className="ui-link-button ui-link-button-secondary" href="/auth/register">
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {children}

      <footer className="app-footer">
        {routePresentation.footerImageUrl ? (
          <div
            className="app-footer-accent"
            aria-hidden="true"
            style={{ backgroundImage: `url(${routePresentation.footerImageUrl})` }}
          />
        ) : null}
        <p>{footerNote}</p>
      </footer>
    </div>
  );
}
