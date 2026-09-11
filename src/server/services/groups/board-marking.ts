import { ZodError, z } from "zod";
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

  return {
    boardId: board.boardId,
    position: input.position,
    isMarked: mark.isMarked,
    content: square.objective.content,
    isFreeSpace: square.objective.isFreeSpace
  };
}

export {
  GroupAccessError,
  GroupBoardTemplateMissingError,
  ZodError
};