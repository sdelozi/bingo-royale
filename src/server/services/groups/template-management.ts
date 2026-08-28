import { MembershipRole } from "@prisma/client";
import { ZodError, z } from "zod";
import { db } from "@/server/db/client";

const GROUP_OBJECTIVE_COUNT = 25;
const FREE_SPACE_POSITION = 12;
const REGULAR_OBJECTIVE_COUNT = GROUP_OBJECTIVE_COUNT - 1;

const saveTemplateSchema = z.object({
  freeSpaceObjective: z.string().trim().min(1).max(140),
  objectives: z
    .array(z.string().trim().min(1).max(140))
    .length(REGULAR_OBJECTIVE_COUNT, `Exactly ${REGULAR_OBJECTIVE_COUNT} non-free-space objectives are required.`),
  freeSpaceMarkedByDefault: z.boolean().default(false),
  warningAcknowledged: z.boolean().default(false)
});

export class GroupAccessError extends Error {
  constructor() {
    super("Group not found for user.");
    this.name = "GroupAccessError";
  }
}

export class GroupForbiddenError extends Error {
  constructor() {
    super("Only group admins can manage templates.");
    this.name = "GroupForbiddenError";
  }
}

export class TemplateEditConfirmationRequiredError extends Error {
  impactedBoardCount: number;

  constructor(impactedBoardCount: number) {
    super("Saving template edits now will affect in-progress boards. Confirm to continue.");
    this.name = "TemplateEditConfirmationRequiredError";
    this.impactedBoardCount = impactedBoardCount;
  }
}

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

type TemplateObjectiveSnapshot = {
  id: string;
  ordinal: number;
  content: string;
};

export function parseTemplateInput(rawInput: unknown): SaveTemplateInput {
  return saveTemplateSchema.parse(rawInput);
}

export function buildTemplateObjectives(input: SaveTemplateInput) {
  const regularObjectives = [...input.objectives];

  return Array.from({ length: GROUP_OBJECTIVE_COUNT }, (_, ordinal) => {
    if (ordinal === FREE_SPACE_POSITION) {
      return {
        ordinal,
        content: input.freeSpaceObjective,
        isFreeSpace: true
      };
    }

    const content = regularObjectives.shift();

    if (!content) {
      throw new Error("Missing objective content while building template.");
    }

    return {
      ordinal,
      content,
      isFreeSpace: false
    };
  });
}

export function getChangedObjectiveOrdinals(
  previousObjectives: TemplateObjectiveSnapshot[],
  nextObjectives: TemplateObjectiveSnapshot[]
) {
  const previousByOrdinal = new Map(previousObjectives.map((objective) => [objective.ordinal, objective]));

  return nextObjectives
    .filter((objective) => {
      const previous = previousByOrdinal.get(objective.ordinal);

      if (!previous) {
        return true;
      }

      return previous.content !== objective.content;
    })
    .map((objective) => objective.ordinal);
}

async function syncExistingBoardsForTemplateEdit(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  groupId: string,
  previousObjectives: TemplateObjectiveSnapshot[],
  nextObjectives: TemplateObjectiveSnapshot[]
) {
  const previousByOrdinal = new Map(previousObjectives.map((objective) => [objective.ordinal, objective]));
  const changedOrdinals = new Set(getChangedObjectiveOrdinals(previousObjectives, nextObjectives));
  let remappedSquareCount = 0;

  for (const nextObjective of nextObjectives) {
    const previousObjective = previousByOrdinal.get(nextObjective.ordinal);

    if (!previousObjective || previousObjective.id === nextObjective.id) {
      continue;
    }

    const remapResult = await tx.playerBoardSquare.updateMany({
      where: {
        playerBoard: {
          groupId
        },
        objectiveId: previousObjective.id
      },
      data: {
        objectiveId: nextObjective.id
      }
    });

    remappedSquareCount += remapResult.count;
  }

  return {
    changedOrdinals: Array.from(changedOrdinals).sort((left, right) => left - right),
    remappedSquareCount
  };
}

