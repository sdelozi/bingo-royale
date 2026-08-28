import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GroupLeaderboardLiveTable } from "./group-leaderboard-live-table";

describe("GroupLeaderboardLiveTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POLL_INTERVAL_MS;
    delete process.env.NEXT_PUBLIC_POLL_MAX_INTERVAL_MS;
  });

  it("refreshes leaderboard rows on manual refresh", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        generatedAt: "2026-08-28T00:00:10.000Z",
        rows: [
          {
            userId: "user-2",
            displayName: "Bob",
            role: "PLAYER",
            joinedAt: "2026-08-28T00:00:00.000Z",
            score: 5,
            bingoCount: 1,
            blackout: false,
            boardHref: null
          }
        ]
      })
    } as Response);

    render(
      <GroupLeaderboardLiveTable
        groupId="group-1"
        initialGeneratedAt="2026-08-28T00:00:00.000Z"
        initialRows={[
          {
            userId: "user-1",
            displayName: "Alice",
            role: "ADMIN",
            joinedAt: new Date("2026-08-28T00:00:00.000Z"),
            score: 1,
            bingoCount: 0,
            blackout: false,
            boardHref: null
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });

  it("shows retry indicator after failed refresh", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    render(
      <GroupLeaderboardLiveTable
        groupId="group-1"
        initialGeneratedAt="2026-08-28T00:00:00.000Z"
        initialRows={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh now" }));

    await waitFor(() => {
      expect(screen.getByText(/Refresh failed\. Retrying in \d+s\./)).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fetchMock.mockRestore();
  });
});
