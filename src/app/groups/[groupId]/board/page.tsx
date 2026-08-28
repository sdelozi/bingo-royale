import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlayerBoardGrid } from "@/components/groups/player-board-grid";
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
      <main>
        <h1>Your board: {board.groupName}</h1>
        <p>This layout is generated once per player and stays stable for the trip.</p>

        <PlayerBoardGrid groupId={board.groupId} squares={board.squares} />

        <p>Mark your own board here. Leaderboard views ship next.</p>
        <p>
          <Link href={`/groups/${board.groupId}`}>Back to group</Link>
        </p>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupBoardTemplateMissingError) {
      return (
        <main>
          <h1>Board unavailable</h1>
          <p>An admin needs to save the group board template before player boards can be generated.</p>
          <p>
            <Link href={`/groups/${params.groupId}`}>Back to group</Link>
          </p>
        </main>
      );
    }

    if (error instanceof GroupAccessError) {
      notFound();
    }

    throw error;
  }
}