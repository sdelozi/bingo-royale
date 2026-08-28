"use client";

import React from "react";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  googleEnabled: boolean;
  error?: string;
  callbackUrl?: string;
};

export function SignInForm({ googleEnabled, error, callbackUrl = "/dashboard" }: SignInFormProps) {
  const [formError, setFormError] = useState<string | null>(error ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setFormError("Invalid email or password.");
      } else {
        setFormError("Unable to sign in right now. Please try again.");
      }

      setIsSubmitting(false);
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
      return;
    }

    setFormError("Unable to sign in right now. Please try again.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign in</h1>

      {formError ? <p>{formError}</p> : null}

      <p>
        <label htmlFor="email">Email</label>
        <br />
        <input id="email" name="email" type="email" required />
      </p>

      <p>
        <label htmlFor="password">Password</label>
        <br />
        <input id="password" name="password" type="password" minLength={8} required />
      </p>

      <p>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </p>

      {googleEnabled ? (
        <p>
          <button type="button" onClick={() => signIn("google", { callbackUrl })}>
            Continue with Google
          </button>
        </p>
      ) : null}
    </form>
  );
}