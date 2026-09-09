import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GroupBoardLivePanel } from "./group-board-live-panel";

function hasNormalizedText(expectedText: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, "").trim() === expectedText;
}

vi.mock("./player-board-grid", () => ({
  PlayerBoardGrid: ({
    squares,
    onSquaresChange
  }: {
    squares: Array<{ content: string; position: number; isMarked: boolean; isFreeSpace: boolean }>;
    onSquaresChange?: (squares: Array<{ position: number; content: string; isMarked: boolean; isFreeSpace: boolean }>) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSquaresChange?.(
            squares.map((square) =>
              square.position === 0 ? { ...square, isMarked: !square.isMarked } : square
            )
          )
        }
      >
        Toggle local
      </button>
      <div>{squares[0]?.content ?? "No squares"}</div>
    </div>
  )
}));

describe("GroupBoardLivePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POLL_INTERVAL_MS;
    delete process.env.NEXT_PUBLIC_POLL_MAX_INTERVAL_MS;
    vi.useRealTimers();
  });

  it("refreshes stats and squares through background polling", async () => {
    vi.useFakeTimers();
    process.env.NEXT_PUBLIC_POLL_INTERVAL_MS = "1000";
    process.env.NEXT_PUBLIC_POLL_MAX_INTERVAL_MS = "1000";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: "2026-08-28T00:00:10.000Z",
        squares: [
          {
            position: 0,
            content: "Updated square",
            isFreeSpace: false,
            isMarked: true
          }
        ],
        stats: {
          score: 9,
          bingoCount: 2,
          blackout: false
        }
      })
    } as Response);

    render(
      <GroupBoardLivePanel
        groupId="group-1"
        initialGeneratedAt="2026-08-28T00:00:00.000Z"
        initialSquares={[
          {
            position: 0,
            content: "Initial square",
            isFreeSpace: false,
            isMarked: false
          }
        ]}
        initialStats={{
          score: 0,
          bingoCount: 0,
          blackout: false
        }}
      />
    );

    expect(screen.queryByRole("button", { name: "Refresh now" })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(screen.getByText(hasNormalizedText("Score9"))).toBeInTheDocument();
    expect(screen.getByText("Updated square")).toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("updates stats immediately when local square state changes", async () => {
    render(
      <GroupBoardLivePanel
        groupId="group-1"
        initialGeneratedAt="2026-08-28T00:00:00.000Z"
        initialSquares={[
          {
            position: 0,
            content: "Initial square",
            isFreeSpace: false,
            isMarked: false
          },
          ...Array.from({ length: 24 }, (_, index) => ({
            position: index + 1,
            content: `Objective ${index + 2}`,
            isFreeSpace: index + 1 === 12,
            isMarked: false
          }))
        ]}
        initialStats={{
          score: 0,
          bingoCount: 0,
          blackout: false
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle local" }));

    expect(screen.getByText(hasNormalizedText("Score1"))).toBeInTheDocument();
  });
});
