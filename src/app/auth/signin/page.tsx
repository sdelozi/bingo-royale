import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { env } from "@/server/config/env";
import { getCurrentUser } from "@/server/auth/session";

type SignInPageProps = {
  searchParams?: {
    error?: string;
    callbackUrl?: string;
  };
};

function getErrorMessage(error?: string): string | undefined {
  if (!error) {
    return undefined;
  }

  if (error === "auth_required") {
    return "Please sign in to continue.";
  }

  return "Unable to sign in with that method.";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const callbackUrl = searchParams?.callbackUrl ?? "/dashboard";

  return (
    <main>
      <SignInForm
        googleEnabled={Boolean(env.googleClientId && env.googleClientSecret)}
        error={getErrorMessage(searchParams?.error)}
        callbackUrl={callbackUrl}
      />
      <p>
        Need an account? <Link href="/auth/register">Create one</Link>
      </p>
    </main>
  );
}