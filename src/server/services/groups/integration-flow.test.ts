import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

type UserRecord = {
  id: string;
  name: string;
  email: string;
};

type GroupRecord = {
  id: string;
  name: string;
  inviteCode: string;
  shareToken: string;
  creatorId: string;
  createdAt: Date;
  currentTemplateId: string | null;
};

type MembershipRecord = {
  groupId: string;
  userId: string;
  role: MembershipRole;
  joinedAt: Date;
};

type TemplateRecord = {
  id: string;
  groupId: string;
  version: number;
  isActive: boolean;
  freeSpaceMarkedByDefault: boolean;
};

type ObjectiveRecord = {
  id: string;
  templateId: string;
  ordinal: number;
  content: string;
  isFreeSpace: boolean;
};

type PlayerBoardRecord = {
  id: string;
  groupId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PlayerBoardSquareRecord = {
  id: string;
  playerBoardId: string;
  position: number;
  objectiveId: string;
};

type PlayerMarkRecord = {
  id: string;
  playerBoardSquareId: string;
  userId: string;
  isMarked: boolean;
};

type State = {
  nextId: number;
  users: UserRecord[];
  groups: GroupRecord[];
  memberships: MembershipRecord[];
  templates: TemplateRecord[];
  objectives: ObjectiveRecord[];
  boards: PlayerBoardRecord[];
  squares: PlayerBoardSquareRecord[];
  marks: PlayerMarkRecord[];
};

function createInitialState(): State {
  return {
    nextId: 1,
    users: [
      { id: "user-admin", name: "Admin", email: "admin@example.com" },
      { id: "user-player", name: "Player", email: "player@example.com" }
    ],
    groups: [],
    memberships: [],
    templates: [],
    objectives: [],
    boards: [],
    squares: [],
    marks: []
  };
}

let state = createInitialState();

function nextId(prefix: string) {
  const value = `${prefix}-${state.nextId}`;
  state.nextId += 1;
  return value;
}

function getUser(userId: string) {
  const user = state.users.find((candidate) => candidate.id === userId);

  if (user) {
    return user;
  }

  const fallback = { id: userId, name: userId, email: `${userId}@example.com` };
  state.users.push(fallback);
  return fallback;
}

function getBoardWithSquares(groupId: string, userId: string) {
  const board = state.boards.find((candidate) => candidate.groupId === groupId && candidate.userId === userId);

  if (!board) {
    return null;
  }

  const group = state.groups.find((candidate) => candidate.id === groupId);

  if (!group) {
    return null;
  }

  const squares = state.squares
    .filter((square) => square.playerBoardId === board.id)
    .sort((left, right) => left.position - right.position)
    .map((square) => {
      const objective = state.objectives.find((candidate) => candidate.id === square.objectiveId);
      const mark = state.marks.find((candidate) => candidate.playerBoardSquareId === square.id) ?? null;

      if (!objective) {
        throw new Error("Objective missing while mapping board state.");
      }

      return {
        position: square.position,
        objective,
        mark
      };
    });

  return {
    id: board.id,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    group: {
      id: group.id,
      name: group.name
    },
    squares
  };
}

function buildDbMock() {
  const group = {
    create: vi.fn(async ({ data, select }: any) => {
      const record: GroupRecord = {
        id: nextId("group"),
        name: data.name,
        inviteCode: data.inviteCode,
        shareToken: data.shareToken,
        creatorId: data.creatorId,
        createdAt: new Date(),
        currentTemplateId: null
      };

      state.groups.push(record);
      state.memberships.push({
        groupId: record.id,
        userId: data.memberships.create.userId,
        role: data.memberships.create.role,
        joinedAt: new Date()
      });

      if (select) {
        return {
          id: record.id,
          name: record.name,
          inviteCode: record.inviteCode,
          shareToken: record.shareToken,
          createdAt: record.createdAt
        };
      }

      return record;
    }),
    findUnique: vi.fn(async ({ where, select }: any) => {
      let record: GroupRecord | undefined;

      if (where.id) {
        record = state.groups.find((candidate) => candidate.id === where.id);
      } else if (where.inviteCode) {
        record = state.groups.find((candidate) => candidate.inviteCode === where.inviteCode);
      } else if (where.shareToken) {
        record = state.groups.find((candidate) => candidate.shareToken === where.shareToken);
      }

      if (!record) {
        return null;
      }

      if (select?.currentTemplate) {
        const template = state.templates.find((candidate) => candidate.id === record.currentTemplateId) ?? null;

        return {
          id: record.id,
          name: record.name,
          currentTemplate: template
            ? {
                id: template.id,
                freeSpaceMarkedByDefault: template.freeSpaceMarkedByDefault,
                objectives: state.objectives
                  .filter((objective) => objective.templateId === template.id)
                  .sort((left, right) => left.ordinal - right.ordinal)
              }
            : null
        };
      }

      if (select) {
        return {
          id: record.id,
          name: record.name,
          inviteCode: record.inviteCode,
          shareToken: record.shareToken,
          creatorId: record.creatorId,
          createdAt: record.createdAt
        };
      }

      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const record = state.groups.find((candidate) => candidate.id === where.id);

      if (!record) {
        throw new Error("Group not found.");
      }

      record.currentTemplateId = data.currentTemplateId;
      return record;
    })
  };

  const membership = {
    findUnique: vi.fn(async ({ where, include, select }: any) => {
      const record = state.memberships.find(
        (candidate) =>
          candidate.groupId === where.groupId_userId.groupId &&
          candidate.userId === where.groupId_userId.userId
      );

      if (!record) {
        return null;
      }

      if (include?.group) {
        const groupRecord = state.groups.find((candidate) => candidate.id === record.groupId);

        if (!groupRecord) {
          return null;
        }

        return {
          ...record,
          group: {
            id: groupRecord.id,
            name: groupRecord.name,
            currentTemplateId: groupRecord.currentTemplateId
          }
        };
      }

      if (select?.role) {
        return {
          role: record.role
        };
      }

      return record;
    }),
    findMany: vi.fn(async ({ where }: any) => {
      const records = state.memberships.filter((candidate) => candidate.groupId === where.groupId);

      return records.map((record) => {
        const user = getUser(record.userId);
        const userBoards = state.boards
          .filter((candidate) => candidate.userId === record.userId && candidate.groupId === where.groupId)
          .map((board) => ({
            id: board.id,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            squares: state.squares
              .filter((square) => square.playerBoardId === board.id)
              .sort((left, right) => left.position - right.position)
              .map((square) => ({
                position: square.position,
                mark:
                  state.marks.find((mark) => mark.playerBoardSquareId === square.id)?.isMarked === true
                    ? { isMarked: true }
                    : null
              }))
          }));

        return {
          role: record.role,
          joinedAt: record.joinedAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            boards: userBoards
          }
        };
      });
    }),
    create: vi.fn(async ({ data, select }: any) => {
      const record: MembershipRecord = {
        groupId: data.groupId,
        userId: data.userId,
        role: data.role,
        joinedAt: new Date()
      };

      state.memberships.push(record);

      if (select) {
        return {
          role: record.role,
          joinedAt: record.joinedAt
        };
      }

      return record;
    })
  };

  const playerBoard = {
    count: vi.fn(async ({ where }: any) => state.boards.filter((board) => board.groupId === where.groupId).length),
    findUnique: vi.fn(async ({ where }: any) =>
      getBoardWithSquares(where.groupId_userId.groupId, where.groupId_userId.userId)
    ),
    create: vi.fn(async ({ data }: any) => {
      const now = new Date();
      const board: PlayerBoardRecord = {
        id: nextId("board"),
        groupId: data.groupId,
        userId: data.userId,
        createdAt: now,
        updatedAt: now
      };

      state.boards.push(board);

      for (const squareInput of data.squares.create) {
        const square: PlayerBoardSquareRecord = {
          id: nextId("square"),
          playerBoardId: board.id,
          position: squareInput.position,
          objectiveId: squareInput.objectiveId
        };

        state.squares.push(square);

        if (squareInput.mark?.create) {
          state.marks.push({
            id: nextId("mark"),
            playerBoardSquareId: square.id,
            userId: squareInput.mark.create.userId,
            isMarked: squareInput.mark.create.isMarked
          });
        }
      }

      return getBoardWithSquares(data.groupId, data.userId);
    })
  };

  const boardTemplate = {
    findFirst: vi.fn(async ({ where, orderBy, select }: any) => {
      let templates = state.templates.filter((candidate) => candidate.groupId === where.groupId);

      if (where.isActive === true) {
        templates = templates.filter((candidate) => candidate.isActive);
      }

      if (templates.length === 0) {
        return null;
      }

      if (orderBy?.version === "desc") {
        templates = [...templates].sort((left, right) => right.version - left.version);
      }

      const template = templates[0];

      if (select?.version) {
        return {
          version: template.version
        };
      }

      if (select?.objectives) {
        return {
          id: template.id,
          objectives: state.objectives
            .filter((objective) => objective.templateId === template.id)
            .sort((left, right) => left.ordinal - right.ordinal)
            .map((objective) => ({
              id: objective.id,
              ordinal: objective.ordinal,
              content: objective.content
            }))
        };
      }

      return template;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;

      for (const template of state.templates) {
        if (template.groupId === where.groupId && template.isActive === where.isActive) {
          template.isActive = data.isActive;
          count += 1;
        }
      }

      return { count };
    }),
    create: vi.fn(async ({ data }: any) => {
      const template: TemplateRecord = {
        id: nextId("template"),
        groupId: data.groupId,
        version: data.version,
        isActive: data.isActive,
        freeSpaceMarkedByDefault: data.freeSpaceMarkedByDefault
      };

      state.templates.push(template);

      for (const objectiveInput of data.objectives.create) {
        state.objectives.push({
          id: nextId("objective"),
          templateId: template.id,
          ordinal: objectiveInput.ordinal,
          content: objectiveInput.content,
          isFreeSpace: objectiveInput.isFreeSpace
        });
      }

      return {
        ...template,
        objectives: state.objectives
          .filter((objective) => objective.templateId === template.id)
          .sort((left, right) => left.ordinal - right.ordinal)
      };
    })
  };

  const playerBoardSquare = {
    findUnique: vi.fn(async ({ where }: any) => {
      const square = state.squares.find(
        (candidate) =>
          candidate.playerBoardId === where.playerBoardId_position.playerBoardId &&
          candidate.position === where.playerBoardId_position.position
      );

      if (!square) {
        return null;
      }

      const objective = state.objectives.find((candidate) => candidate.id === square.objectiveId);
      const mark = state.marks.find((candidate) => candidate.playerBoardSquareId === square.id) ?? null;

      if (!objective) {
        throw new Error("Objective not found for square.");
      }

      return {
        id: square.id,
        objective: {
          isFreeSpace: objective.isFreeSpace,
          content: objective.content
        },
        mark: mark ? { id: mark.id, isMarked: mark.isMarked } : null
      };
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      const groupBoardIds = state.boards.filter((board) => board.groupId === where.playerBoard.groupId).map((board) => board.id);

      for (const square of state.squares) {
        if (groupBoardIds.includes(square.playerBoardId) && square.objectiveId === where.objectiveId) {
          square.objectiveId = data.objectiveId;
          count += 1;
        }
      }

      return { count };
    })
  };

  const playerMark = {
    upsert: vi.fn(async ({ where, update, create }: any) => {
      let mark = state.marks.find((candidate) => candidate.playerBoardSquareId === where.playerBoardSquareId);

      if (mark) {
        mark.isMarked = update.isMarked;
        mark.userId = update.userId;
      } else {
        mark = {
          id: nextId("mark"),
          playerBoardSquareId: create.playerBoardSquareId,
          userId: create.userId,
          isMarked: create.isMarked
        };
        state.marks.push(mark);
      }

      const square = state.squares.find((candidate) => candidate.id === mark.playerBoardSquareId);

      if (square) {
        const board = state.boards.find((candidate) => candidate.id === square.playerBoardId);

        if (board) {
          board.updatedAt = new Date();
        }
      }

      return mark;
    })
  };

  const tx = {
    playerBoard,
    group,
    boardTemplate,
    playerBoardSquare,
    boardEditEvent: {
      create: vi.fn(async () => ({}))
    }
  };

  return {
    group,
    membership,
    boardTemplate,
    playerBoard,
    playerBoardSquare,
    playerMark,
    boardEditEvent: {
      create: vi.fn(async () => ({}))
    },
    $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => unknown) => callback(tx))
  };
}

