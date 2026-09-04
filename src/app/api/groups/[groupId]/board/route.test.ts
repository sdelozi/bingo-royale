import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthSession } from "@/server/auth/session";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit } from "@/server/rate-limit/request-rate-limit";
import {
  GroupAccessError,
  PlayerBoardSquareNotFoundError,
  ZodError,
  updatePlayerBoardMark
} from "@/server/services/groups/board-marking";
import { GroupBoardTemplateMissingError, getOrCreatePlayerBoardForGroup } from "@/server/services/groups/player-board";
import { GET, PATCH } from "./route";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/board-marking", () => ({
  updatePlayerBoardMark: vi.fn(),
  GroupAccessError: class GroupAccessError extends Error {},
  PlayerBoardSquareNotFoundError: class PlayerBoardSquareNotFoundError extends Error {},
  ZodError: class ZodError extends Error {
    issues = [{ message: "Invalid mark update payload." }];
  }
}));

vi.mock("@/server/services/groups/player-board", () => ({
  getOrCreatePlayerBoardForGroup: vi.fn(),
  GroupBoardTemplateMissingError: class GroupBoardTemplateMissingError extends Error {}
}));

vi.mock("@/server/rate-limit/request-rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  rateLimitPolicies: {
    boardMark: {
      windowMs: 60_000,
      maxRequests: 120
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

describe("GET /api/groups/[groupId]/board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/board"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when board access is denied", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getOrCreatePlayerBoardForGroup).mockRejectedValueOnce(new GroupAccessError() as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/board"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(404);
  });

  it("returns 409 when board template has not been configured", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getOrCreatePlayerBoardForGroup).mockRejectedValueOnce(
      new GroupBoardTemplateMissingError("A board template must be configured before player boards can be generated.") as never
    );

    const response = await GET(new Request("http://localhost/api/groups/group-1/board"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(409);
  });

  it("returns 500 on unexpected failures", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getOrCreatePlayerBoardForGroup).mockRejectedValueOnce(new Error("db down") as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/board"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("returns board payload with generated timestamp", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date("2026-08-28T00:00:00.000Z"),
      squares: [],
      stats: {
        score: 3,
        bingoCount: 1,
        blackout: false
      }
    } as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/board"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { generatedAt?: string };
    expect(body.generatedAt).toBeDefined();
  });
});

describe("PATCH /api/groups/[groupId]/board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({ position: 3, isMarked: true })
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(updatePlayerBoardMark).mockRejectedValueOnce(new ZodError());

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({})
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the board square cannot be found", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(updatePlayerBoardMark).mockRejectedValueOnce(new PlayerBoardSquareNotFoundError() as never);

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({ position: 2, isMarked: true })
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 when a board cannot be generated yet", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(updatePlayerBoardMark).mockRejectedValueOnce(
      new GroupBoardTemplateMissingError("A board template must be configured before player boards can be generated.") as never
    );

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({ position: 2, isMarked: true })
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(409);
  });

  it("returns 200 and result for successful updates", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(updatePlayerBoardMark).mockResolvedValueOnce({ position: 4, isMarked: true } as never);

    const payload = { position: 4, isMarked: true };

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
      { params: { groupId: "group-1" } }
    );

    expect(updatePlayerBoardMark).toHaveBeenCalledWith("user-1", "group-1", payload);
    expect(response.status).toBe(200);
  });

  it("returns 500 for unexpected failures", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(updatePlayerBoardMark).mockRejectedValueOnce(new Error("db down"));

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({ position: 4, isMarked: true })
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(500);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("returns 429 when board mark rate limit is exceeded", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(enforceRateLimit).mockImplementationOnce(() => {
      throw new RateLimitExceededError(9);
    });

    const response = await PATCH(
      new Request("http://localhost/api/groups/group-1/board", {
        method: "PATCH",
        body: JSON.stringify({ position: 4, isMarked: true })
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("9");
    expect(updatePlayerBoardMark).not.toHaveBeenCalled();
  });
});