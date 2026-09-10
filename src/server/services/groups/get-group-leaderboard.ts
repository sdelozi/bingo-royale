import { MembershipRole } from "@prisma/client";
import { calculateScore, countBingos, isBlackout } from "@/lib/bingo";
import { getOptionalBooleanEnv } from "@/server/config/env-helpers";
import { db } from "@/server/db/client";
import { GROUP_OBJECTIVE_COUNT, GroupAccessError } from "./template-management";

const enableFourCornersScoring = getOptionalBooleanEnv("NEXT_PUBLIC_ENABLE_FOUR_CORNERS_SCORING");

type LeaderboardBoard = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  firstBingoAt: Date | null;
  firstBlackoutAt: Date | null;
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
  hasFirstBingoBadge: boolean;
  hasFirstBlackoutBadge: boolean;
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
    score: calculateScore(marks, { enableFourCornersScoring }),
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
              updatedAt: true,
              firstBingoAt: true,
              firstBlackoutAt: true,
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

  const rowsWithAchievements = memberships.map((member) => {
    const board = member.user.boards[0];
    const stats = mapBoardStats(board);
    const achievedAt = board?.updatedAt ?? member.joinedAt;

    return {
      userId: member.user.id,
      displayName: member.user.name?.trim() || member.user.email,
      role: member.role,
      joinedAt: member.joinedAt,
      achievedAt,
      score: stats.score,
      bingoCount: stats.bingoCount,
      blackout: stats.blackout,
      firstBingoAt: stats.bingoCount > 0 ? (board?.firstBingoAt ?? null) : null,
      firstBlackoutAt: stats.blackout ? (board?.firstBlackoutAt ?? null) : null,
      boardHref: board ? `/groups/${groupId}/boards/${member.user.id}` : null
    };
  });

  const earliestBingoAt = findEarliestTimestamp(rowsWithAchievements.map((row) => row.firstBingoAt));
  const earliestBlackoutAt = findEarliestTimestamp(rowsWithAchievements.map((row) => row.firstBlackoutAt));

  const rows = rowsWithAchievements
    .sort((left, right) => {
      if (left.blackout !== right.blackout) {
        return Number(right.blackout) - Number(left.blackout);
      }

      if (right.bingoCount !== left.bingoCount) {
        return right.bingoCount - left.bingoCount;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.achievedAt.getTime() - right.achievedAt.getTime();
    })
    .map(({ achievedAt: _achievedAt, firstBingoAt, firstBlackoutAt, ...row }) => ({
      ...row,
      hasFirstBingoBadge: isEarliestTimestamp(firstBingoAt, earliestBingoAt),
      hasFirstBlackoutBadge: isEarliestTimestamp(firstBlackoutAt, earliestBlackoutAt)
    }) satisfies GroupLeaderboardRow);

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    generatedAt: new Date(),
    rows
  };
}

function findEarliestTimestamp(timestamps: Array<Date | null>): Date | null {
  return timestamps.reduce<Date | null>((earliest, current) => {
    if (!current) {
      return earliest;
    }

    return !earliest || current.getTime() < earliest.getTime() ? current : earliest;
  }, null);
}

function isEarliestTimestamp(timestamp: Date | null, earliest: Date | null): boolean {
  return Boolean(timestamp && earliest && timestamp.getTime() === earliest.getTime());
}
