"use client";

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
    setError(null);
    setJoined(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
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
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <section>
      <h2>Join with invite code</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="invite-code">Invite code</label>
          <br />
          <input id="invite-code" name="inviteCode" type="text" minLength={1} maxLength={20} required />
        </p>
        <p>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Join group"}
          </button>
        </p>
      </form>

      {error ? <p>{error}</p> : null}

      {joined ? (
        <p>
          {joined.alreadyMember ? "You are already in" : "Joined"} {joined.groupName} (code: {joined.inviteCode}).
        </p>
      ) : null}
    </section>
  );
}
