"use client";

import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateScore, countBingos, isBlackout } from "@/lib/bingo";
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
  const [nextRefreshMs, setNextRefreshMs] = useState(transport.getNextDelayMs());
  const [error, setError] = useState<string | null>(null);

  const updateStatsFromSquares = useCallback((nextSquares: PlayerBoardSquareState[]) => {
    const marks = nextSquares.map((square) => square.isMarked);
    const nextStats = {
      score: calculateScore(marks),
      bingoCount: countBingos(marks),
      blackout: isBlackout(marks)
    };

    setStats((currentStats) => {
      if (
        currentStats.score === nextStats.score &&
        currentStats.bingoCount === nextStats.bingoCount &&
        currentStats.blackout === nextStats.blackout
      ) {
        return currentStats;
      }

      return nextStats;
    });
  }, []);

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
      onRefreshingChange: () => {
        // Board polling runs in the background; no user-facing loading state is needed here.
      },
      onNextDelayChange: (delayMs) => {
        setNextRefreshMs(delayMs);
      }
    });

    return stop;
  }, [transport]);

  return (
    <section className="ui-panel ui-stack-tight">
      <div className="ui-panel-title-row">
        <p className="ui-card-title">Board status</p>
        <span className={`ui-badge ${stats.blackout ? "is-success" : "is-neutral"}`}>
          {stats.blackout ? "Blackout" : "In play"}
        </span>
      </div>
      <div className="ui-stat-grid">
        <div className="ui-stat-chip">
          <span className="ui-stat-label">Score</span>
          <span className="ui-stat-value">{stats.score}</span>
        </div>
        <div className="ui-stat-chip">
          <span className="ui-stat-label">Bingos</span>
          <span className="ui-stat-value">{stats.bingoCount}</span>
        </div>
        <div className="ui-stat-chip">
          <span className="ui-stat-label">Blackout</span>
          <span className="ui-stat-value">{stats.blackout ? "Yes" : "No"}</span>
        </div>
      </div>
      <p className="ui-muted">Last updated: {lastUpdated.toLocaleString()}</p>
      {error ? <p className="ui-alert is-error">Board sync issue. Retrying in {Math.ceil(nextRefreshMs / 1000)}s.</p> : null}

      <PlayerBoardGrid groupId={groupId} squares={squares} onSquaresChange={updateStatsFromSquares} />
    </section>
  );
}
