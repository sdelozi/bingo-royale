"use client";

import React from "react";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type RegisterFormProps = {
  callbackUrl?: string;
};

export function RegisterForm({ callbackUrl = "/dashboard" }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to create account.");
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
    <form onSubmit={handleSubmit}>
      <h1>Create account</h1>

      {error ? <p>{error}</p> : null}

      <p>
        <label htmlFor="name">Name</label>
        <br />
        <input id="name" name="name" type="text" maxLength={80} required />
      </p>

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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </p>
    </form>
  );
}