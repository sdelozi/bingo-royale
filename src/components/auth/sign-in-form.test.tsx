import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signIn } from "next-auth/react";
import { SignInForm } from "./sign-in-form";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn()
}));

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows credential error message without redirecting to raw auth error page", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null
    } as never);

    render(<SignInForm googleEnabled={false} callbackUrl="/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "tester@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "tester@example.com",
        password: "password123",
        redirect: false,
        callbackUrl: "/dashboard"
      });
    });
  });

  it("shows generic error for non-credential sign-in failures", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "Configuration",
      ok: false,
      status: 500,
      url: null
    } as never);

    render(<SignInForm googleEnabled={false} callbackUrl="/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "tester@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("Unable to sign in right now. Please try again.")).toBeInTheDocument();
    });
  });
});