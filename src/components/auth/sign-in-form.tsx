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
    <form onSubmit={handleSubmit} className="ui-form">
      <h1>Sign in</h1>

      {formError ? (
        <p className="ui-alert is-error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="ui-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="ui-input" />
      </div>

      <div className="ui-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} required className="ui-input" />
      </div>

      <div className="ui-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </div>

      {googleEnabled ? (
        <div className="ui-actions">
          <button type="button" className="ui-button-secondary" onClick={() => signIn("google", { callbackUrl })}>
            Continue with Google
          </button>
        </div>
      ) : null}
    </form>
  );
}