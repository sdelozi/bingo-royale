import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app/app-shell";
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
  const bodyStyle = {
    "--font-display": themeConfig.fonts.display,
    "--font-body": themeConfig.fonts.body,
    "--font-accent": themeConfig.fonts.accent
  } as CSSProperties;

  return (
    <html lang="en">
      <body data-theme={themeConfig.key} style={bodyStyle}>
        <AppShell
          isSignedIn={Boolean(user)}
          theme={themeConfig}
          userLabel={user ? `Signed in as ${user.name ?? user.email}` : "Guest access"}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
