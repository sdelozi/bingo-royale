"use client";

export default function DashboardError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ui-stack">
      <h1>Dashboard unavailable</h1>
      <p className="ui-alert is-error">We could not load your dashboard right now.</p>
      <div className="ui-actions">
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
