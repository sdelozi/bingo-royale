import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthSession } from "@/server/auth/session";
import {
  GroupBoardTemplateMissingError,
  PlayerBoardSquareNotFoundError,
  ZodError,
  updatePlayerBoardMark
} from "@/server/services/groups/board-marking";
import { PATCH } from "./route";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/board-marking", () => ({
  updatePlayerBoardMark: vi.fn(),
  GroupAccessError: class GroupAccessError extends Error {},
  GroupBoardTemplateMissingError: class GroupBoardTemplateMissingError extends Error {},
  PlayerBoardSquareNotFoundError: class PlayerBoardSquareNotFoundError extends Error {},
  ZodError: class ZodError extends Error {
    issues = [{ message: "Invalid mark update payload." }];
  }
}));

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
});