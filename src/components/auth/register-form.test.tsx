import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import { RegisterForm } from "./register-form";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn()
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes callbackUrl through to credential sign-in after registration", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    } as Response);

    vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

    render(<RegisterForm callbackUrl="/join/token-123" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Tester" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "tester@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "tester@example.com",
        password: "password123",
        callbackUrl: "/join/token-123"
      });
    });

    fetchMock.mockRestore();
  });

  it("shows a friendly fallback error when register returns non-JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      }
    } as Response);

    render(<RegisterForm callbackUrl="/dashboard" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Tester" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "tester@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("Unable to create account right now. Please try again.")).toBeInTheDocument();
      expect(signIn).not.toHaveBeenCalled();
    });

    fetchMock.mockRestore();
  });
});
