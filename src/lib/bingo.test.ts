import { describe, expect, it } from "vitest";
import { calculateScore, countBingos, isBlackout } from "./bingo";

describe("bingo scoring helpers", () => {
  it("calculates score by counting marked squares", () => {
    const marks = Array.from({ length: 25 }, (_, index) => index < 7);
    expect(calculateScore(marks)).toBe(7);
  });

  it("counts row, column, and diagonal bingos", () => {
    const marks = new Array<boolean>(25).fill(false);

    [0, 1, 2, 3, 4].forEach((index) => {
      marks[index] = true;
    });

    [0, 5, 10, 15, 20].forEach((index) => {
      marks[index] = true;
    });

    [0, 6, 12, 18, 24].forEach((index) => {
      marks[index] = true;
    });

    expect(countBingos(marks)).toBe(3);
  });

  it("detects blackout only when all squares are marked", () => {
    const partial = new Array<boolean>(25).fill(true);
    partial[24] = false;

    const full = new Array<boolean>(25).fill(true);

    expect(isBlackout(partial)).toBe(false);
    expect(isBlackout(full)).toBe(true);
  });

  it("throws for invalid board size", () => {
    expect(() => calculateScore([true])).toThrowError(
      "Board marks must contain exactly 25 entries for a 5x5 board."
    );
  });
});
