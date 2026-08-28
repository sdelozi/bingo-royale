"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import { fetchGroupBoardSnapshot } from "@/lib/sync/group-sync-drivers";
import { createPollingSyncTransport } from "@/lib/sync/transport";
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

export function GroupBoardLivePanel({
  groupId,
  initialSquares,
  initialGeneratedAt,
  initialStats
}: GroupBoardLivePanelProps) {
  const transport = useMemo(
    () =>
      createPollingSyncTransport({
        fetchLatest: () => fetchGroupBoardSnapshot(groupId),
        getErrorMessage: (error) => (error instanceof Error ? error.message : "Unable to refresh board.")
      }),
    [groupId]
  );

  const [squares, setSquares] = useState(initialSquares);
  const [stats, setStats] = useState(initialStats);
  const [lastUpdated, setLastUpdated] = useState(new Date(initialGeneratedAt));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshMs, setNextRefreshMs] = useState(transport.getNextDelayMs());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stop = transport.start({
      onData: (payload) => {
        setSquares(payload.squares ?? []);
        setStats(payload.stats);
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
