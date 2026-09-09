"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GroupLeaderboardRow } from "@/server/services/groups/get-group-leaderboard";
import { fetchGroupLeaderboardSnapshot } from "@/lib/sync/group-sync-drivers";
import { createPollingSyncTransport } from "@/lib/sync/transport";

type GroupLeaderboardLiveTableProps = {
  groupId: string;
  initialRows: GroupLeaderboardRow[];
  initialGeneratedAt: string;
};

export function GroupLeaderboardLiveTable({
  groupId,
  initialRows,
  initialGeneratedAt
}: GroupLeaderboardLiveTableProps) {
  const transport = useMemo(
    () =>
      createPollingSyncTransport({
        fetchLatest: () => fetchGroupLeaderboardSnapshot(groupId),
        getErrorMessage: (error) => (error instanceof Error ? error.message : "Unable to refresh leaderboard.")
      }),
    [groupId]
  );

  const [rows, setRows] = useState(initialRows);
  const [lastUpdated, setLastUpdated] = useState(new Date(initialGeneratedAt));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshMs, setNextRefreshMs] = useState(transport.getNextDelayMs());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stop = transport.start({
      onData: (payload) => {
        setRows(payload.rows ?? []);
        setLastUpdated(new Date(payload.generatedAt));
      },
      onError: (message) => {
        setError(message);
      },
      onRefreshingChange: (refreshing) => {
        setIsRefreshing(refreshing);
      },
      onNextDelayChange: (delayMs) => {
        setNextRefreshMs(delayMs);
      }
    });

    return stop;
  }, [transport]);

  async function handleManualRefresh() {
    await transport.refreshNow();
  }

  function getRankClassName(rank: number) {
    if (rank === 1) {
      return "ui-badge is-rank-1";
    }

    if (rank === 2) {
      return "ui-badge is-rank-2";
    }

    if (rank === 3) {
      return "ui-badge is-rank-3";
    }

    return "ui-badge is-neutral";
  }

  return (
    <section className="ui-panel">
      <div className="ui-panel-title-row">
        <p className="ui-card-title">Live standings</p>
        <span className={`ui-badge ${error ? "is-neutral" : "is-success"}`}>{error ? "Retrying" : "Live"}</span>
      </div>
      <p className="ui-status-line" aria-live="polite">
        <span className={`ui-status-dot ${error ? "is-danger" : isRefreshing ? "is-warning" : ""}`} aria-hidden="true" />
        {error
          ? `Refresh failed. Retrying in ${Math.ceil(nextRefreshMs / 1000)}s.`
          : isRefreshing
            ? "Refreshing leaderboard now..."
            : `Auto-refresh every ${Math.ceil(nextRefreshMs / 1000)}s.`}
      </p>
      <p className="ui-muted">Last updated: {lastUpdated.toLocaleString()}</p>
      <div className="ui-actions">
        <button type="button" className="ui-button-secondary" onClick={handleManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="ui-stat-grid" aria-label="Leaderboard summary">
          <div className="ui-stat-chip">
            <span className="ui-stat-label">Players</span>
            <span className="ui-stat-value">{rows.length}</span>
          </div>
          <div className="ui-stat-chip">
            <span className="ui-stat-label">Top score</span>
            <span className="ui-stat-value">{rows[0]?.score ?? 0}</span>
          </div>
          <div className="ui-stat-chip">
            <span className="ui-stat-label">Blackouts</span>
            <span className="ui-stat-value">{rows.filter((row) => row.blackout).length}</span>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? <p className="ui-empty-state">No leaderboard entries yet.</p> : null}

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Role</th>
              <th>Bingos</th>
              <th>Score</th>
              <th>Blackout</th>
              <th>Board</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rank = index + 1;
              const rowClassName =
                rank === 1
                  ? "ui-table-row-top-1"
                  : rank === 2
                    ? "ui-table-row-top-2"
                    : rank === 3
                      ? "ui-table-row-top-3"
                      : undefined;

              return (
              <tr key={row.userId} className={rowClassName}>
                <td>
                  <span className="ui-table-rank">
                    <span className={getRankClassName(rank)}>{rank}</span>
                  </span>
                </td>
                <td>{row.displayName}</td>
                <td>
                  <span className={`ui-badge ${row.role === "ADMIN" ? "is-admin" : "is-player"}`}>{row.role}</span>
                </td>
                <td>{row.bingoCount}</td>
                <td>
                  <span className="ui-score-value">{row.score} pts</span>
                </td>
                <td>
                  <span className={`ui-badge ${row.blackout ? "is-success" : "is-neutral"}`}>
                    {row.blackout ? "Yes" : "No"}
                  </span>
                </td>
                <td>{row.boardHref ? <Link href={row.boardHref}>View board</Link> : "No board yet"}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
