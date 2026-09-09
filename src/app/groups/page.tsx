import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { env } from "@/server/config/env";
import { getCurrentUser } from "@/server/auth/session";
import { listGroupsForUser } from "@/server/services/groups/list-user-groups";

export default async function GroupsPage() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const groups = await listGroupsForUser(user.id);

  return (
    <main className="ui-stack ui-page">
      <header className="ui-page-header">
        <h1 className="ui-page-title">Groups</h1>
        <p className="ui-page-subtitle">Create or join groups, then open your board and leaderboard.</p>
      </header>

      <CreateGroupForm />
      <JoinGroupForm />

      <section className="ui-panel">
        <h2>Your groups</h2>

        {groups.length === 0 ? (
          <p className="ui-empty-state">You have not joined or created any groups yet.</p>
        ) : (
          <ul className="ui-list">
            {groups.map((group) => {
              const canViewInviteCredentials = group.role === "ADMIN";
              const shareLink = canViewInviteCredentials && group.shareToken ? `${env.appUrl}/join/${group.shareToken}` : null;

              return (
                <li key={group.groupId} className="ui-list-item">
                  <div className="ui-stack-tight">
                    <div className="ui-panel-title-row">
                      <p className="ui-card-title">{group.groupName}</p>
                      <span className={`ui-badge ${group.role === "ADMIN" ? "is-admin" : "is-player"}`}>{group.role}</span>
                    </div>
                    <div className="ui-meta-grid">
                      <p className="ui-meta-item">
                        <span className="ui-meta-key">Invite code</span>
                        <span className="ui-meta-value">{canViewInviteCredentials ? group.inviteCode : "Admin only"}</span>
                      </p>
                      <p className="ui-meta-item">
                        <span className="ui-meta-key">Share link</span>
                        <span className="ui-meta-value">{canViewInviteCredentials ? (shareLink ?? "Not available") : "Admin only"}</span>
                      </p>
                    </div>
                    <div className="ui-action-grid" aria-label="Group actions">
                      <Link className="ui-action-card" href={`/groups/${group.groupId}`}>
                        <p className="ui-action-card-title">{group.isCreator ? "Manage group" : "Open group"}</p>
                        <p className="ui-action-card-copy">Open details, invite context, and role controls.</p>
                      </Link>
                      <Link className="ui-action-card" href={`/groups/${group.groupId}/board`}>
                        <p className="ui-action-card-title">Open board</p>
                        <p className="ui-action-card-copy">Mark objectives and keep your progress current.</p>
                      </Link>
                      <Link className="ui-action-card" href={`/groups/${group.groupId}/leaderboard`}>
                        <p className="ui-action-card-title">View leaderboard</p>
                        <p className="ui-action-card-copy">Track rank movement, scores, and blackout status.</p>
                      </Link>
                      {group.role === "ADMIN" ? (
                        <Link className="ui-action-card" href={`/groups/${group.groupId}/template`}>
                          <p className="ui-action-card-title">Edit template</p>
                          <p className="ui-action-card-copy">Adjust objectives and free-space behavior safely.</p>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="ui-actions">
        <Link className="ui-link-button ui-link-button-secondary" href="/dashboard">Back to dashboard</Link>
      </div>
    </main>
  );
}
