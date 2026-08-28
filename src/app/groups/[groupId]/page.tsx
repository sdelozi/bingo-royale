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

  const shareLink = membership.shareToken ? `${env.appUrl}/join/${membership.shareToken}` : null;

  return (
    <main>
      <h1>{membership.groupName}</h1>
      <p>Role: {membership.role}</p>
      <p>Invite code: {membership.inviteCode}</p>
      <p>Share link: {shareLink ?? "Not available"}</p>

      {membership.isCreator ? (
        <>
          <p>Admin actions: manage board configuration and group settings.</p>
          <p>
            <Link href={`/groups/${membership.groupId}/template`}>Edit board template</Link>
          </p>
        </>
      ) : (
        <p>Player actions: play board and view leaderboard (coming next).</p>
      )}

      <p>
        <Link href="/groups">Back to groups</Link>
      </p>
    </main>
  );
}
