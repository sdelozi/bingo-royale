"use client";

import React from "react";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type RegisterFormProps = {
  callbackUrl?: string;
  googleEnabled?: boolean;
};

export function RegisterForm({ callbackUrl = "/dashboard", googleEnabled = false }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function readErrorMessage(response: Response) {
    try {
      const data = (await response.json()) as { error?: string };
      return data.error ?? "Unable to create account.";
    } catch {
      return "Unable to create account right now. Please try again.";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setError(await readErrorMessage(response));
      setIsSubmitting(false);
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      callbackUrl
    });
  }

  return (
    <form onSubmit={handleSubmit} className="ui-form">
      <h1>Create account</h1>

      {error ? (
        <p className="ui-alert is-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ui-field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" maxLength={80} required className="ui-input" />
      </div>

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
          {isSubmitting ? "Creating account..." : "Create account"}
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