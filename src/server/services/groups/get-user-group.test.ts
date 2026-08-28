import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import { getUserGroup } from "./get-user-group";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findUnique: vi.fn()
    }
  }
}));

describe("getUserGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not a group member", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null as never);

    const result = await getUserGroup("user-1", "group-1");

    expect(result).toBeNull();
  });

  it("maps membership details for role-aware pages", async () => {
    const joinedAt = new Date("2026-08-28T00:00:00.000Z");
    const createdAt = new Date("2026-08-27T00:00:00.000Z");

    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      role: MembershipRole.ADMIN,
      joinedAt,
      group: {
        id: "group-1",
        name: "Weekend Trip",
        inviteCode: "ABCD2345",
        shareToken: "token",
        creatorId: "user-1",
        createdAt
      }
    } as never);

    const result = await getUserGroup("user-1", "group-1");

    expect(result).toEqual({
      groupId: "group-1",
      groupName: "Weekend Trip",
      inviteCode: "ABCD2345",
      shareToken: "token",
      role: MembershipRole.ADMIN,
      joinedAt,
      createdAt,
      isCreator: true
    });
  });
});
