import { ZodError, z } from "zod";
import { countBingos, isBlackout } from "@/lib/bingo";
import { db } from "@/server/db/client";
import {
  GROUP_OBJECTIVE_COUNT,
  GroupAccessError
} from "./template-management";
import {
  GroupBoardTemplateMissingError,
  getOrCreatePlayerBoardForGroup
} from "./player-board";

const updateBoardMarkSchema = z.object({
  position: z.number().int().min(0).max(GROUP_OBJECTIVE_COUNT - 1),
  isMarked: z.boolean()
});

export class PlayerBoardSquareNotFoundError extends Error {
  constructor() {
    super("Board square not found.");
    this.name = "PlayerBoardSquareNotFoundError";
  }
}

export type UpdateBoardMarkInput = z.infer<typeof updateBoardMarkSchema>;

export function parseUpdateBoardMarkInput(rawInput: unknown): UpdateBoardMarkInput {
  return updateBoardMarkSchema.parse(rawInput);
}

export async function updatePlayerBoardMark(userId: string, groupId: string, rawInput: unknown) {
  const input = parseUpdateBoardMarkInput(rawInput);
  const board = await getOrCreatePlayerBoardForGroup(userId, groupId);

  const square = await db.playerBoardSquare.findUnique({
    where: {
      playerBoardId_position: {
        playerBoardId: board.boardId,
        position: input.position
      }
    },
    include: {
      objective: {
        select: {
          isFreeSpace: true,
          content: true
        }
      },
      mark: {
        select: {
          id: true,
          isMarked: true
        }
      }
    }
  });

  if (!square) {
    throw new PlayerBoardSquareNotFoundError();
  }

  const mark = await db.playerMark.upsert({
    where: {
      playerBoardSquareId: square.id
    },
    update: {
      isMarked: input.isMarked,
      userId
    },
    create: {
      playerBoardSquareId: square.id,
      userId,
      isMarked: input.isMarked
    }
  });

  await syncFirstAchievementTimestamps(groupId, userId);

  return {
    boardId: board.boardId,
    position: input.position,
    isMarked: mark.isMarked,
    content: square.objective.content,
    isFreeSpace: square.objective.isFreeSpace
  };
}

// Awards "first bingo"/"first blackout" to whichever currently-qualifying board reached that
// state earliest; badges are cleared here and recomputed at read time in the leaderboard.
async function syncFirstAchievementTimestamps(groupId: string, userId: string): Promise<void> {
  const boardWithMarks = await db.playerBoard.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: {
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
  });

  if (!boardWithMarks) {
    return;
  }

  const marks = Array.from({ length: GROUP_OBJECTIVE_COUNT }, () => false);

  for (const square of boardWithMarks.squares) {
    marks[square.position] = square.mark?.isMarked ?? false;
  }

  const hasBingo = countBingos(marks) > 0;
  const hasBlackout = isBlackout(marks);

  const nextFirstBingoAt = hasBingo ? (boardWithMarks.firstBingoAt ?? new Date()) : null;
  const nextFirstBlackoutAt = hasBlackout ? (boardWithMarks.firstBlackoutAt ?? new Date()) : null;

  const bingoChanged = nextFirstBingoAt?.getTime() !== boardWithMarks.firstBingoAt?.getTime();
  const blackoutChanged = nextFirstBlackoutAt?.getTime() !== boardWithMarks.firstBlackoutAt?.getTime();

  if (!bingoChanged && !blackoutChanged) {
    return;
  }

  await db.playerBoard.update({
    where: { groupId_userId: { groupId, userId } },
    data: {
      firstBingoAt: nextFirstBingoAt,
      firstBlackoutAt: nextFirstBlackoutAt
    }
  });
}

export {
  GroupAccessError,
  GroupBoardTemplateMissingError,
  ZodError
};