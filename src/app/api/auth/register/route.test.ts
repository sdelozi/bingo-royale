import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit } from "@/server/rate-limit/request-rate-limit";
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

vi.mock("@/server/rate-limit/request-rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  rateLimitPolicies: {
    authRegister: {
      windowMs: 60_000,
      maxRequests: 10
    }
  },
  RateLimitExceededError: class RateLimitExceededError extends Error {
    retryAfterSeconds: number;

    constructor(retryAfterSeconds: number) {
      super("Too many requests.");
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
}));

vi.mock("@/server/observability/logger", () => ({
  logError: vi.fn()
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
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("returns 429 when registration rate limit is exceeded", async () => {
    vi.mocked(enforceRateLimit).mockImplementationOnce(() => {
      throw new RateLimitExceededError(11);
    });

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

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("11");
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
