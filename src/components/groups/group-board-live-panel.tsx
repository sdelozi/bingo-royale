"use client";

import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import { getDefaultPollingConfig, getNextPollDelay } from "@/lib/polling";
import { PlayerBoardGrid } from "./player-board-grid";

type GroupBoardLivePanelProps = {
  groupId: string;
  initialSquares: PlayerBoardSquareState[];
  initialGeneratedAt: string;
  initialStats: {
    score: number;
    bingoCount: number;
    blackout: boolean;
  };
};

type BoardResponse = {
  generatedAt: string;
  squares: PlayerBoardSquareState[];
  stats: {
    score: number;
    bingoCount: number;
    blackout: boolean;
  };
  error?: string;
};

export function GroupBoardLivePanel({
  groupId,
  initialSquares,
  initialGeneratedAt,
  initialStats
}: GroupBoardLivePanelProps) {
  const pollingConfig = useMemo(() => getDefaultPollingConfig(), []);
  const delayRef = useRef<number>(pollingConfig.baseIntervalMs);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [squares, setSquares] = useState(initialSquares);
  const [stats, setStats] = useState(initialStats);
  const [lastUpdated, setLastUpdated] = useState(new Date(initialGeneratedAt));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshMs, setNextRefreshMs] = useState(pollingConfig.baseIntervalMs);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/board`, {
        method: "GET",
        cache: "no-store"
      });
      const data = (await response.json()) as BoardResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to refresh board.");
      }

      setSquares(data.squares ?? []);
      setStats(data.stats);
      setLastUpdated(new Date(data.generatedAt));
      setError(null);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to refresh board.");
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
      <p>
        Score: {stats.score} | Bingos: {stats.bingoCount} | Blackout: {stats.blackout ? "Yes" : "No"}
      </p>
      <p>Last updated: {lastUpdated.toLocaleString()}</p>
      <p>{error ? `Refresh failed. Retrying in ${Math.ceil(nextRefreshMs / 1000)}s.` : `Auto-refresh every ${Math.ceil(nextRefreshMs / 1000)}s.`}</p>
      <p>
        <button type="button" onClick={handleManualRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </p>

      <PlayerBoardGrid groupId={groupId} squares={squares} />
    </section>
  );
}
