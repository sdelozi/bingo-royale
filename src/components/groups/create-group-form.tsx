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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  async function copyToClipboard(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

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

    const shareLink = data.shareLink ?? (data.shareToken ? `${window.location.origin}/join/${data.shareToken}` : null);

    setCreatedGroup({
      name: data.name,
      inviteCode: data.inviteCode,
      shareToken: data.shareToken,
      shareLink
    });

    setIsSubmitting(false);
    setCopyFeedback(null);
    form.reset();
    router.refresh();
  }

  async function handleCopyShareLink() {
    if (!createdGroup?.shareLink) {
      return;
    }

    try {
      await copyToClipboard(createdGroup.shareLink);
      setCopyFeedback("Share link copied.");
    } catch {
      setCopyFeedback("Unable to copy automatically. Please copy the link manually.");
    }
  }

  return (
    <section className="ui-panel">
      <h2>Create a group</h2>
      <form onSubmit={handleSubmit} className="ui-form">
        <div className="ui-field">
          <label htmlFor="group-name">Group name</label>
          <input id="group-name" name="name" type="text" minLength={1} maxLength={80} required className="ui-input" />
        </div>
        <div className="ui-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create group"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="ui-alert is-error" role="alert">
          {error}
        </p>
      ) : null}

      {createdGroup ? (
        <div className="ui-alert is-success">
          <p>Created: {createdGroup.name}</p>
          <p>Invite code: {createdGroup.inviteCode}</p>
          <p className="ui-share-link-line">
            <span>Share link:</span>
            <span className="ui-share-link-value">{createdGroup.shareLink ?? "Not available"}</span>
          </p>
          {createdGroup.shareLink ? (
            <div className="ui-actions ui-actions-compact">
              <button type="button" className="ui-button-secondary" onClick={handleCopyShareLink}>Copy share link</button>
            </div>
          ) : null}
          {copyFeedback ? (
            <p className="ui-copy-feedback" role="status" aria-live="polite">
              {copyFeedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
