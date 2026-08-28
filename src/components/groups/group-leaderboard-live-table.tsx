"use client";

import React from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GroupLeaderboardRow } from "@/server/services/groups/get-group-leaderboard";
import { getDefaultPollingConfig, getNextPollDelay } from "@/lib/polling";

type GroupLeaderboardLiveTableProps = {
  groupId: string;
  initialRows: GroupLeaderboardRow[];
  initialGeneratedAt: string;
};

type LeaderboardResponse = {
  generatedAt: string;
  rows: GroupLeaderboardRow[];
  error?: string;
};

export function GroupLeaderboardLiveTable({
  groupId,
  initialRows,
  initialGeneratedAt
}: GroupLeaderboardLiveTableProps) {
  const pollingConfig = useMemo(() => getDefaultPollingConfig(), []);
  const delayRef = useRef<number>(pollingConfig.baseIntervalMs);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rows, setRows] = useState(initialRows);
  const [lastUpdated, setLastUpdated] = useState(new Date(initialGeneratedAt));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshMs, setNextRefreshMs] = useState(pollingConfig.baseIntervalMs);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/leaderboard`, {
        method: "GET",
        cache: "no-store"
      });
      const data = (await response.json()) as LeaderboardResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to refresh leaderboard.");
      }

      setRows(data.rows ?? []);
      setLastUpdated(new Date(data.generatedAt));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to refresh leaderboard.");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    let isActive = true;

    const scheduleNext = (delayMs: number) => {
      setNextRefreshMs(delayMs);
      timerRef.current = setTimeout(async () => {
        const wasSuccessful = await refresh();

        if (!isActive) {
          return;
        }

        delayRef.current = getNextPollDelay(delayRef.current, wasSuccessful, pollingConfig);
        scheduleNext(delayRef.current);
      }, delayMs);
    };

    scheduleNext(pollingConfig.baseIntervalMs);

    return () => {
      isActive = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pollingConfig, refresh]);

  async function handleManualRefresh() {
    delayRef.current = pollingConfig.baseIntervalMs;
    setNextRefreshMs(pollingConfig.baseIntervalMs);
    await refresh();
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
            <th>Score</th>
            <th>Bingos</th>
            <th>Blackout</th>
            <th>Board</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td>{row.displayName}</td>
              <td>{row.role}</td>
              <td>{row.score}</td>
              <td>{row.bingoCount}</td>
              <td>{row.blackout ? "Yes" : "No"}</td>
              <td>{row.boardHref ? <Link href={row.boardHref}>View board</Link> : "No board yet"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
