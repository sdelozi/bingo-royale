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
        initialObjectives={objectives}
        initialFreeSpaceOrdinal={12}
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
});
