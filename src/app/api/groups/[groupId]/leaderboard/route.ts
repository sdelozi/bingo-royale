import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import { getGroupLeaderboardForUser } from "@/server/services/groups/get-group-leaderboard";
import { GroupAccessError } from "@/server/services/groups/template-management";

type Params = {
  params: {
    groupId: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leaderboard = await getGroupLeaderboardForUser(userId, params.groupId);
    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to load leaderboard right now." }, { status: 500 });
  }
}
