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
          <p>You have not joined or created any groups yet.</p>
        ) : (
          <ul className="ui-list">
            {groups.map((group) => {
              const canViewInviteCredentials = group.role === "ADMIN";
              const shareLink = canViewInviteCredentials && group.shareToken ? `${env.appUrl}/join/${group.shareToken}` : null;

              return (
                <li key={group.groupId} className="ui-list-item">
                  <p>
                    <strong>{group.groupName}</strong>
                  </p>
                  <p>Role: {group.role}</p>
                  <p>
                    <Link href={`/groups/${group.groupId}`}>
                      {group.isCreator ? "Manage group" : "Open group"}
                    </Link>
                  </p>
                  <p>Invite code: {canViewInviteCredentials ? group.inviteCode : "Admin only"}</p>
                  <p>Share link: {canViewInviteCredentials ? (shareLink ?? "Not available") : "Admin only"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="ui-actions">
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    </main>
  );
}
