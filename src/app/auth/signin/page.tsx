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

  if (error === "OAuthAccountNotLinked") {
    return "That email is already registered with a different sign-in method. Use your original method or enable account linking for Google OAuth.";
  }

  if (error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount") {
    return "Google sign-in is currently unavailable. Check OAuth redirect URIs and Google client credentials.";
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
    <main className="ui-stack">
      <SignInForm
        googleEnabled={Boolean(env.googleClientId && env.googleClientSecret)}
        error={getErrorMessage(searchParams?.error)}
        callbackUrl={callbackUrl}
      />
      <p className="ui-muted">
        Need an account? <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create one</Link>
      </p>
    </main>
  );
}