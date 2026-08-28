import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main>
      <RegisterForm />
      <p>
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>
    </main>
  );
}