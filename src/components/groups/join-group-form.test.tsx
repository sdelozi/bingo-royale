import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinGroupForm } from "./join-group-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

describe("JoinGroupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits successfully and resets form without crashing", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ groupName: "Trip", inviteCode: "ABCD2345", alreadyMember: false })
    } as Response);

    const resetSpy = vi.spyOn(HTMLFormElement.prototype, "reset");

    render(<JoinGroupForm />);

    fireEvent.change(screen.getByLabelText("Invite code"), {
      target: { value: "ABCD2345" }
    });

    fireEvent.submit(screen.getByRole("button", { name: "Join group" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(resetSpy).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Joined Trip/)).toBeInTheDocument();
    });

    fetchMock.mockRestore();
    resetSpy.mockRestore();
  });
});
