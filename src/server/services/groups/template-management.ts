import { MembershipRole } from "@prisma/client";
import { ZodError, z } from "zod";
import { db } from "@/server/db/client";

const GROUP_OBJECTIVE_COUNT = 25;

const saveTemplateSchema = z.object({
  objectives: z
    .array(z.string().trim().min(1).max(140))
    .length(GROUP_OBJECTIVE_COUNT, `Exactly ${GROUP_OBJECTIVE_COUNT} objectives are required.`),
  freeSpaceOrdinal: z.number().int().min(0).max(GROUP_OBJECTIVE_COUNT - 1)
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

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

export function parseTemplateInput(rawInput: unknown): SaveTemplateInput {
  return saveTemplateSchema.parse(rawInput);
}

export function buildTemplateObjectives(input: SaveTemplateInput) {
  return input.objectives.map((content, ordinal) => ({
    ordinal,
    content,
    isFreeSpace: ordinal === input.freeSpaceOrdinal
  }));
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
      objectives: Array.from({ length: GROUP_OBJECTIVE_COUNT }, () => ""),
      freeSpaceOrdinal: 12
    };
  }

  const freeSpaceObjective = template.objectives.find((objective) => objective.isFreeSpace);

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    currentVersion: template.version,
    objectives: template.objectives.map((objective) => objective.content),
    freeSpaceOrdinal: freeSpaceObjective?.ordinal ?? 12
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

  return db.$transaction(async (tx) => {
    const latestTemplate = await tx.boardTemplate.findFirst({
      where: { groupId },
      orderBy: {
        version: "desc"
      },
      select: {
        version: true
      }
    });

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
      freeSpaceOrdinal: input.freeSpaceOrdinal
    };
  });
}

export { GROUP_OBJECTIVE_COUNT, ZodError };
