export type BoardMarks = boolean[];

const WINNING_LINES: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

export function calculateScore(marks: BoardMarks): number {
  validateBoardLength(marks);
  const markedSquares = marks.filter(Boolean).length;
  const bingoCount = countBingos(marks);
  const blackout = isBlackout(marks);

  return markedSquares + bingoCount * 5 + (blackout ? 15 : 0);
}

export function countBingos(marks: BoardMarks): number {
  validateBoardLength(marks);
  return WINNING_LINES.filter((line) => line.every((index) => marks[index])).length;
}

export function isBlackout(marks: BoardMarks): boolean {
  validateBoardLength(marks);
  return marks.every(Boolean);
}

function validateBoardLength(marks: BoardMarks): void {
  if (marks.length !== 25) {
    throw new Error("Board marks must contain exactly 25 entries for a 5x5 board.");
  }
}
