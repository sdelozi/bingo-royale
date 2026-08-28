import { createHash } from "crypto";
import { db } from "@/server/db/client";
import { FREE_SPACE_POSITION, GROUP_OBJECTIVE_COUNT, GroupAccessError } from "./template-management";

type TemplateObjective = {
  id: string;
  ordinal: number;
  content: string;
  isFreeSpace: boolean;
};

export type PlayerBoardSquareState = {
  position: number;
  content: string;
  isFreeSpace: boolean;
  isMarked: boolean;
};

export type PlayerBoardState = {
  boardId: string;
  groupId: string;
  groupName: string;
  createdAt: Date;
  squares: PlayerBoardSquareState[];
};

type PlayerBoardRecord = {
  id: string;
  createdAt: Date;
  group: {
    id: string;
    name: string;
  };
  squares: Array<{
    position: number;
    objective: {
      content: string;
      isFreeSpace: boolean;
    };
    mark: {
      isMarked: boolean;
    } | null;
  }>;
};

export class GroupBoardTemplateMissingError extends Error {
  constructor() {
    super("A board template must be configured before player boards can be generated.");
    this.name = "GroupBoardTemplateMissingError";
  }
}

function buildSortKey(seed: string, objectiveId: string) {
  return createHash("sha256").update(`${seed}:${objectiveId}`).digest("hex");
}

export function buildDeterministicBoardSquares(objectives: TemplateObjective[], seed: string) {
  if (objectives.length !== GROUP_OBJECTIVE_COUNT) {
    throw new Error(`Exactly ${GROUP_OBJECTIVE_COUNT} objectives are required to generate a player board.`);
  }

  const freeSpaceObjectives = objectives.filter((objective) => objective.isFreeSpace);

  if (freeSpaceObjectives.length !== 1) {
    throw new Error("Exactly one free-space objective is required to generate a player board.");
  }

  const [freeSpaceObjective] = freeSpaceObjectives;
  const shuffledObjectives = objectives
    .filter((objective) => !objective.isFreeSpace)
    .sort((left, right) => {
      const leftKey = buildSortKey(seed, left.id);
      const rightKey = buildSortKey(seed, right.id);

      return leftKey.localeCompare(rightKey) || left.ordinal - right.ordinal;
    });

  let shuffledIndex = 0;

  return Array.from({ length: GROUP_OBJECTIVE_COUNT }, (_, position) => {
    const objective = position === FREE_SPACE_POSITION ? freeSpaceObjective : shuffledObjectives[shuffledIndex++];

    return {
      position,
      objectiveId: objective.id,
      content: objective.content,
      isFreeSpace: objective.isFreeSpace,
      isMarked: false
    };
  });
}

function mapPlayerBoard(record: PlayerBoardRecord) {
  return {
    boardId: record.id,
    groupId: record.group.id,
    groupName: record.group.name,
    createdAt: record.createdAt,
    squares: record.squares.map((square) => ({
      position: square.position,
      content: square.objective.content,
      isFreeSpace: square.objective.isFreeSpace,
      isMarked: square.mark?.isMarked ?? false
    }))
  } satisfies PlayerBoardState;
}

async function findExistingPlayerBoard(userId: string, groupId: string) {
  return db.playerBoard.findUnique({
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
      },
      squares: {
        orderBy: {
          position: "asc"
        },
        include: {
          objective: {
            select: {
              content: true,
              isFreeSpace: true
            }
          },
          mark: {
            select: {
              isMarked: true
            }
          }
        }
      }
    }
  }) as Promise<PlayerBoardRecord | null>;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function getOrCreatePlayerBoardForGroup(userId: string, groupId: string) {
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
          name: true,
          currentTemplateId: true
        }
      }
    }
  });

  if (!membership) {
    throw new GroupAccessError();
  }

  const existingBoard = await findExistingPlayerBoard(userId, groupId);

  if (existingBoard) {
    return mapPlayerBoard(existingBoard);
  }

  if (!membership.group.currentTemplateId) {
    throw new GroupBoardTemplateMissingError();
  }

  try {
    return await db.$transaction(async (tx) => {
      const persistedBoard = await tx.playerBoard.findUnique({
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
          },
          squares: {
            orderBy: {
              position: "asc"
            },
            include: {
              objective: {
                select: {
                  content: true,
                  isFreeSpace: true
                }
              },
              mark: {
                select: {
                  isMarked: true
                }
              }
            }
          }
        }
      });

      if (persistedBoard) {
        return mapPlayerBoard(persistedBoard as PlayerBoardRecord);
      }

      const group = await tx.group.findUnique({
        where: {
          id: groupId
        },
        select: {
          id: true,
          name: true,
          currentTemplate: {
            select: {
              id: true,
              freeSpaceMarkedByDefault: true,
              objectives: {
                orderBy: {
                  ordinal: "asc"
                }
              }
            }
          }
        }
      });

      if (!group?.currentTemplate) {
        throw new GroupBoardTemplateMissingError();
      }

      const boardSquares = buildDeterministicBoardSquares(
        group.currentTemplate.objectives,
        `${groupId}:${userId}:${group.currentTemplate.id}`
      );

      const createdBoard = await tx.playerBoard.create({
        data: {
          groupId,
          userId,
          squares: {
            create: boardSquares.map((square) => ({
              position: square.position,
              objectiveId: square.objectiveId,
              ...(square.isFreeSpace && group.currentTemplate.freeSpaceMarkedByDefault
                ? {
                    mark: {
                      create: {
                        userId,
                        isMarked: true
                      }
                    }
                  }
                : {})
            }))
          }
        },
        include: {
          group: {
            select: {
              id: true,
              name: true
            }
          },
          squares: {
            orderBy: {
              position: "asc"
            },
            include: {
              objective: {
                select: {
                  content: true,
                  isFreeSpace: true
                }
              },
              mark: {
                select: {
                  isMarked: true
                }
              }
            }
          }
        }
      });

      return mapPlayerBoard(createdBoard as PlayerBoardRecord);
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const persistedBoard = await findExistingPlayerBoard(userId, groupId);

      if (persistedBoard) {
        return mapPlayerBoard(persistedBoard);
      }
    }

    throw error;
  }
}