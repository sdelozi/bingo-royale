import { ZodError } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getAuthSession } from "@/server/auth/session";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit } from "@/server/rate-limit/request-rate-limit";
import { GroupNotFoundError, joinGroupForUser } from "@/server/services/groups/join-group";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/join-group", () => ({
  joinGroupForUser: vi.fn(),
  GroupNotFoundError: class GroupNotFoundError extends Error {}
}));

vi.mock("@/server/rate-limit/request-rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  rateLimitPolicies: {
    groupJoin: {
      windowMs: 60_000,
      maxRequests: 30
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

describe("POST /api/groups/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "ABCD2345" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("joins by invite code for authenticated user", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(joinGroupForUser).mockResolvedValueOnce({ groupId: "group-1", alreadyMember: false } as never);

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "ABCD2345" })
      })
    );

    expect(joinGroupForUser).toHaveBeenCalledWith("user-1", { inviteCode: "ABCD2345" });
    expect(response.status).toBe(200);
  });

  it("returns 400 when payload validation fails", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(joinGroupForUser).mockRejectedValueOnce(new ZodError([]));

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when share token does not map to a group", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(joinGroupForUser).mockRejectedValueOnce(new GroupNotFoundError());

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ shareToken: "missing" })
      })
    );

    expect(response.status).toBe(404);
  });

  it("returns 500 on unexpected failures", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(joinGroupForUser).mockRejectedValueOnce(new Error("db down"));

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "ABCD2345" })
      })
    );

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("returns 429 when join rate limit is exceeded", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(enforceRateLimit).mockImplementationOnce(() => {
      throw new RateLimitExceededError(7);
    });

    const response = await POST(
      new Request("http://localhost/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "ABCD2345" })
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
    expect(joinGroupForUser).not.toHaveBeenCalled();
  });
});
