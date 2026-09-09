import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupBoardLivePanel } from "@/components/groups/group-board-live-panel";
import { getCurrentUser } from "@/server/auth/session";
import { GroupAccessError } from "@/server/services/groups/template-management";
import {
  GroupBoardTemplateMissingError,
  getOrCreatePlayerBoardForGroup
} from "@/server/services/groups/player-board";

type GroupBoardPageProps = {
  params: {
    groupId: string;
  };
};

export default async function GroupBoardPage({ params }: GroupBoardPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  try {
    const board = await getOrCreatePlayerBoardForGroup(user.id, params.groupId);

    return (
      <main className="ui-stack">
        <h1>Your board: {board.groupName}</h1>
        <p className="ui-muted">This layout is generated once per player and stays stable over time.</p>
        <GroupBoardLivePanel
          groupId={board.groupId}
          initialSquares={board.squares}
          initialStats={board.stats}
          initialGeneratedAt={new Date().toISOString()}
        />

        <p className="ui-muted">Mark your own board here.</p>
        <div className="ui-actions">
          <Link className="ui-link-button" href={`/groups/${board.groupId}`}>Back to group</Link>
          <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${board.groupId}/leaderboard`}>View leaderboard</Link>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupBoardTemplateMissingError) {
      return (
        <main className="ui-stack">
          <h1>Board unavailable</h1>
          <p className="ui-empty-state">An admin needs to save the group board template before player boards can be generated.</p>
          <div className="ui-actions">
            <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${params.groupId}`}>Back to group</Link>
          </div>
        </main>
      );
    }

    if (error instanceof GroupAccessError) {
      notFound();
    }

    throw error;
  }
}