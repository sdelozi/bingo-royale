import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { env } from "@/server/config/env";
import { getCurrentUser } from "@/server/auth/session";

type RegisterPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const callbackUrl = searchParams?.callbackUrl ?? "/dashboard";
  const googleEnabled = Boolean(env.googleClientId && env.googleClientSecret);

  return (
    <main className="ui-stack">
      <RegisterForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
      <p className="ui-muted">
        Already have an account? <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link>
      </p>
    </main>
  );
}