import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { themeConfig } from "@/server/config/theme";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isKimberlyTheme = themeConfig.key === "kimberly";

  return (
    <main className="ui-stack ui-page">
      <header className="ui-page-header">
        <h1 className="ui-page-title">{isKimberlyTheme ? "Kimberly's Bachelorette Bingo" : "Bingo Royale"}</h1>
        <p className="ui-page-subtitle">
          {isKimberlyTheme ? "Lake of the Ozarks weekend, June 2026." : "Browser-first multiplayer bingo."}
        </p>
      </header>

      {isKimberlyTheme ? (
        <section className="ui-panel kimberly-itinerary">
          <Image
            className="kimberly-itinerary-image"
            src="/themes/kimberly/kimberly-itinerary-cropped.jpg"
            alt="Kimberly's Lake of the Ozarks bachelorette weekend itinerary"
            width={900}
            height={1329}
          />
        </section>
      ) : null}

      {user ? (
        <section className="ui-panel ui-stack-tight">
          <p className="ui-card-copy">Signed in as {user.name ?? user.email}.</p>
          <div className="ui-actions">
            <Link className="ui-link-button" href="/dashboard">Go to dashboard</Link>
          </div>
          <SignOutButton />
        </section>
      ) : (
        <section className="ui-panel ui-stack-tight">
          <p className="ui-card-copy">Sign in to get your bingo card and join the group.</p>
          <div className="ui-actions">
            <Link className="ui-link-button" href="/auth/signin">Sign in</Link>
            <Link className="ui-link-button ui-link-button-secondary" href="/auth/register">Create account</Link>
          </div>
        </section>
      )}
    </main>
  );
}
