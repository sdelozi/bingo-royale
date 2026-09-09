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
    <main className="ui-stack">
      <h1>{membership.groupName}</h1>
      <section className="ui-panel">
        <p>Role: {membership.role}</p>
        <p>Invite code: {canManageTemplate ? membership.inviteCode : "Admin only"}</p>
        <p>Share link: {canManageTemplate ? (shareLink ?? "Not available") : "Admin only"}</p>
      </section>

      <div className="ui-actions">
        <Link href={`/groups/${membership.groupId}/board`}>Open your board</Link>
        <Link href={`/groups/${membership.groupId}/leaderboard`}>View leaderboard</Link>
      </div>

      {canManageTemplate ? (
        <section className="ui-panel">
          <p>Admin actions: manage board configuration and group settings.</p>
          <div className="ui-actions">
            <Link href={`/groups/${membership.groupId}/template`}>Edit board template</Link>
          </div>
        </section>
      ) : (
        <p className="ui-muted">Use your board to mark progress and check standings in the leaderboard.</p>
      )}

      <div className="ui-actions">
        <Link href="/groups">Back to groups</Link>
      </div>
    </main>
  );
}
