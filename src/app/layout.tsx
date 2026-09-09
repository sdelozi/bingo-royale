import type { Metadata } from "next";
import Image from "next/image";
import { themeConfig } from "@/server/config/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Royale",
  description: "Browser-first multiplayer bingo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
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

            <p className="app-kicker">Bingo Royale</p>
            <p className="app-title">Live Multiplayer Bingo</p>
            <p className="app-tagline">
              Real-time board updates and shared score tracking.
            </p>
            {themeConfig.bannerText ? <p className="app-banner-note">{themeConfig.bannerText}</p> : null}
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
