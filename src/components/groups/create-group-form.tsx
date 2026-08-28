"use client";

import React from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CreatedGroup = {
  name: string;
  inviteCode: string;
  shareToken: string | null;
  shareLink: string | null;
};

export function CreateGroupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    const data = (await response.json()) as CreatedGroup & { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to create group.");
      setIsSubmitting(false);
      return;
    }

    const shareLink = data.shareToken ? `${window.location.origin}/join/${data.shareToken}` : null;

    setCreatedGroup({
      name: data.name,
      inviteCode: data.inviteCode,
      shareToken: data.shareToken,
      shareLink
    });

    setIsSubmitting(false);
    form.reset();
    router.refresh();
  }

  return (
    <section>
      <h2>Create a group</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="group-name">Group name</label>
          <br />
          <input id="group-name" name="name" type="text" minLength={1} maxLength={80} required />
        </p>
        <p>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create group"}
          </button>
        </p>
      </form>

      {error ? <p>{error}</p> : null}

      {createdGroup ? (
        <div>
          <p>Created: {createdGroup.name}</p>
          <p>Invite code: {createdGroup.inviteCode}</p>
          <p>Share link: {createdGroup.shareLink ?? "Not available"}</p>
        </div>
      ) : null}
    </section>
  );
}
