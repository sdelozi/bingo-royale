import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { themeConfig } from "@/server/config/theme";
import { getCurrentUser } from "@/server/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Royale",
  description: "Browser-first multiplayer bingo."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body data-theme={themeConfig.key}>
        <div className="app-shell">
          <header className="app-header">
            {themeConfig.bannerImageUrl ? (
              <div className="app-banner-image-wrap" aria-hidden="true">
                <Image
                  className="app-banner-image"
                  src={themeConfig.bannerImageUrl}
                  alt=""
                  width={1400}
                  height={320}
                  unoptimized
                />
              </div>
            ) : null}

            <div className="app-header-top">
              <div className="app-brand-block">
                <p className="app-kicker">Bingo Royale</p>
                <p className="app-title">Live Multiplayer Bingo</p>
                <p className="app-tagline">Real-time board updates and shared score tracking.</p>
                {themeConfig.bannerText ? <p className="app-banner-note">{themeConfig.bannerText}</p> : null}
              </div>

              <p className="app-user-chip">{user ? `Signed in as ${user.name ?? user.email}` : "Guest access"}</p>
            </div>

            <nav className="app-nav" aria-label="Primary">
              <div className="app-nav-links">
                <Link className="ui-link-button ui-link-button-secondary" href="/">
                  Home
                </Link>
                {user ? (
                  <>
                    <Link className="ui-link-button" href="/dashboard">
                      Dashboard
                    </Link>
                    <Link className="ui-link-button ui-link-button-secondary" href="/groups">
                      Groups
                    </Link>
                  </>
                ) : (
                  <>
                    <Link className="ui-link-button" href="/auth/signin">
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
            <p>{themeConfig.footerNote ?? "Built for flexible multiplayer sessions."}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
