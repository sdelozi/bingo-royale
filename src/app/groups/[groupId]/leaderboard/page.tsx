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
      <main className="ui-stack ui-page">
        <header className="ui-page-header">
          <h1 className="ui-page-title">{leaderboard.groupName} leaderboard</h1>
          <p className="ui-page-subtitle">Track standings, scores, and completed blackout boards in one place.</p>
        </header>
        <nav className="ui-tab-row" aria-label="Group navigation">
          <Link className="ui-tab-link" href={`/groups/${leaderboard.groupId}`}>Details</Link>
          <Link className="ui-tab-link" href={`/groups/${leaderboard.groupId}/board`}>Board</Link>
          <Link className="ui-tab-link is-active" href={`/groups/${leaderboard.groupId}/leaderboard`}>Leaderboard</Link>
        </nav>

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
