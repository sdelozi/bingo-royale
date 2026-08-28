import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import {
  FREE_SPACE_POSITION,
  GroupAccessError,
  GroupForbiddenError,
  REGULAR_OBJECTIVE_COUNT,
  TemplateEditConfirmationRequiredError,
  buildTemplateObjectives,
  getChangedObjectiveOrdinals,
  getGroupTemplateEditorData,
  parseTemplateInput,
  saveGroupTemplateForGroup
} from "./template-management";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findUnique: vi.fn()
    },
    playerBoard: {
      count: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe("template-management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates free-space objective plus 24 regular objectives", () => {
    const valid = parseTemplateInput({
      freeSpaceObjective: "Free space",
      objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceMarkedByDefault: true
    });

    expect(valid.objectives).toHaveLength(REGULAR_OBJECTIVE_COUNT);

    expect(() =>
      parseTemplateInput({
        freeSpaceObjective: "Free space",
        objectives: Array.from({ length: 23 }, (_, i) => `Objective ${i + 1}`),
        freeSpaceMarkedByDefault: false
      })
    ).toThrow();
  });

  it("builds objective rows with free-space fixed to center tile", () => {
    const input = {
      freeSpaceObjective: "Center free",
      objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceMarkedByDefault: false
    };

    const objectives = buildTemplateObjectives(input);

    expect(objectives).toHaveLength(25);
    expect(objectives.filter((objective) => objective.isFreeSpace)).toHaveLength(1);
    expect(objectives[FREE_SPACE_POSITION].isFreeSpace).toBe(true);
    expect(objectives[FREE_SPACE_POSITION].content).toBe("Center free");
  });

  it("detects changed objectives by ordinal", () => {
    const previous = [
      { id: "old-1", ordinal: 0, content: "Photo" },
      { id: "old-2", ordinal: 1, content: "Snack" }
    ];
    const next = [
      { id: "new-1", ordinal: 0, content: "Photo" },
      { id: "new-2", ordinal: 1, content: "Dance" }
    ];

    expect(getChangedObjectiveOrdinals(previous, next)).toEqual([1]);
  });

  it("throws access error when requesting editor data outside membership", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null as never);

    await expect(getGroupTemplateEditorData("user-1", "group-1")).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("throws forbidden error when non-admin requests editor data", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({ role: MembershipRole.PLAYER } as never);

    await expect(getGroupTemplateEditorData("user-1", "group-1")).rejects.toBeInstanceOf(GroupForbiddenError);
  });

  it("returns default editor state when group has no active template", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
      role: MembershipRole.ADMIN,
      group: {
        id: "group-1",
        name: "Trip",
        _count: {
          boards: 0
        },
        currentTemplate: null
      }
    } as never);

    const result = await getGroupTemplateEditorData("user-1", "group-1");

    expect(result.objectives).toHaveLength(24);
    expect(result.freeSpaceObjective).toBe("Free space");
    expect(result.freeSpaceMarkedByDefault).toBe(false);
    expect(result.hasExistingBoards).toBe(false);
    expect(result.currentVersion).toBe(0);
  });

  it("requires confirmation when boards already exist", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({ role: MembershipRole.ADMIN } as never);
    vi.mocked(db.playerBoard.count).mockResolvedValueOnce(3 as never);

    await expect(
      saveGroupTemplateForGroup("user-1", "group-1", {
        freeSpaceObjective: "Center free",
        objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
        freeSpaceMarkedByDefault: false,
        warningAcknowledged: false
      })
    ).rejects.toBeInstanceOf(TemplateEditConfirmationRequiredError);
  });

  it("saves as a new active version and updates current template pointer", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({ role: MembershipRole.ADMIN } as never);
    vi.mocked(db.playerBoard.count).mockResolvedValueOnce(2 as never);

    vi.mocked(db.$transaction).mockImplementationOnce(async (callback: never) => {
      const tx = {
        boardTemplate: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce({ version: 2 })
            .mockResolvedValueOnce({
              id: "template-2",
              objectives: Array.from({ length: 25 }, (_, ordinal) => ({
                id: `old-${ordinal}`,
                ordinal,
                content: ordinal === 3 ? "Old objective" : `Objective ${ordinal}`
              }))
            }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({
            id: "template-3",
            version: 3,
            objectives: Array.from({ length: 25 }, (_, ordinal) => ({
              id: `new-${ordinal}`,
              ordinal,
              content: ordinal === 3 ? "New objective" : `Objective ${ordinal}`
            })),
            freeSpaceMarkedByDefault: true
          })
        },
        playerBoardSquare: {
          updateMany: vi.fn().mockResolvedValue({ count: 2 })
        },
        boardEditEvent: {
          create: vi.fn().mockResolvedValue({ id: "event-1" })
        },
        group: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      const result = await callback(tx);

      expect(tx.playerBoardSquare.updateMany).toHaveBeenCalledTimes(25);
      expect(tx.boardEditEvent.create).toHaveBeenCalledTimes(1);
      expect(tx.boardEditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: "group-1",
          actorUserId: "user-1",
          warningAcked: true
        })
      });
      const eventPayload = tx.boardEditEvent.create.mock.calls[0][0].data.metadataJson;
      expect(eventPayload).toContain('"markStatePreservedOnReplacedObjectives":true');

      return result;
    });

    const result = await saveGroupTemplateForGroup("user-1", "group-1", {
      freeSpaceObjective: "Center free",
      objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceMarkedByDefault: true,
      warningAcknowledged: true
    });

    expect(result.version).toBe(3);
    expect(result.objectiveCount).toBe(25);
    expect(result.freeSpacePosition).toBe(12);
    expect(result.freeSpaceMarkedByDefault).toBe(true);
    expect(result.affectedBoardCount).toBe(2);
    expect(result.changedObjectiveCount).toBe(1);
    expect(result.preservedMarkedReplacements).toBe(true);
    expect(result.statsRecomputeRequired).toBe(true);
  });
});
