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

    const result = await updatePlayerBoardMark("user-1", "group-1", { position: 12, isMarked: true });

    expect(result.isFreeSpace).toBe(true);
    expect(result.isMarked).toBe(true);
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