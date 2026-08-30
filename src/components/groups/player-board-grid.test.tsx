import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerBoardGrid } from "./player-board-grid";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

function createSquares() {
  return Array.from({ length: 25 }, (_, index) => ({
    position: index,
    content: `Objective ${index + 1}`,
    isFreeSpace: index === 12,
    isMarked: false
  }));
}

function getTileButtonByObjective(objectiveLabel: string) {
  const button = screen
    .getAllByRole("button")
    .find((candidate) => (candidate.textContent ?? "").includes(objectiveLabel));

  if (!button) {
    throw new Error(`Unable to find button for ${objectiveLabel}.`);
  }

  return button;
}

describe("PlayerBoardGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically toggles a square and keeps the server-confirmed result", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ position: 0, isMarked: true })
    } as Response);

    render(<PlayerBoardGrid groupId="group-1" squares={createSquares()} />);

    const tileButton = getTileButtonByObjective("Objective 1");
    fireEvent.click(tileButton);

    expect(tileButton).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(tileButton).toHaveAttribute("aria-pressed", "true");
      expect(tileButton).toHaveTextContent("Marked");
    });

    fetchMock.mockRestore();
  });

  it("reverts the optimistic change and shows an error on failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unable to update board mark." })
    } as Response);

    render(<PlayerBoardGrid groupId="group-1" squares={createSquares()} />);

    const tileButton = getTileButtonByObjective("Objective 1");
    fireEvent.click(tileButton);

    expect(tileButton).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      expect(tileButton).toHaveAttribute("aria-pressed", "false");
      expect(tileButton).toHaveTextContent("Open");
      expect(screen.getByText("Unable to update board mark.")).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });

  it("renders the free-space tile as a normal toggleable tile", () => {
    render(<PlayerBoardGrid groupId="group-1" squares={createSquares()} />);

    const freeSpaceButton = screen.getByRole("button", { name: /Free space/i });

    expect(freeSpaceButton).not.toBeDisabled();
    expect(freeSpaceButton).toHaveAttribute("aria-pressed", "false");
  });

  it("coalesces rapid toggles to final local state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ position: 0, isMarked: false })
    } as Response);

    render(<PlayerBoardGrid groupId="group-1" squares={createSquares()} />);

    const tileButton = getTileButtonByObjective("Objective 1");
    fireEvent.click(tileButton);
    fireEvent.click(tileButton);

    await waitFor(() => {
      expect(tileButton).toHaveAttribute("aria-pressed", "false");
      expect(tileButton).toHaveTextContent("Open");
      expect(fetchMock).toHaveBeenCalled();
    });

    fetchMock.mockRestore();
  });
});