"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import styles from "./player-board-grid.module.css";

type PlayerBoardGridProps = {
  groupId: string;
  squares: PlayerBoardSquareState[];
  onSquaresChange?: (squares: PlayerBoardSquareState[]) => void;
};

export function PlayerBoardGrid({ groupId, squares, onSquaresChange }: PlayerBoardGridProps) {
  const [boardSquares, setBoardSquares] = useState(squares);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPositions, setPendingPositions] = useState<number[]>([]);
  const inFlightRef = useRef(false);
  const boardSquaresRef = useRef(boardSquares);
  const serverSquaresRef = useRef(squares);
  const desiredMarksRef = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    boardSquaresRef.current = boardSquares;
  }, [boardSquares]);

  useEffect(() => {
    if (!inFlightRef.current) {
      setBoardSquares(squares);
      boardSquaresRef.current = squares;
      serverSquaresRef.current = squares;
      desiredMarksRef.current = new Map(squares.map((square) => [square.position, square.isMarked]));
      setPendingPositions([]);
    }
  }, [squares]);

  async function flushPendingUpdates() {
    if (inFlightRef.current) {
      return;
    }

    const changedSquare = serverSquaresRef.current.find((square) => {
      const desired = desiredMarksRef.current.get(square.position);
      return typeof desired === "boolean" && desired !== square.isMarked;
    });

    if (!changedSquare) {
      return;
    }

    const targetMarkedState = desiredMarksRef.current.get(changedSquare.position);

    if (typeof targetMarkedState !== "boolean") {
      return;
    }

    inFlightRef.current = true;
    let requestFailed = false;

    try {
      const response = await fetch(`/api/groups/${groupId}/board`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          position: changedSquare.position,
          isMarked: targetMarkedState
        })
      });

      const data = (await response.json()) as { error?: string; position?: number; isMarked?: boolean };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update board mark.");
      }

      if (typeof data.position === "number" && typeof data.isMarked === "boolean") {
        const updatedMarkedState = data.isMarked;
        const nextSquares = boardSquaresRef.current.map((item) =>
          item.position === data.position ? { ...item, isMarked: updatedMarkedState } : item
        );
        const nextServerSquares = serverSquaresRef.current.map((item) =>
          item.position === data.position ? { ...item, isMarked: updatedMarkedState } : item
        );

        boardSquaresRef.current = nextSquares;
        serverSquaresRef.current = nextServerSquares;
        setBoardSquares(nextSquares);
        onSquaresChange?.(nextSquares);

        const desiredState = desiredMarksRef.current.get(data.position);

        if (desiredState === updatedMarkedState) {
          setPendingPositions((currentPositions) => currentPositions.filter((position) => position !== data.position));
        }
      }

      setErrorMessage(null);
    } catch (requestError) {
      requestFailed = true;
      setBoardSquares(squares);
      boardSquaresRef.current = squares;
      serverSquaresRef.current = squares;
      desiredMarksRef.current = new Map(squares.map((square) => [square.position, square.isMarked]));
      setPendingPositions([]);
      setErrorMessage(requestError instanceof Error ? requestError.message : "Unable to update board mark.");
    } finally {
      inFlightRef.current = false;

      const hasRemainingDifferences = boardSquaresRef.current.some((square) => {
        const desired = desiredMarksRef.current.get(square.position);
        return typeof desired === "boolean" && desired !== square.isMarked;
      });

      if (hasRemainingDifferences) {
        void flushPendingUpdates();
      } else if (!requestFailed) {
        setPendingPositions([]);
      }
    }
  }

  async function toggleSquare(position: number) {
    const square = boardSquares.find((item) => item.position === position);

    if (!square) {
      return;
    }

    const currentDesired = desiredMarksRef.current.get(position) ?? square.isMarked;
    const nextMarkedState = !currentDesired;

    setErrorMessage(null);
    desiredMarksRef.current.set(position, nextMarkedState);
    setPendingPositions((currentPositions) =>
      currentPositions.includes(position) ? currentPositions : [...currentPositions, position]
    );
    setBoardSquares((currentSquares) => {
      const nextSquares = currentSquares.map((item) =>
        item.position === position ? { ...item, isMarked: nextMarkedState } : item
      );
      boardSquaresRef.current = nextSquares;
      onSquaresChange?.(nextSquares);
      return nextSquares;
    });

    void flushPendingUpdates();
  }

  const rows = Array.from({ length: 5 }, (_, rowIndex) => boardSquares.slice(rowIndex * 5, rowIndex * 5 + 5));

  return (
    <section>
      {errorMessage ? (
        <p className="ui-alert is-error" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      ) : null}

      <table className={styles.boardGridTable}>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((square) => {
                const isPending = pendingPositions.includes(square.position);
                const humanPosition = square.position + 1;
                const tileState = isPending ? "Syncing" : square.isMarked ? "Marked" : "Open";
                const visualState = isPending ? "pending" : square.isMarked ? "marked" : "idle";

                return (
                  <td key={square.position} className={styles.boardGridCell}>
                    <button
                      className={styles.boardGridButton}
                      type="button"
                      onClick={() => toggleSquare(square.position)}
                      aria-pressed={square.isMarked}
                      aria-busy={isPending}
                      data-pending={isPending}
                      data-state={visualState}
                      aria-label={`Square ${humanPosition}: ${square.content}. Status ${tileState}.`}
                      title={square.content}
                    >
                      <span className={styles.boardGridMeta}>
                        <span className={styles.boardGridIndex}>#{humanPosition}</span>
                        {square.isFreeSpace ? <strong className={styles.boardGridFreeSpaceLabel}>Free space</strong> : null}
                      </span>
                      <span className={styles.boardGridContent}>{square.content}</span>
                      <span className={styles.boardGridStatus}>{tileState}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}