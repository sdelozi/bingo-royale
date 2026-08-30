"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import styles from "./player-board-grid.module.css";

type PlayerBoardGridProps = {
  groupId: string;
  squares: PlayerBoardSquareState[];
  onSquaresChange?: (squares: PlayerBoardSquareState[]) => void;
};

export function PlayerBoardGrid({ groupId, squares, onSquaresChange }: PlayerBoardGridProps) {
  const router = useRouter();
  const [boardSquares, setBoardSquares] = useState(squares);
  const [error, setError] = useState<string | null>(null);
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
        const nextSquares = boardSquaresRef.current.map((item) =>
          item.position === data.position ? { ...item, isMarked: data.isMarked } : item
        );
        const nextServerSquares = serverSquaresRef.current.map((item) =>
          item.position === data.position ? { ...item, isMarked: data.isMarked } : item
        );
        boardSquaresRef.current = nextSquares;
        serverSquaresRef.current = nextServerSquares;
        setBoardSquares(nextSquares);
        onSquaresChange?.(nextSquares);
      }

      setError(null);
    } catch (requestError) {
      setBoardSquares(squares);
      boardSquaresRef.current = squares;
      serverSquaresRef.current = squares;
      desiredMarksRef.current = new Map(squares.map((square) => [square.position, square.isMarked]));
      setError(requestError instanceof Error ? requestError.message : "Unable to update board mark.");
    } finally {
      inFlightRef.current = false;

      if (
        boardSquaresRef.current.some((square) => {
          const desired = desiredMarksRef.current.get(square.position);
          return typeof desired === "boolean" && desired !== square.isMarked;
        })
      ) {
        void flushPendingUpdates();
      } else {
        router.refresh();
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

    setError(null);
    desiredMarksRef.current.set(position, nextMarkedState);
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
      {error ? <p>{error}</p> : null}

      <table className={styles.boardGridTable}>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((square) => {
                return (
                  <td key={square.position} className={styles.boardGridCell}>
                    <button
                      className={styles.boardGridButton}
                      type="button"
                      onClick={() => toggleSquare(square.position)}
                      aria-pressed={square.isMarked}
                    >
                      {square.isFreeSpace ? <strong>Free space</strong> : null}
                      <span className={styles.boardGridContent}>{square.content}</span>
                      <span className={styles.boardGridStatus}>{square.isMarked ? "Marked" : "Open"}</span>
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