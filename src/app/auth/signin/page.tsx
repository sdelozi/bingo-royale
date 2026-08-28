import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { env } from "@/server/config/env";

type SignInPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  return (
    <main>
      <SignInForm
        googleEnabled={Boolean(env.googleClientId && env.googleClientSecret)}
        error={searchParams?.error ? "Unable to sign in with that method." : undefined}
      />
      <p>
        Need an account? <Link href="/auth/register">Create one</Link>
      </p>
    </main>
  );
}