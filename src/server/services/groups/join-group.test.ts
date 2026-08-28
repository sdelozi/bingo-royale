import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import { GroupNotFoundError, joinGroupForUser } from "./join-group";

vi.mock("@/server/db/client", () => ({
  db: {
    group: {
      findUnique: vi.fn()
    },
    membership: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));

describe("joinGroupForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("joins by invite code and creates membership", async () => {
    const joinedAt = new Date();
    const createdAt = new Date();

    vi.mocked(db.group.findUnique).mockResolvedValueOnce({
      id: "group-1",
      name: "Trip",
      inviteCode: "ABCD2345",
      shareToken: "token",
      creatorId: "user-admin",
      createdAt
    } as never);

    vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(db.membership.create).mockResolvedValueOnce({
      role: MembershipRole.PLAYER,
      joinedAt
    } as never);

    const result = await joinGroupForUser("user-1", { inviteCode: "abcd2345" });

    expect(db.group.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { inviteCode: "ABCD2345" } })
    );
    expect(result.alreadyMember).toBe(false);
    expect(result.role).toBe(MembershipRole.PLAYER);
  });

  it("returns already member when membership exists", async () => {
    const joinedAt = new Date();

    vi.mocked(db.group.findUnique).mockResolvedValueOnce({
      id: "group-1",
      name: "Trip",
      inviteCode: "ABCD2345",
      shareToken: "token",
      creatorId: "user-1",
      createdAt: new Date()
    } as never);

    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      role: MembershipRole.ADMIN,
      joinedAt
    } as never);

    const result = await joinGroupForUser("user-1", { shareToken: "token" });

    expect(db.membership.create).not.toHaveBeenCalled();
    expect(result.alreadyMember).toBe(true);
    expect(result.isCreator).toBe(true);
  });

  it("throws not found when group does not exist", async () => {
    vi.mocked(db.group.findUnique).mockResolvedValueOnce(null as never);

    await expect(joinGroupForUser("user-1", { inviteCode: "NONE" })).rejects.toBeInstanceOf(
      GroupNotFoundError
    );
  });

  it("rejects invalid payload", async () => {
    await expect(joinGroupForUser("user-1", {})).rejects.toThrow();
  });
});
