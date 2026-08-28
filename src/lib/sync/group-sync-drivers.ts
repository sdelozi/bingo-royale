import type { PlayerBoardSquareState } from "@/server/services/groups/player-board";
import type { GroupLeaderboardRow } from "@/server/services/groups/get-group-leaderboard";

export type GroupBoardSnapshot = {
  generatedAt: string;
  squares: PlayerBoardSquareState[];
  stats: {
    score: number;
    bingoCount: number;
    blackout: boolean;
  };
  error?: string;
};

export type GroupLeaderboardSnapshot = {
  generatedAt: string;
  rows: GroupLeaderboardRow[];
  error?: string;
};

async function readJson<TPayload>(response: Response): Promise<TPayload> {
  return (await response.json()) as TPayload;
}

export async function fetchGroupBoardSnapshot(groupId: string): Promise<GroupBoardSnapshot> {
  const response = await fetch(`/api/groups/${groupId}/board`, {
    method: "GET",
    cache: "no-store"
  });
  const data = await readJson<GroupBoardSnapshot>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to refresh board.");
  }

  return data;
}

export async function fetchGroupLeaderboardSnapshot(groupId: string): Promise<GroupLeaderboardSnapshot> {
  const response = await fetch(`/api/groups/${groupId}/leaderboard`, {
    method: "GET",
    cache: "no-store"
  });
  const data = await readJson<GroupLeaderboardSnapshot>(response);

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to refresh leaderboard.");
  }

  return data;
}