export async function getGroupTemplateEditorData(userId: string, groupId: string) {
  const membership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    },
    include: {
      group: {
        include: {
          _count: {
            select: {
              boards: true
            }
          },
          currentTemplate: {
            include: {
              objectives: {
                orderBy: {
                  ordinal: "asc"
                }
              }
            }
          }
        }
      }
    }
  });

  if (!membership) {
    throw new GroupAccessError();
  }

  if (membership.role !== MembershipRole.ADMIN) {
    throw new GroupForbiddenError();
  }

  const template = membership.group.currentTemplate;

  if (!template) {
    return {
      groupId: membership.group.id,
      groupName: membership.group.name,
      currentVersion: 0,
      freeSpaceObjective: "Free space",
      objectives: Array.from({ length: REGULAR_OBJECTIVE_COUNT }, () => ""),
      freeSpaceMarkedByDefault: false,
      hasExistingBoards: membership.group._count.boards > 0
    };
  }

  const freeSpaceObjective = template.objectives.find((objective) => objective.isFreeSpace);
  const regularObjectives = template.objectives.filter((objective) => !objective.isFreeSpace);

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    currentVersion: template.version,
    freeSpaceObjective: freeSpaceObjective?.content ?? "Free space",
    objectives: regularObjectives.map((objective) => objective.content),
    freeSpaceMarkedByDefault: template.freeSpaceMarkedByDefault,
    hasExistingBoards: membership.group._count.boards > 0
  };
}

export async function saveGroupTemplateForGroup(userId: string, groupId: string, rawInput: unknown) {
  const input = parseTemplateInput(rawInput);
  const objectives = buildTemplateObjectives(input);

  const membership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    },
    select: {
      role: true
    }
  });

  if (!membership) {
    throw new GroupAccessError();
  }

  if (membership.role !== MembershipRole.ADMIN) {
    throw new GroupForbiddenError();
  }

  const boardCount = await db.playerBoard.count({ where: { groupId } });

  if (boardCount > 0 && !input.warningAcknowledged) {
    throw new TemplateEditConfirmationRequiredError(boardCount);
  }

  return db.$transaction(async (tx) => {
    const [latestTemplate, activeTemplate] = await Promise.all([
      tx.boardTemplate.findFirst({
        where: { groupId },
        orderBy: {
          version: "desc"
        },
        select: {
          version: true
        }
      }),
      tx.boardTemplate.findFirst({
        where: {
          groupId,
          isActive: true
        },
        select: {
          id: true,
          objectives: {
            orderBy: {
              ordinal: "asc"
            },
            select: {
              id: true,
              ordinal: true,
              content: true
            }
          }
        }
      })
    ]);

    await tx.boardTemplate.updateMany({
      where: {
        groupId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    const template = await tx.boardTemplate.create({
      data: {
        groupId,
        version: (latestTemplate?.version ?? 0) + 1,
        isActive: true,
        freeSpaceMarkedByDefault: input.freeSpaceMarkedByDefault,
        objectives: {
          create: objectives
        }
      },
      include: {
        objectives: {
          orderBy: {
            ordinal: "asc"
          }
        }
      }
    });

    let syncSummary: {
      changedOrdinals: number[];
      remappedSquareCount: number;
    } | null = null;

    if (activeTemplate && boardCount > 0) {
      syncSummary = await syncExistingBoardsForTemplateEdit(tx, groupId, activeTemplate.objectives, template.objectives);
      await tx.boardEditEvent.create({
        data: {
          groupId,
          actorUserId: userId,
          templateFromId: activeTemplate.id,
          templateToId: template.id,
          warningAcked: input.warningAcknowledged,
          metadataJson: JSON.stringify({
            changedOrdinals: syncSummary.changedOrdinals,
            remappedSquareCount: syncSummary.remappedSquareCount,
            markStatePreservedOnReplacedObjectives: true,
            affectedBoardCount: boardCount,
            statsRecomputeRequired: syncSummary.changedOrdinals.length > 0
          })
        }
      });
    }

    await tx.group.update({
      where: { id: groupId },
      data: {
        currentTemplateId: template.id
      }
    });

    return {
      templateId: template.id,
      version: template.version,
      objectiveCount: template.objectives.length,
      freeSpacePosition: FREE_SPACE_POSITION,
      freeSpaceMarkedByDefault: template.freeSpaceMarkedByDefault,
      affectedBoardCount: boardCount,
      changedObjectiveCount: syncSummary?.changedOrdinals.length ?? 0,
      replacedObjectiveMarkStatePolicy: "preserve" as const,
      statsRecomputeRequired: (syncSummary?.changedOrdinals.length ?? 0) > 0
    };
  });
}

export { GROUP_OBJECTIVE_COUNT, FREE_SPACE_POSITION, REGULAR_OBJECTIVE_COUNT, ZodError };
