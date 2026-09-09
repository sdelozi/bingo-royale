"use client";

import React from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type JoinedMembership = {
  groupName: string;
  inviteCode: string;
  alreadyMember: boolean;
};

export function JoinGroupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<JoinedMembership | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setJoined(null);
    setIsSubmitting(true);

    const formData = new FormData(form);
    const inviteCode = String(formData.get("inviteCode") ?? "").trim();

    const response = await fetch("/api/groups/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteCode })
    });

    const data = (await response.json()) as JoinedMembership & { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to join group.");
      setIsSubmitting(false);
      return;
    }

    setJoined({
      groupName: data.groupName,
      inviteCode: data.inviteCode,
      alreadyMember: data.alreadyMember
    });

    setIsSubmitting(false);
    form.reset();
    router.refresh();
  }

  return (
    <section className="ui-panel">
      <h2>Join with invite code</h2>
      <form onSubmit={handleSubmit} className="ui-form">
        <div className="ui-field">
          <label htmlFor="invite-code">Invite code</label>
          <input id="invite-code" name="inviteCode" type="text" minLength={1} maxLength={20} required className="ui-input" />
        </div>
        <div className="ui-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Join group"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="ui-alert is-error" role="alert">
          {error}
        </p>
      ) : null}

      {joined ? (
        <p className="ui-alert is-success">
          {joined.alreadyMember ? "You are already in" : "Joined"} {joined.groupName} (code: {joined.inviteCode}).
        </p>
      ) : null}
    </section>
  );
}
