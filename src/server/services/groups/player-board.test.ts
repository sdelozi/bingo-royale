import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import { GroupAccessError } from "./template-management";
import {
  GroupBoardTemplateMissingError,
  buildDeterministicBoardSquares,
  getOrCreatePlayerBoardForGroup
} from "./player-board";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findUnique: vi.fn()
    },
    playerBoard: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

function createTemplateObjectives(freeSpaceOrdinal = 12) {
  return Array.from({ length: 25 }, (_, index) => ({
    id: `objective-${index + 1}`,
    ordinal: index,
    content: `Objective ${index + 1}`,
    isFreeSpace: index === freeSpaceOrdinal
  }));
}

describe("player-board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds deterministic board squares and keeps the free-space position fixed", () => {
    const objectives = createTemplateObjectives(7);

    const firstLayout = buildDeterministicBoardSquares(objectives, "group-1:user-1:template-1");
    const secondLayout = buildDeterministicBoardSquares(objectives, "group-1:user-1:template-1");

    expect(firstLayout).toHaveLength(25);
    expect(secondLayout.map((square) => square.objectiveId)).toEqual(firstLayout.map((square) => square.objectiveId));
    expect(firstLayout[12]).toMatchObject({
      position: 12,
      objectiveId: "objective-8",
      isFreeSpace: true
    });
    expect(firstLayout.filter((square) => square.isFreeSpace)).toHaveLength(1);
  });

  it("builds different shuffles for different player seeds", () => {
    const objectives = createTemplateObjectives(12);

    const firstPlayerLayout = buildDeterministicBoardSquares(objectives, "group-1:user-1:template-1");
    const secondPlayerLayout = buildDeterministicBoardSquares(objectives, "group-1:user-2:template-1");

    const firstSequence = firstPlayerLayout.map((square) => square.objectiveId).join("|");
    const secondSequence = secondPlayerLayout.map((square) => square.objectiveId).join("|");

    expect(firstSequence).not.toBe(secondSequence);
    expect(firstPlayerLayout[12].isFreeSpace).toBe(true);
    expect(secondPlayerLayout[12].isFreeSpace).toBe(true);
  });

  it("throws access error when the user is not a group member", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null as never);

    await expect(getOrCreatePlayerBoardForGroup("user-1", "group-1")).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("throws when no active template exists and no board has been generated yet", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      group: {
        id: "group-1",
        name: "Trip",
        currentTemplateId: null
      }
    } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce(null as never);

    await expect(getOrCreatePlayerBoardForGroup("user-1", "group-1")).rejects.toBeInstanceOf(
      GroupBoardTemplateMissingError
    );
  });

  it("returns an existing persisted board without regenerating it", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      group: {
        id: "group-1",
        name: "Trip",
        currentTemplateId: "template-1"
      }
    } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      id: "board-1",
      createdAt: new Date(),
      group: {
        id: "group-1",
        name: "Trip"
      },
      squares: [
        {
          position: 0,
          objective: {
            content: "Objective 1",
            isFreeSpace: false
          },
          mark: null
        },
        {
          position: 1,
          objective: {
            content: "Objective 2",
            isFreeSpace: true
          },
          mark: null
        }
      ]
    } as never);

    const result = await getOrCreatePlayerBoardForGroup("user-1", "group-1");

    expect(result.boardId).toBe("board-1");
    expect(result.groupName).toBe("Trip");
    expect(result.squares[1].isMarked).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates a persisted player board from the active template once", async () => {
    const objectives = createTemplateObjectives(12);
    const objectiveMap = new Map(objectives.map((objective) => [objective.id, objective]));

    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      group: {
        id: "group-1",
        name: "Trip",
        currentTemplateId: "template-1"
      }
    } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(db.$transaction).mockImplementationOnce(async (callback: never) => {
      const tx = {
        playerBoard: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(
            async ({ data }: { data: { squares: { create: Array<{ position: number; objectiveId: string }> } } }) => ({
              id: "board-1",
              createdAt: new Date("2026-08-28T00:00:00.000Z"),
              group: {
                id: "group-1",
                name: "Trip"
              },
              squares: data.squares.create.map((square) => ({
                position: square.position,
                objective: {
                  content: objectiveMap.get(square.objectiveId)?.content ?? "",
                  isFreeSpace: objectiveMap.get(square.objectiveId)?.isFreeSpace ?? false
                },
                mark: null
              }))
            })
          )
        },
        group: {
          findUnique: vi.fn().mockResolvedValue({
            id: "group-1",
            name: "Trip",
            currentTemplate: {
              id: "template-1",
              objectives
            }
          })
        }
      };

      return callback(tx);
    });

    const result = await getOrCreatePlayerBoardForGroup("user-1", "group-1");

    expect(result.boardId).toBe("board-1");
    expect(result.squares).toHaveLength(25);
    expect(result.squares[12]).toMatchObject({
      content: "Objective 13",
      isFreeSpace: true
    });
    expect(result.squares.filter((square) => square.isFreeSpace)).toHaveLength(1);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});