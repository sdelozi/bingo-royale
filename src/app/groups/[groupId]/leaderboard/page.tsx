import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupLeaderboardLiveTable } from "@/components/groups/group-leaderboard-live-table";
import { getCurrentUser } from "@/server/auth/session";
import { getGroupLeaderboardForUser } from "@/server/services/groups/get-group-leaderboard";
import { GroupAccessError } from "@/server/services/groups/template-management";

type GroupLeaderboardPageProps = {
  params: {
    groupId: string;
  };
};

export default async function GroupLeaderboardPage({ params }: GroupLeaderboardPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  try {
    const leaderboard = await getGroupLeaderboardForUser(user.id, params.groupId);

    return (
      <main className="ui-stack">
        <h1>{leaderboard.groupName} leaderboard</h1>
        <p className="ui-muted">Track standings, scores, and completed blackout boards in one place.</p>
        <GroupLeaderboardLiveTable
          groupId={leaderboard.groupId}
          initialRows={leaderboard.rows}
          initialGeneratedAt={leaderboard.generatedAt.toISOString()}
        />

        <div className="ui-actions">
          <Link className="ui-link-button" href={`/groups/${leaderboard.groupId}`}>Back to group</Link>
          <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${leaderboard.groupId}/board`}>Open your board</Link>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupAccessError) {
      notFound();
    }

    throw error;
  }
}
