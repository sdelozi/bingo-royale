import { db } from "@/server/db/client";

export async function getUserGroup(userId: string, groupId: string) {
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
          inviteCode: true,
          shareToken: true,
          creatorId: true,
          createdAt: true
        }
      }
    }
  });

  if (!membership) {
    return null;
  }

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    inviteCode: membership.group.inviteCode,
    shareToken: membership.group.shareToken,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.group.createdAt,
    isCreator: membership.group.creatorId === userId
  };
}
