import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
      <main>
        <h1>{leaderboard.groupName} leaderboard</h1>
        <p>Last updated: {leaderboard.generatedAt.toLocaleString()}</p>
        <p>
          <Link href={`/groups/${leaderboard.groupId}/leaderboard`}>Refresh leaderboard</Link>
        </p>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Score</th>
              <th>Bingos</th>
              <th>Blackout</th>
              <th>Board</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.rows.map((row) => (
              <tr key={row.userId}>
                <td>{row.displayName}</td>
                <td>{row.role}</td>
                <td>{row.score}</td>
                <td>{row.bingoCount}</td>
                <td>{row.blackout ? "Yes" : "No"}</td>
                <td>
                  {row.boardHref ? <Link href={row.boardHref}>View board</Link> : "No board yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          <Link href={`/groups/${leaderboard.groupId}`}>Back to group</Link>
        </p>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupAccessError) {
      notFound();
    }

    throw error;
  }
}
