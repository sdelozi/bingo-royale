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
    <main className="ui-stack">
      <h1>Dashboard</h1>
      <p className="ui-muted">Signed in as {user.name ?? user.email}.</p>

      <section className="ui-panel">
        <h2>Your groups</h2>
        {groups.length === 0 ? (
          <p className="ui-empty-state">You are not in any groups yet. Go to groups to create or join one.</p>
        ) : (
          <ul className="ui-list">
            {groups.map((group) => (
              <li key={group.groupId} className="ui-list-item">
                <p>
                  <strong>{group.groupName}</strong> - {group.role}
                </p>
                <p>
                  <Link href={`/groups/${group.groupId}`}>
                    {getGroupDashboardActionLabel(group.isCreator)}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="ui-actions">
        <Link href="/groups">Go to groups</Link>
        <Link href="/">Back home</Link>
      </div>
      <SignOutButton />
    </main>
  );
}