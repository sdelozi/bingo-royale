import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import {
  FREE_SPACE_POSITION,
  GroupAccessError,
  GroupForbiddenError,
  REGULAR_OBJECTIVE_COUNT,
  buildTemplateObjectives,
  getGroupTemplateEditorData,
  parseTemplateInput,
  saveGroupTemplateForGroup
} from "./template-management";

vi.mock("@/server/db/client", () => ({
  db: {
    membership: {
      findUnique: vi.fn()
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
        currentTemplate: null
      }
    } as never);

    const result = await getGroupTemplateEditorData("user-1", "group-1");

    expect(result.objectives).toHaveLength(24);
    expect(result.freeSpaceObjective).toBe("Free space");
    expect(result.freeSpaceMarkedByDefault).toBe(false);
    expect(result.currentVersion).toBe(0);
  });

  it("saves as a new active version and updates current template pointer", async () => {
    vi.mocked(db.membership.findUnique).mockResolvedValueOnce({ role: MembershipRole.ADMIN } as never);

    vi.mocked(db.$transaction).mockImplementationOnce(async (callback: never) => {
      const tx = {
        boardTemplate: {
          findFirst: vi.fn().mockResolvedValue({ version: 2 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({
            id: "template-3",
            version: 3,
            objectives: Array.from({ length: 25 }, (_, index) => ({ ordinal: index })),
            freeSpaceMarkedByDefault: true
          })
        },
        group: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      return callback(tx);
    });

    const result = await saveGroupTemplateForGroup("user-1", "group-1", {
      freeSpaceObjective: "Center free",
      objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceMarkedByDefault: true
    });

    expect(result.version).toBe(3);
    expect(result.objectiveCount).toBe(25);
    expect(result.freeSpacePosition).toBe(12);
    expect(result.freeSpaceMarkedByDefault).toBe(true);
  });
});
