import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroupForUser } from "./create-group";
import { db } from "@/server/db/client";

vi.mock("@/server/db/client", () => ({
  db: {
    group: {
      create: vi.fn()
    }
  }
}));

describe("createGroupForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a group and assigns creator as admin", async () => {
    const createdAt = new Date();
    vi.mocked(db.group.create).mockResolvedValueOnce({
      id: "group-1",
      name: "Trip Group",
      inviteCode: "ABCD2345",
      shareToken: "abcdef0123456789abcdef0123456789",
      createdAt
    } as never);

    const result = await createGroupForUser("user-1", { name: "  Trip Group  " });

    expect(result.role).toBe(MembershipRole.ADMIN);
    expect(result.name).toBe("Trip Group");

    expect(db.group.create).toHaveBeenCalledTimes(1);
    expect(db.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Trip Group",
          creatorId: "user-1",
          memberships: {
            create: {
              userId: "user-1",
              role: MembershipRole.ADMIN
            }
          }
        })
      })
    );

    const createCallData = vi.mocked(db.group.create).mock.calls[0][0].data as {
      inviteCode: string;
      shareToken: string;
    };

    expect(createCallData.inviteCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    expect(createCallData.shareToken).toMatch(/^[a-f0-9]{32}$/);
  });

  it("retries when a unique constraint collision occurs", async () => {
    vi.mocked(db.group.create)
      .mockRejectedValueOnce({ code: "P2002" } as never)
      .mockResolvedValueOnce({
        id: "group-2",
        name: "Trip",
        inviteCode: "ABCD2345",
        shareToken: "abcdef0123456789abcdef0123456789",
        createdAt: new Date()
      } as never);

    const result = await createGroupForUser("user-1", { name: "Trip" });

    expect(result.id).toBe("group-2");
    expect(db.group.create).toHaveBeenCalledTimes(2);
  });

  it("throws after repeated unique collisions", async () => {
    vi.mocked(db.group.create).mockRejectedValue({ code: "P2002" } as never);

    await expect(createGroupForUser("user-1", { name: "Trip" })).rejects.toThrow(
      "Unable to generate a unique invite code. Please try again."
    );

    expect(db.group.create).toHaveBeenCalledTimes(8);
  });

  it("rejects invalid group names", async () => {
    await expect(createGroupForUser("user-1", { name: " " })).rejects.toThrow();
    expect(db.group.create).not.toHaveBeenCalled();
  });
});
