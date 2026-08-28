import { MembershipRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db/client";
import {
  GroupAccessError,
  GroupForbiddenError,
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

  it("validates exactly 25 objectives and one free-space index", () => {
    const valid = parseTemplateInput({
      objectives: Array.from({ length: 25 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceOrdinal: 12
    });

    expect(valid.objectives).toHaveLength(25);

    expect(() =>
      parseTemplateInput({
        objectives: Array.from({ length: 24 }, (_, i) => `Objective ${i + 1}`),
        freeSpaceOrdinal: 12
      })
    ).toThrow();
  });

  it("builds objective rows with exactly one free-space objective", () => {
    const input = {
      objectives: Array.from({ length: 25 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceOrdinal: 7
    };

    const objectives = buildTemplateObjectives(input);

    expect(objectives).toHaveLength(25);
    expect(objectives.filter((objective) => objective.isFreeSpace)).toHaveLength(1);
    expect(objectives[7].isFreeSpace).toBe(true);
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

    expect(result.objectives).toHaveLength(25);
    expect(result.freeSpaceOrdinal).toBe(12);
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
            objectives: Array.from({ length: 25 }, (_, index) => ({ ordinal: index }))
          })
        },
        group: {
          update: vi.fn().mockResolvedValue({})
        }
      };

      return callback(tx);
    });

    const result = await saveGroupTemplateForGroup("user-1", "group-1", {
      objectives: Array.from({ length: 25 }, (_, i) => `Objective ${i + 1}`),
      freeSpaceOrdinal: 12
    });

    expect(result.version).toBe(3);
    expect(result.objectiveCount).toBe(25);
    expect(result.freeSpaceOrdinal).toBe(12);
  });
});