const { dbMock } = vi.hoisted(() => ({
  dbMock: buildDbMock()
}));

vi.mock("@/server/db/client", () => ({
  db: dbMock
}));

import { updatePlayerBoardMark } from "./board-marking";
import { createGroupForUser } from "./create-group";
import { getGroupLeaderboardForUser } from "./get-group-leaderboard";
import { joinGroupForUser } from "./join-group";
import { getOrCreatePlayerBoardForGroup } from "./player-board";
import { GroupAccessError } from "./template-management";
import { saveGroupTemplateForGroup } from "./template-management";

describe("group gameplay integration flow", () => {
  beforeEach(() => {
    state = createInitialState();
    vi.clearAllMocks();
  });

  it("supports create -> join -> play -> leaderboard workflow", async () => {
    const group = await createGroupForUser("user-admin", { name: "Trip" });

    await saveGroupTemplateForGroup("user-admin", group.id, {
      freeSpaceObjective: "Free space",
      objectives: Array.from({ length: 24 }, (_, index) => `Objective ${index + 1}`),
      freeSpaceMarkedByDefault: false,
      warningAcknowledged: false
    });

    const joinResult = await joinGroupForUser("user-player", {
      inviteCode: group.inviteCode
    });

    expect(joinResult.alreadyMember).toBe(false);

    const adminBoard = await getOrCreatePlayerBoardForGroup("user-admin", group.id);
    const playerBoard = await getOrCreatePlayerBoardForGroup("user-player", group.id);

    expect(adminBoard.squares).toHaveLength(25);
    expect(playerBoard.squares).toHaveLength(25);

    for (const position of [0, 1, 2, 3, 4]) {
      await updatePlayerBoardMark("user-player", group.id, { position, isMarked: true });
    }

    const refreshedPlayerBoard = await getOrCreatePlayerBoardForGroup("user-player", group.id);
    expect(refreshedPlayerBoard.stats).toEqual({
      score: 10,
      bingoCount: 1,
      blackout: false
    });

    const leaderboard = await getGroupLeaderboardForUser("user-admin", group.id);

    expect(leaderboard.rows).toHaveLength(2);
    expect(leaderboard.rows[0]).toMatchObject({
      userId: "user-player",
      role: MembershipRole.PLAYER,
      bingoCount: 1,
      score: 10,
      blackout: false
    });
    expect(leaderboard.rows[1]).toMatchObject({
      userId: "user-admin",
      role: MembershipRole.ADMIN,
      score: 0,
      bingoCount: 0,
      blackout: false
    });
  });

  it("prevents non-members from reading leaderboard and keeps duplicate joins idempotent", async () => {
    const group = await createGroupForUser("user-admin", { name: "Trip" });

    await expect(getGroupLeaderboardForUser("user-player", group.id)).rejects.toBeInstanceOf(GroupAccessError);

    const firstJoin = await joinGroupForUser("user-player", {
      inviteCode: group.inviteCode
    });
    const secondJoin = await joinGroupForUser("user-player", {
      inviteCode: group.inviteCode
    });

    expect(firstJoin.alreadyMember).toBe(false);
    expect(secondJoin.alreadyMember).toBe(true);
    expect(secondJoin.role).toBe(MembershipRole.PLAYER);
  });
});
