import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/server/db/client";
import { logError } from "@/server/observability/logger";

vi.mock("@/server/db/client", () => ({
  db: {
    $queryRawUnsafe: vi.fn()
  }
}));

vi.mock("@/server/observability/logger", () => ({
  logError: vi.fn()
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when app and db checks are healthy", async () => {
    vi.mocked(db.$queryRawUnsafe).mockResolvedValueOnce([1] as never);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      checks: {
        app: string;
        db: string;
      };
      generatedAt?: string;
    };

    expect(body.status).toBe("ok");
    expect(body.checks).toEqual({ app: "ok", db: "ok" });
    expect(body.generatedAt).toBeDefined();
    expect(logError).not.toHaveBeenCalled();
  });

  it("returns 503 when db check fails", async () => {
    vi.mocked(db.$queryRawUnsafe).mockRejectedValueOnce(new Error("db down") as never);

    const response = await GET();

    expect(response.status).toBe(503);
    const body = (await response.json()) as {
      status: string;
      checks: {
        app: string;
        db: string;
      };
    };

    expect(body.status).toBe("degraded");
    expect(body.checks).toEqual({ app: "ok", db: "down" });
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
