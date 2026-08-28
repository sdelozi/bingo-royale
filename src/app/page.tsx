import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1>Bingo Royale</h1>
      <p>Browser-first multiplayer bingo for group trips.</p>

      {user ? (
        <>
          <p>Signed in as {user.name ?? user.email}.</p>
          <p>
            <Link href="/dashboard">Go to dashboard</Link>
          </p>
          <SignOutButton />
        </>
      ) : (
        <>
          <p>
            <Link href="/auth/signin">Sign in</Link> or <Link href="/auth/register">create an account</Link>.
          </p>
        </>
      )}
    </main>
  );
}
