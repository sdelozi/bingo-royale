import { describe, expect, it } from "vitest";
import { getGroupDashboardActionLabel } from "./get-group-dashboard-action";

describe("getGroupDashboardActionLabel", () => {
  it("returns admin action label for creators", () => {
    expect(getGroupDashboardActionLabel(true)).toBe("Manage group");
  });

  it("returns player action label for non-creators", () => {
    expect(getGroupDashboardActionLabel(false)).toBe("Open group");
  });
});
