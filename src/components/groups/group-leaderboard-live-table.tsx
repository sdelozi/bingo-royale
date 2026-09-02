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

  return (
    <section>
      <p>Last updated: {lastUpdated.toLocaleString()}</p>
      <p>{error ? `Refresh failed. Retrying in ${Math.ceil(nextRefreshMs / 1000)}s.` : `Auto-refresh every ${Math.ceil(nextRefreshMs / 1000)}s.`}</p>
      <p>
        <button type="button" onClick={handleManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Bingos</th>
            <th>Score</th>
            <th>Blackout</th>
            <th>Board</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td>{row.displayName}</td>
              <td>{row.role}</td>
              <td>{row.bingoCount}</td>
              <td>{row.score}</td>
              <td>{row.blackout ? "Yes" : "No"}</td>
              <td>{row.boardHref ? <Link href={row.boardHref}>View board</Link> : "No board yet"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
