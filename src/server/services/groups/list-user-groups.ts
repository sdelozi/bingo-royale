import { db } from "@/server/db/client";

export async function listGroupsForUser(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
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
    },
    orderBy: {
      joinedAt: "desc"
    }
  });

  return memberships.map((membership) => {
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
  });
}
