import { ZodError } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getAuthSession } from "@/server/auth/session";
import { GroupNotFoundError, joinGroupForUser } from "@/server/services/groups/join-group";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/join-group", () => ({
  joinGroupForUser: vi.fn(),
  GroupNotFoundError: class GroupNotFoundError extends Error {}
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
});
