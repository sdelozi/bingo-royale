import type { Metadata } from "next";
import Image from "next/image";
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
  description: "Browser-first multiplayer bingo."
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
