import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGroupsForUser } from "./list-user-groups";
import { db } from "@/server/db/client";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findMany: vi.fn()
    }
  }
}));

describe("listGroupsForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps memberships into UI-friendly group rows", async () => {
    const joinedAt = new Date("2026-08-27T00:00:00.000Z");
    const createdAt = new Date("2026-08-26T00:00:00.000Z");

    vi.mocked(db.membership.findMany).mockResolvedValueOnce([
      {
        role: MembershipRole.ADMIN,
        joinedAt,
        group: {
          id: "group-1",
          name: "Weekend Trip",
          inviteCode: "ABCD2345",
          shareToken: "share-token",
          creatorId: "user-1",
          createdAt
        }
      }
    ] as never);

    const result = await listGroupsForUser("user-1");

    expect(result).toEqual([
      {
        groupId: "group-1",
        groupName: "Weekend Trip",
        inviteCode: "ABCD2345",
        shareToken: "share-token",
        role: MembershipRole.ADMIN,
        joinedAt,
        createdAt,
        isCreator: true
      }
    ]);
  });
});
