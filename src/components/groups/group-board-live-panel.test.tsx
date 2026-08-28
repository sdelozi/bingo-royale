import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupBoardLivePanel } from "./group-board-live-panel";

vi.mock("./player-board-grid", () => ({
  PlayerBoardGrid: ({ squares }: { squares: Array<{ content: string }> }) => <div>{squares[0]?.content ?? "No squares"}</div>
}));

describe("GroupBoardLivePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes stats and squares on manual refresh", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
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

    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Score: 9/)).toBeInTheDocument();
      expect(screen.getByText("Updated square")).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });
});
