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
        <div className="ui-panel-title-row">
          <p className="ui-card-title">Group details</p>
          <span className={`ui-badge ${membership.role === "ADMIN" ? "is-admin" : "is-player"}`}>{membership.role}</span>
        </div>
        <div className="ui-meta-grid">
          <p className="ui-meta-item">
            <span className="ui-meta-key">Invite code</span>
            <span className="ui-meta-value">{canManageTemplate ? membership.inviteCode : "Admin only"}</span>
          </p>
          <p className="ui-meta-item">
            <span className="ui-meta-key">Share link</span>
            <span className="ui-meta-value">{canManageTemplate ? (shareLink ?? "Not available") : "Admin only"}</span>
          </p>
        </div>
      </section>

      <div className="ui-actions">
        <Link className="ui-link-button" href={`/groups/${membership.groupId}/board`}>Open your board</Link>
        <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${membership.groupId}/leaderboard`}>View leaderboard</Link>
      </div>

      {canManageTemplate ? (
        <section className="ui-panel">
          <div className="ui-panel-title-row">
            <p className="ui-card-title">Admin actions</p>
          </div>
          <p className="ui-card-copy ui-muted">Manage board configuration and sharing details.</p>
          <div className="ui-actions">
            <Link className="ui-link-button" href={`/groups/${membership.groupId}/template`}>Edit board template</Link>
          </div>
        </section>
      ) : (
        <p className="ui-muted">Use your board to mark progress and check standings in the leaderboard.</p>
      )}

      <div className="ui-actions">
        <Link className="ui-link-button ui-link-button-secondary" href="/groups">Back to groups</Link>
      </div>
    </main>
  );
}
