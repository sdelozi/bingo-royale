import type { Metadata } from "next";
import { Bungee, Space_Grotesk } from "next/font/google";
import { themeConfig } from "@/server/config/theme";
import "./globals.css";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display"
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Bingo Royale",
  description: "Browser-first multiplayer bingo for group trips."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellClassName = `${displayFont.variable} ${bodyFont.variable}`;

  return (
    <html lang="en">
      <body className={shellClassName} data-theme={themeConfig.key}>
        <div className="app-shell">
          <header className="app-header">
            {themeConfig.bannerImageUrl ? (
              <div className="app-banner-image-wrap" aria-hidden="true">
                <img className="app-banner-image" src={themeConfig.bannerImageUrl} alt="" />
              </div>
            ) : null}

            <p className="app-kicker">Bingo Royale</p>
            <p className="app-title">Competitive Trip Bingo</p>
            <p className="app-tagline">
              Live scores. Friendly chaos. One board per player.
            </p>
            {themeConfig.bannerText ? <p className="app-banner-note">{themeConfig.bannerText}</p> : null}
          </header>

          {children}

          <footer className="app-footer">
            <p>{themeConfig.footerNote ?? "Built for group trips, parties, and weekend rivalries."}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
