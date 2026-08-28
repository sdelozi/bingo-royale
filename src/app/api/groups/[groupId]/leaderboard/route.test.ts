import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getAuthSession } from "@/server/auth/session";
import { getGroupLeaderboardForUser } from "@/server/services/groups/get-group-leaderboard";
import { GroupAccessError } from "@/server/services/groups/template-management";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/get-group-leaderboard", () => ({
  getGroupLeaderboardForUser: vi.fn()
}));

describe("GET /api/groups/[groupId]/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/leaderboard"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(401);
  });

  it("returns leaderboard for authenticated users", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getGroupLeaderboardForUser).mockResolvedValueOnce({
      groupId: "group-1",
      groupName: "Trip",
      generatedAt: new Date("2026-08-28T00:00:00.000Z"),
      rows: []
    } as never);

    const response = await GET(new Request("http://localhost/api/groups/group-1/leaderboard"), {
      params: { groupId: "group-1" }
    });

    expect(getGroupLeaderboardForUser).toHaveBeenCalledWith("user-1", "group-1");
    expect(response.status).toBe(200);
  });

  it("returns 404 for inaccessible groups", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(getGroupLeaderboardForUser).mockRejectedValueOnce(new GroupAccessError());

    const response = await GET(new Request("http://localhost/api/groups/group-1/leaderboard"), {
      params: { groupId: "group-1" }
    });

    expect(response.status).toBe(404);
  });
});
