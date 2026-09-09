"use client";

import Link from "next/link";

export default function GroupsError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ui-stack">
      <h1>Groups unavailable</h1>
      <p className="ui-alert is-error">We could not load this group view right now.</p>
      <div className="ui-actions">
        <button type="button" onClick={reset}>
          Try again
        </button>
        <Link className="ui-link-button ui-link-button-secondary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
