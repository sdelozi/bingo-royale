import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/server/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {user.name ?? user.email}.</p>
      <p>Your game dashboard will live here next.</p>
      <p>
        <Link href="/groups">Go to groups</Link>
      </p>
      <p>
        <Link href="/board">Go to board</Link>
      </p>
      <p>
        <Link href="/">Back home</Link>
      </p>
      <SignOutButton />
    </main>
  );
}