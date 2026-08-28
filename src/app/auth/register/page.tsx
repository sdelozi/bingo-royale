import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/server/auth/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main>
      <RegisterForm />
      <p>
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
    </main>
  );
}