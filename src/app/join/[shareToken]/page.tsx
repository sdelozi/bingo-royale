import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { GroupNotFoundError, joinGroupForUser } from "@/server/services/groups/join-group";

type JoinBySharePageProps = {
  params: {
    shareToken: string;
  };
};

export default async function JoinBySharePage({ params }: JoinBySharePageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  try {
    const result = await joinGroupForUser(user.id, { shareToken: params.shareToken });

    return (
      <main>
        <h1>{result.alreadyMember ? "Already joined" : "Group joined"}</h1>
        <p>{result.groupName}</p>
        <p>Invite code: {result.inviteCode}</p>
        <p>
          <Link href="/groups">Go to groups</Link>
        </p>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupNotFoundError) {
      return (
        <main>
          <h1>Invalid share link</h1>
          <p>This group link is invalid or expired.</p>
          <p>
            <Link href="/groups">Back to groups</Link>
          </p>
        </main>
      );
    }

    throw error;
  }
}
