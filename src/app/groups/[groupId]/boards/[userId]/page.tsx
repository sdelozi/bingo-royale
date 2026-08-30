import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReadOnlyBoardGrid } from "@/components/groups/read-only-board-grid";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db/client";

type GroupMemberBoardPageProps = {
  params: {
    groupId: string;
    userId: string;
  };
};

export default async function GroupMemberBoardPage({ params }: GroupMemberBoardPageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  const viewerMembership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId: params.groupId,
        userId: user.id
      }
    }
  });

  if (!viewerMembership) {
    notFound();
  }

  const targetMembership = await db.membership.findUnique({
    where: {
      groupId_userId: {
        groupId: params.groupId,
        userId: params.userId
      }
    },
    include: {
      group: {
        select: {
          id: true,
          name: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!targetMembership) {
    notFound();
  }

  const board = await db.playerBoard.findUnique({
    where: {
      groupId_userId: {
        groupId: params.groupId,
        userId: params.userId
      }
    },
    include: {
      squares: {
        orderBy: {
          position: "asc"
        },
        include: {
          objective: {
            select: {
              content: true,
              isFreeSpace: true
            }
          },
          mark: {
            select: {
              isMarked: true
            }
          }
        }
      }
    }
  });

  const displayName = targetMembership.user.name?.trim() || targetMembership.user.email;

  if (!board) {
    return (
      <main>
        <h1>{displayName}&apos;s board</h1>
        <p>This player has not generated a board yet.</p>
        <p>
          <Link href={`/groups/${targetMembership.group.id}/leaderboard`}>Back to leaderboard</Link>
        </p>
      </main>
    );
  }

  const squares = board.squares.map((square) => ({
    position: square.position,
    content: square.objective.content,
    isFreeSpace: square.objective.isFreeSpace,
    isMarked: square.mark?.isMarked ?? false
  }));

  return (
    <main>
      <h1>{displayName}&apos;s board</h1>
      <p>Read-only view for members.</p>

      <ReadOnlyBoardGrid squares={squares} />

      <p>
        <Link href={`/groups/${targetMembership.group.id}/leaderboard`}>Back to leaderboard</Link>
      </p>
    </main>
  );
}
