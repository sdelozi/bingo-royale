import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import { GroupBoardTemplateMissingError, getOrCreatePlayerBoardForGroup } from "./player-board";
import {
  PlayerBoardSquareNotFoundError,
  parseUpdateBoardMarkInput,
  updatePlayerBoardMark
} from "./board-marking";

vi.mock("@/server/db/client", () => ({
  db: {
    playerBoardSquare: {
      findUnique: vi.fn()
    },
    playerMark: {
      upsert: vi.fn()
    },
    playerBoard: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("./player-board", async () => {
  const actual = await vi.importActual<typeof import("./player-board")>("./player-board");

  return {
    ...actual,
    getOrCreatePlayerBoardForGroup: vi.fn()
  };
});

function buildSquares(markedPositions: number[]) {
  return Array.from({ length: 25 }, (_, position) => ({
    position,
    mark: markedPositions.includes(position) ? { isMarked: true } : null
  }));
}

describe("board-marking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates mark update input", () => {
    expect(parseUpdateBoardMarkInput({ position: 3, isMarked: true })).toEqual({ position: 3, isMarked: true });
    expect(() => parseUpdateBoardMarkInput({ position: 25, isMarked: true })).toThrow();
  });

  it("updates a non-free-space square mark state", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce({
      id: "square-3",
      objective: {
        isFreeSpace: false,
        content: "Take a selfie"
      },
      mark: null
    } as never);
    vi.mocked(db.playerMark.upsert).mockResolvedValueOnce({
      isMarked: true
    } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      firstBingoAt: null,
      firstBlackoutAt: null,
      squares: buildSquares([3])
    } as never);

    const result = await updatePlayerBoardMark("user-1", "group-1", { position: 3, isMarked: true });

    expect(db.playerMark.upsert).toHaveBeenCalledWith({
      where: {
        playerBoardSquareId: "square-3"
      },
      update: {
        isMarked: true,
        userId: "user-1"
      },
      create: {
        playerBoardSquareId: "square-3",
        userId: "user-1",
        isMarked: true
      }
    });
    expect(result).toMatchObject({ position: 3, isMarked: true, content: "Take a selfie" });
    expect(db.playerBoard.update).not.toHaveBeenCalled();
  });

  it("allows free-space mark changes", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce({
      id: "square-12",
      objective: {
        isFreeSpace: true,
        content: "Free space"
      },
      mark: null
    } as never);
    vi.mocked(db.playerMark.upsert).mockResolvedValueOnce({
      isMarked: true
    } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      firstBingoAt: null,
      firstBlackoutAt: null,
      squares: buildSquares([12])
    } as never);

    const result = await updatePlayerBoardMark("user-1", "group-1", { position: 12, isMarked: true });

    expect(result.isFreeSpace).toBe(true);
    expect(result.isMarked).toBe(true);
  });

  it("sets firstBingoAt when a mark completes the first bingo line", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce({
      id: "square-4",
      objective: { isFreeSpace: false, content: "Objective 4" },
      mark: null
    } as never);
    vi.mocked(db.playerMark.upsert).mockResolvedValueOnce({ isMarked: true } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      firstBingoAt: null,
      firstBlackoutAt: null,
      squares: buildSquares([0, 1, 2, 3, 4])
    } as never);

    await updatePlayerBoardMark("user-1", "group-1", { position: 4, isMarked: true });

    expect(db.playerBoard.update).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
      data: { firstBingoAt: expect.any(Date), firstBlackoutAt: null }
    });
  });

  it("clears firstBingoAt when unmarking removes the last bingo line", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce({
      id: "square-0",
      objective: { isFreeSpace: false, content: "Objective 0" },
      mark: { id: "mark-0", isMarked: true }
    } as never);
    vi.mocked(db.playerMark.upsert).mockResolvedValueOnce({ isMarked: false } as never);
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      firstBingoAt: new Date("2026-09-01T00:00:00.000Z"),
      firstBlackoutAt: null,
      squares: buildSquares([1, 2, 3, 4])
    } as never);

    await updatePlayerBoardMark("user-1", "group-1", { position: 0, isMarked: false });

    expect(db.playerBoard.update).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
      data: { firstBingoAt: null, firstBlackoutAt: null }
    });
  });

  it("sets firstBlackoutAt when the final square is marked", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce({
      id: "square-24",
      objective: { isFreeSpace: false, content: "Objective 24" },
      mark: null
    } as never);
    vi.mocked(db.playerMark.upsert).mockResolvedValueOnce({ isMarked: true } as never);
    const existingFirstBingoAt = new Date("2026-09-01T00:00:00.000Z");
    vi.mocked(db.playerBoard.findUnique).mockResolvedValueOnce({
      firstBingoAt: existingFirstBingoAt,
      firstBlackoutAt: null,
      squares: buildSquares(Array.from({ length: 25 }, (_, index) => index))
    } as never);

    await updatePlayerBoardMark("user-1", "group-1", { position: 24, isMarked: true });

    expect(db.playerBoard.update).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
      data: { firstBingoAt: existingFirstBingoAt, firstBlackoutAt: expect.any(Date) }
    });
  });

  it("throws when the requested square does not exist", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockResolvedValueOnce({
      boardId: "board-1",
      groupId: "group-1",
      groupName: "Trip",
      createdAt: new Date(),
      squares: []
    });
    vi.mocked(db.playerBoardSquare.findUnique).mockResolvedValueOnce(null as never);

    await expect(updatePlayerBoardMark("user-1", "group-1", { position: 6, isMarked: true })).rejects.toBeInstanceOf(
      PlayerBoardSquareNotFoundError
    );
  });

  it("propagates template-missing errors from board creation", async () => {
    vi.mocked(getOrCreatePlayerBoardForGroup).mockRejectedValueOnce(new GroupBoardTemplateMissingError());

    await expect(updatePlayerBoardMark("user-1", "group-1", { position: 6, isMarked: true })).rejects.toBeInstanceOf(
      GroupBoardTemplateMissingError
    );
  });
});