import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { env } from "@/server/config/env";
import { getCurrentUser } from "@/server/auth/session";
import { getUserGroup } from "@/server/services/groups/get-user-group";

type GroupDetailPageProps = {
  params: {
    groupId: string;
  };
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const membership = await getUserGroup(user.id, params.groupId);

  if (!membership) {
    notFound();
  }

  const canManageTemplate = membership.role === "ADMIN";
  const shareLink = canManageTemplate && membership.shareToken ? `${env.appUrl}/join/${membership.shareToken}` : null;

  return (
    <main>
      <h1>{membership.groupName}</h1>
      <p>Role: {membership.role}</p>
      <p>Invite code: {canManageTemplate ? membership.inviteCode : "Admin only"}</p>
      <p>Share link: {canManageTemplate ? (shareLink ?? "Not available") : "Admin only"}</p>

      <p>
        <Link href={`/groups/${membership.groupId}/board`}>Open your board</Link>
      </p>

      <p>
        <Link href={`/groups/${membership.groupId}/leaderboard`}>View leaderboard</Link>
      </p>

      {canManageTemplate ? (
        <>
          <p>Admin actions: manage board configuration and group settings.</p>
          <p>
            <Link href={`/groups/${membership.groupId}/template`}>Edit board template</Link>
          </p>
        </>
      ) : (
        <p>Player actions: play your board and check live standings from the leaderboard.</p>
      )}

      <p>
        <Link href="/groups">Back to groups</Link>
      </p>
    </main>
  );
}
