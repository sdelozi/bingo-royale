import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupDashboardActionLabel } from "@/server/services/groups/get-group-dashboard-action";
import { listGroupsForUser } from "@/server/services/groups/list-user-groups";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const groups = await listGroupsForUser(user.id);

  return (
    <main className="ui-stack ui-page">
      <header className="ui-page-header">
        <h1 className="ui-page-title">Dashboard</h1>
        <p className="ui-page-subtitle">Signed in as {user.name ?? user.email}.</p>
      </header>

      <section className="ui-panel">
        <h2>Your groups</h2>
        {groups.length === 0 ? (
          <p className="ui-empty-state">You are not in any groups yet. Go to groups to create or join one.</p>
        ) : (
          <ul className="ui-list">
            {groups.map((group) => (
              <li key={group.groupId} className="ui-list-item">
                <div className="ui-stack-tight">
                  <div className="ui-panel-title-row">
                    <p className="ui-card-title">{group.groupName}</p>
                    <span className={`ui-badge ${group.role === "ADMIN" ? "is-admin" : "is-player"}`}>{group.role}</span>
                  </div>
                  <p className="ui-card-copy ui-muted">Open the group, jump into your board, or check current standings.</p>
                  <div className="ui-actions">
                    <Link className="ui-link-button" href={`/groups/${group.groupId}`}>
                      {getGroupDashboardActionLabel(group.isCreator)}
                    </Link>
                    <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${group.groupId}/board`}>
                      Open board
                    </Link>
                    <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${group.groupId}/leaderboard`}>
                      View leaderboard
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="ui-actions">
        <Link className="ui-link-button" href="/groups">Go to groups</Link>
        <Link className="ui-link-button ui-link-button-secondary" href="/">Back home</Link>
      </div>
      <SignOutButton />
    </main>
  );
}