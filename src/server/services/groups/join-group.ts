import { MembershipRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db/client";

const joinByInviteCodeSchema = z.object({
  inviteCode: z.string().trim().min(1)
});

const joinByShareTokenSchema = z.object({
  shareToken: z.string().trim().min(1)
});

const joinGroupSchema = z.union([joinByInviteCodeSchema, joinByShareTokenSchema]);

export class GroupNotFoundError extends Error {
  constructor() {
    super("Group not found.");
    this.name = "GroupNotFoundError";
  }
}

export async function joinGroupForUser(userId: string, rawInput: unknown) {
  const input = joinGroupSchema.parse(rawInput);

  const group = await db.group.findUnique({
    where:
      "inviteCode" in input
        ? { inviteCode: input.inviteCode.toUpperCase() }
        : { shareToken: input.shareToken },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      shareToken: true,
      creatorId: true,
      createdAt: true
    }
  });

  if (!group) {
    throw new GroupNotFoundError();
  }

  const existingMembership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId
      }
    }
  });

  if (existingMembership) {
    return {
      groupId: group.id,
      groupName: group.name,
      inviteCode: group.inviteCode,
      shareToken: group.shareToken,
      role: existingMembership.role,
      joinedAt: existingMembership.joinedAt,
      createdAt: group.createdAt,
      isCreator: group.creatorId === userId,
      alreadyMember: true
    };
  }

  const membership = await db.membership.create({
    data: {
      groupId: group.id,
      userId,
      role: MembershipRole.PLAYER
    },
    select: {
      role: true,
      joinedAt: true
    }
  });

  return {
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.inviteCode,
    shareToken: group.shareToken,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: group.createdAt,
    isCreator: group.creatorId === userId,
    alreadyMember: false
  };
}
