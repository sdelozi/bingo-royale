import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getRequestOrigin } from "@/server/http/request-origin";
import { getShareOrigin } from "@/server/http/share-origin";
import { getUserGroup } from "@/server/services/groups/get-user-group";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const membership = await getUserGroup(user.id, groupId);

  if (!membership) {
    notFound();
  }

  const canManageTemplate = membership.role === "ADMIN";
  const shareOrigin = getShareOrigin(await getRequestOrigin());
  const shareLink =
    canManageTemplate && membership.shareToken ? `${shareOrigin}/join/${membership.shareToken}` : null;

  return (
    <main className="ui-stack ui-page">
      <header className="ui-page-header">
        <h1 className="ui-page-title">{membership.groupName}</h1>
        <p className="ui-page-subtitle">View invite details and jump quickly between group actions.</p>
      </header>
      <nav className="ui-tab-row" aria-label="Group navigation">
        <Link className="ui-tab-link is-active" href={`/groups/${membership.groupId}`}>Details</Link>
        <Link className="ui-tab-link" href={`/groups/${membership.groupId}/board`}>Board</Link>
        <Link className="ui-tab-link" href={`/groups/${membership.groupId}/leaderboard`}>Leaderboard</Link>
        {canManageTemplate ? <Link className="ui-tab-link" href={`/groups/${membership.groupId}/template`}>Template</Link> : null}
      </nav>

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

      <div className="ui-action-grid" aria-label="Player actions">
        <Link className="ui-action-card" href={`/groups/${membership.groupId}/board`}>
          <p className="ui-action-card-title">Open your board</p>
          <p className="ui-action-card-copy">Mark squares and monitor live score updates.</p>
        </Link>
        <Link className="ui-action-card" href={`/groups/${membership.groupId}/leaderboard`}>
          <p className="ui-action-card-title">View leaderboard</p>
          <p className="ui-action-card-copy">See rank, score, and blackout progress across members.</p>
        </Link>
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
