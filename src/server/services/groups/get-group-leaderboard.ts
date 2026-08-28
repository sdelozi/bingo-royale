import { MembershipRole } from "@prisma/client";
import { calculateScore, countBingos, isBlackout } from "@/lib/bingo";
import { db } from "@/server/db/client";
import { GROUP_OBJECTIVE_COUNT, GroupAccessError } from "./template-management";

type LeaderboardBoard = {
  id: string;
  createdAt: Date;
  squares: Array<{
    position: number;
    mark: {
      isMarked: boolean;
    } | null;
  }>;
};

export type GroupLeaderboardRow = {
  userId: string;
  displayName: string;
  role: MembershipRole;
  joinedAt: Date;
  score: number;
  bingoCount: number;
  blackout: boolean;
  boardHref: string | null;
};

export type GroupLeaderboardState = {
  groupId: string;
  groupName: string;
  generatedAt: Date;
  rows: GroupLeaderboardRow[];
};

function mapBoardStats(board: LeaderboardBoard | undefined) {
  if (!board) {
    return {
      score: 0,
      bingoCount: 0,
      blackout: false
    };
  }

  const marks = Array.from({ length: GROUP_OBJECTIVE_COUNT }, () => false);

  for (const square of board.squares) {
    marks[square.position] = square.mark?.isMarked ?? false;
  }

  return {
    score: calculateScore(marks),
    bingoCount: countBingos(marks),
    blackout: isBlackout(marks)
  };
}

export async function getGroupLeaderboardForUser(userId: string, groupId: string): Promise<GroupLeaderboardState> {
  const membership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    },
    include: {
      group: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!membership) {
    throw new GroupAccessError();
  }

  const memberships = await db.membership.findMany({
    where: {
      groupId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          boards: {
            where: {
              groupId
            },
            select: {
              id: true,
              createdAt: true,
              squares: {
                select: {
                  position: true,
                  mark: {
                    select: {
                      isMarked: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const rows = memberships
    .map((member) => {
      const board = member.user.boards[0];
      const stats = mapBoardStats(board);

      return {
        userId: member.user.id,
        displayName: member.user.name?.trim() || member.user.email,
        role: member.role,
        joinedAt: member.joinedAt,
        score: stats.score,
        bingoCount: stats.bingoCount,
        blackout: stats.blackout,
        boardHref: board ? `/groups/${groupId}/boards/${member.user.id}` : null
      } satisfies GroupLeaderboardRow;
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.bingoCount !== left.bingoCount) {
        return right.bingoCount - left.bingoCount;
      }

      if (left.blackout !== right.blackout) {
        return Number(right.blackout) - Number(left.blackout);
      }

      return left.joinedAt.getTime() - right.joinedAt.getTime();
    });

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    generatedAt: new Date(),
    rows
  };
}
