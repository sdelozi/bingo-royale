import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateGroupForm } from "./create-group-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

describe("CreateGroupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits successfully, resets form, and shows full share link", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "Trip Bingo",
        inviteCode: "ABCD2345",
        shareToken: "share-token-123",
        shareLink: "https://bingo-royale.app/join/share-token-123"
      })
    } as Response);

    const resetSpy = vi.spyOn(HTMLFormElement.prototype, "reset");

    render(<CreateGroupForm />);

    fireEvent.change(screen.getByLabelText("Group name"), {
      target: { value: "Trip Bingo" }
    });

    fireEvent.submit(screen.getByRole("button", { name: "Create group" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(resetSpy).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Created: Trip Bingo")).toBeInTheDocument();
      expect(screen.getByText("Invite code: ABCD2345")).toBeInTheDocument();
      expect(screen.getByText("https://bingo-royale.app/join/share-token-123")).toBeInTheDocument();
    });

    fetchMock.mockRestore();
    resetSpy.mockRestore();
  });

  it("copies share link to clipboard when requested", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "Trip Bingo",
        inviteCode: "ABCD2345",
        shareToken: "share-token-123",
        shareLink: "https://bingo-royale.app/join/share-token-123"
      })
    } as Response);

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText
      }
    });

    render(<CreateGroupForm />);

    fireEvent.change(screen.getByLabelText("Group name"), {
      target: { value: "Trip Bingo" }
    });

    fireEvent.submit(screen.getByRole("button", { name: "Create group" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy share link" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://bingo-royale.app/join/share-token-123");
      expect(screen.getByText("Share link copied.")).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });
});
