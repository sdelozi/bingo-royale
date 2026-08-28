import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getAuthSession } from "@/server/auth/session";
import {
  GroupAccessError,
  GroupForbiddenError,
  ZodError,
  saveGroupTemplateForGroup
} from "@/server/services/groups/template-management";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/template-management", () => ({
  saveGroupTemplateForGroup: vi.fn(),
  GroupAccessError: class GroupAccessError extends Error {},
  GroupForbiddenError: class GroupForbiddenError extends Error {},
  ZodError: class ZodError extends Error {
    issues = [{ message: "Invalid template payload." }];
  }
}));

describe("POST /api/groups/[groupId]/template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await POST(
      new Request("http://localhost/api/groups/group-1/template", {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not an admin", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(saveGroupTemplateForGroup).mockRejectedValueOnce(new GroupForbiddenError());

    const response = await POST(
      new Request("http://localhost/api/groups/group-1/template", {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when group is not found for user", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(saveGroupTemplateForGroup).mockRejectedValueOnce(new GroupAccessError());

    const response = await POST(
      new Request("http://localhost/api/groups/group-1/template", {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid payload", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(saveGroupTemplateForGroup).mockRejectedValueOnce(new ZodError());

    const response = await POST(
      new Request("http://localhost/api/groups/group-1/template", {
        method: "POST",
        body: JSON.stringify({})
      }),
      { params: { groupId: "group-1" } }
    );

    expect(response.status).toBe(400);
  });

  it("returns 200 and result for successful save", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(saveGroupTemplateForGroup).mockResolvedValueOnce({ version: 4 } as never);

    const payload = {
      freeSpaceObjective: "Free space",
      objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceMarkedByDefault: false
    };

    const response = await POST(
      new Request("http://localhost/api/groups/group-1/template", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
      { params: { groupId: "group-1" } }
    );

    expect(saveGroupTemplateForGroup).toHaveBeenCalledWith("user-1", "group-1", payload);
    expect(response.status).toBe(200);
  });
});
