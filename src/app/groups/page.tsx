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
    <main className="ui-stack">
      <h1>Groups</h1>
      <p className="ui-muted">Create or join groups, then open your board and leaderboard.</p>

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
                    <div className="ui-actions">
                      <Link className="ui-link-button" href={`/groups/${group.groupId}`}>
                        {group.isCreator ? "Manage group" : "Open group"}
                      </Link>
                      <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${group.groupId}/board`}>
                        Open board
                      </Link>
                      <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${group.groupId}/leaderboard`}>
                        View leaderboard
                      </Link>
                      {group.role === "ADMIN" ? (
                        <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${group.groupId}/template`}>
                          Edit template
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
