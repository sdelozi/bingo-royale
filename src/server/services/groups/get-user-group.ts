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

  const canViewInviteCredentials = membership.role === "ADMIN";

  return {
    groupId: membership.group.id,
    groupName: membership.group.name,
    inviteCode: canViewInviteCredentials ? membership.group.inviteCode : null,
    shareToken: canViewInviteCredentials ? membership.group.shareToken : null,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.group.createdAt,
    isCreator: membership.group.creatorId === userId
  };
}
