import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import styles from "./player-board-grid.module.css";

type ReadOnlyBoardGridProps = {
  squares: PlayerBoardSquareState[];
};

export function ReadOnlyBoardGrid({ squares }: ReadOnlyBoardGridProps) {
  const rows = Array.from({ length: 5 }, (_, rowIndex) => squares.slice(rowIndex * 5, rowIndex * 5 + 5));

  return (
    <table className={styles.boardGridTable}>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((square) => (
              <td key={square.position} className={styles.boardGridCell}>
                <div className={styles.boardGridButton} aria-pressed={square.isMarked}>
                  {square.isFreeSpace ? <strong>Free space</strong> : null}
                  <span className={styles.boardGridContent}>{square.content}</span>
                  <span className={styles.boardGridStatus}>{square.isMarked ? "Marked" : "Open"}</span>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
