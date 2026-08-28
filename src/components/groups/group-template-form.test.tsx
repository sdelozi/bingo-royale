import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupTemplateForm } from "./group-template-form";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

describe("GroupTemplateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows generic success text after saving template", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 4 })
    } as Response);

    const objectives = Array.from({ length: 25 }, (_, index) => `Objective ${index + 1}`);

    render(
      <GroupTemplateForm
        groupId="group-1"
        initialFreeSpaceObjective="Free space"
        initialObjectives={objectives.slice(0, 24)}
        initialFreeSpaceMarkedByDefault={false}
        hasExistingBoards={false}
        currentVersion={3}
      />
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Template saved.")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Template saved as version/i)).not.toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("requires explicit confirmation before saving when boards already exist", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 5 })
    } as Response);

    const objectives = Array.from({ length: 25 }, (_, index) => `Objective ${index + 1}`);

    render(
      <GroupTemplateForm
        groupId="group-1"
        initialFreeSpaceObjective="Free space"
        initialObjectives={objectives.slice(0, 24)}
        initialFreeSpaceMarkedByDefault={false}
        hasExistingBoards={true}
        currentVersion={4}
      />
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(0);

    fireEvent.submit(
      screen.getByRole("button", { name: "I understand, save template" }).closest("form") as HTMLFormElement
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    fetchMock.mockRestore();
  });
});
