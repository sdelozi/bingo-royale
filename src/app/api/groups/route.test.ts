import { ZodError } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getAuthSession } from "@/server/auth/session";
import { createGroupForUser } from "@/server/services/groups/create-group";

vi.mock("@/server/auth/session", () => ({
  getAuthSession: vi.fn()
}));

vi.mock("@/server/services/groups/create-group", () => ({
  createGroupForUser: vi.fn()
}));

describe("POST /api/groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no authenticated user exists", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: "Trip" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates a group for authenticated users", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(createGroupForUser).mockResolvedValueOnce({ id: "group-1", name: "Trip" } as never);

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: "Trip" })
      })
    );

    expect(createGroupForUser).toHaveBeenCalledWith("user-1", { name: "Trip" });
    expect(response.status).toBe(201);
  });

  it("returns 400 for invalid group payload", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(createGroupForUser).mockRejectedValueOnce(new ZodError([]));

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: "" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 500 on unexpected failures", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(createGroupForUser).mockRejectedValueOnce(new Error("db is down"));

    const response = await POST(
      new Request("http://localhost/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: "Trip" })
      })
    );

    expect(response.status).toBe(500);
  });
});
