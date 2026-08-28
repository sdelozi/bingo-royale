"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import styles from "./player-board-grid.module.css";

type PlayerBoardGridProps = {
  groupId: string;
  squares: PlayerBoardSquareState[];
};

export function PlayerBoardGrid({ groupId, squares }: PlayerBoardGridProps) {
  const router = useRouter();
  const [boardSquares, setBoardSquares] = useState(squares);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingPosition === null) {
      setBoardSquares(squares);
    }
  }, [pendingPosition, squares]);

  async function toggleSquare(position: number) {
    const previousSquares = boardSquares;
    const square = previousSquares.find((item) => item.position === position);

    if (!square || pendingPosition !== null) {
      return;
    }

    const nextMarkedState = !square.isMarked;

    setError(null);
    setPendingPosition(position);
    setBoardSquares((currentSquares) =>
      currentSquares.map((item) => (item.position === position ? { ...item, isMarked: nextMarkedState } : item))
    );

    try {
      const response = await fetch(`/api/groups/${groupId}/board`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          position,
          isMarked: nextMarkedState
        })
      });

      const data = (await response.json()) as { error?: string; position?: number; isMarked?: boolean };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update board mark.");
      }

      if (typeof data.position === "number" && typeof data.isMarked === "boolean") {
        setBoardSquares((currentSquares) =>
          currentSquares.map((item) =>
            item.position === data.position ? { ...item, isMarked: data.isMarked ?? item.isMarked } : item
          )
        );
      }

      router.refresh();
    } catch (requestError) {
      setBoardSquares(previousSquares);
      setError(requestError instanceof Error ? requestError.message : "Unable to update board mark.");
    } finally {
      setPendingPosition(null);
    }
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
                const isPending = pendingPosition === square.position;

                return (
                  <td key={square.position} className={styles.boardGridCell}>
                    <button
                      className={styles.boardGridButton}
                      type="button"
                      onClick={() => toggleSquare(square.position)}
                      aria-pressed={square.isMarked}
                      disabled={isPending || pendingPosition !== null}
                    >
                      <strong>{square.isFreeSpace ? "Free space" : `Tile ${square.position + 1}`}</strong>
                      <br />
                      <span>{square.content}</span>
                      <br />
                      <span>{square.isMarked ? "Marked" : "Open"}</span>
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