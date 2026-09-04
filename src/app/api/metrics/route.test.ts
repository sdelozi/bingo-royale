import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { incrementCounter, resetMetricsForTests } from "@/server/observability/metrics";

describe("GET /api/metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it("returns process metrics and counters", async () => {
    incrementCounter("test.counter");
    incrementCounter("test.counter", 2);

    const response = await GET();

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      timestamp: string;
      uptimeSeconds: number;
      memoryRssBytes: number;
      counters: Record<string, number>;
    };

    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.memoryRssBytes).toBeGreaterThan(0);
    expect(body.counters["test.counter"]).toBe(3);
  });
});
