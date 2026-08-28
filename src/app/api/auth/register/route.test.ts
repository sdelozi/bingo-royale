import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { db } from "@/server/db/client";
import { hashPassword } from "@/server/auth/password";

vi.mock("@/server/db/client", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: vi.fn()
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "bad-email" })
      })
    );

    expect(response.status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 409 when account already exists", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          name: "Person",
          password: "password123"
        })
      })
    );

    expect(response.status).toBe(409);
  });

  it("creates an account when payload is valid and email is unused", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(hashPassword).mockResolvedValueOnce("hashed-value");

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          name: "Person",
          password: "password123"
        })
      })
    );

    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        email: "person@example.com",
        name: "Person",
        passwordHash: "hashed-value"
      }
    });
    expect(response.status).toBe(201);
  });

  it("returns 503 when registration storage is temporarily unavailable", async () => {
    vi.mocked(db.user.findUnique).mockRejectedValueOnce(new Error("db unavailable") as never);

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          name: "Person",
          password: "password123"
        })
      })
    );

    expect(response.status).toBe(503);
  });
});
