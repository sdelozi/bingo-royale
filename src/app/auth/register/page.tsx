import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
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

  return (
    <main>
      <RegisterForm callbackUrl={callbackUrl} />
      <p>
        Already have an account? <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link>
      </p>
    </main>
  );
}