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
    <main>
      <h1>Groups</h1>
      <p>Create a group and share the invite code or share link.</p>

      <CreateGroupForm />
      <JoinGroupForm />

      <section>
        <h2>Your groups</h2>

        {groups.length === 0 ? (
          <p>You have not joined or created any groups yet.</p>
        ) : (
          <ul>
            {groups.map((group) => {
              const shareLink = group.shareToken ? `${env.appUrl}/join/${group.shareToken}` : null;

              return (
                <li key={group.groupId}>
                  <p>
                    <strong>{group.groupName}</strong>
                  </p>
                  <p>Role: {group.role}</p>
                  <p>Invite code: {group.inviteCode}</p>
                  <p>Share link: {shareLink ?? "Not available"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </main>
  );
}
