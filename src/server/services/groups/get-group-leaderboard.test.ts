import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import { GroupAccessError } from "./template-management";
import { getGroupLeaderboardForUser } from "./get-group-leaderboard";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

describe("getGroupLeaderboardForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when viewer is not a member", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null as never);

    await expect(getGroupLeaderboardForUser("user-1", "group-1")).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("returns sorted leaderboard rows with derived stats", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      group: {
        id: "group-1",
        name: "Weekend Trip"
      }
    } as never);

    vi.mocked(db.membership.findMany).mockResolvedValueOnce([
      {
        user: {
          id: "u1",
          name: "Alice",
          email: "alice@example.com",
          boards: [
            {
              id: "board-1",
              createdAt: new Date("2026-08-28T00:00:00.000Z"),
              squares: Array.from({ length: 25 }, (_, position) => ({
                position,
                mark: {
                  isMarked: true
                }
              }))
            }
          ]
        },
        role: MembershipRole.PLAYER,
        joinedAt: new Date("2026-08-28T00:00:00.000Z")
      },
      {
        user: {
          id: "u2",
          name: "",
          email: "bob@example.com",
          boards: []
        },
        role: MembershipRole.ADMIN,
        joinedAt: new Date("2026-08-27T00:00:00.000Z")
      }
    ] as never);

    const result = await getGroupLeaderboardForUser("viewer", "group-1");

    expect(result.groupId).toBe("group-1");
    expect(result.groupName).toBe("Weekend Trip");
    expect(result.rows).toEqual([
      {
        userId: "u1",
        displayName: "Alice",
        role: MembershipRole.PLAYER,
        joinedAt: new Date("2026-08-28T00:00:00.000Z"),
        score: 25,
        bingoCount: 12,
        blackout: true,
        boardHref: "/groups/group-1/boards/u1"
      },
      {
        userId: "u2",
        displayName: "bob@example.com",
        role: MembershipRole.ADMIN,
        joinedAt: new Date("2026-08-27T00:00:00.000Z"),
        score: 0,
        bingoCount: 0,
        blackout: false,
        boardHref: null
      }
    ]);
  });
});
