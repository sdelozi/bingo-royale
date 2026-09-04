import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitExceededError, enforceRateLimit, resetRateLimitStateForTests } from "./request-rate-limit";
import { getMetricsSnapshot, resetMetricsForTests } from "@/server/observability/metrics";

describe("request rate limiting", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    resetMetricsForTests();
    vi.restoreAllMocks();
  });

  it("allows requests up to the configured limit", () => {
    const request = new Request("http://localhost/api/groups/join", {
      headers: {
        "x-forwarded-for": "203.0.113.10"
      }
    });

    enforceRateLimit({
      scope: "group-join",
      request,
      policy: {
        windowMs: 60_000,
        maxRequests: 2
      }
    });

    expect(() => {
      enforceRateLimit({
        scope: "group-join",
        request,
        policy: {
          windowMs: 60_000,
          maxRequests: 2
        }
      });
    }).not.toThrow();
  });

  it("throws with retry-after when limit is exceeded", () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_000)
      .mockReturnValueOnce(21_000);

    const request = new Request("http://localhost/api/auth/register", {
      headers: {
        "x-forwarded-for": "203.0.113.20"
      }
    });

    enforceRateLimit({
      scope: "auth-register",
      request,
      policy: {
        windowMs: 30_000,
        maxRequests: 2
      }
    });

    enforceRateLimit({
      scope: "auth-register",
      request,
      policy: {
        windowMs: 30_000,
        maxRequests: 2
      }
    });

    try {
      enforceRateLimit({
        scope: "auth-register",
        request,
        policy: {
          windowMs: 30_000,
          maxRequests: 2
        }
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect((error as RateLimitExceededError).retryAfterSeconds).toBe(10);
    }

    const metrics = getMetricsSnapshot();
    expect(metrics.counters["rate_limit.exceeded_total"]).toBe(1);
    expect(metrics.counters["rate_limit.exceeded_scope.auth-register"]).toBe(1);
  });

  it("tracks limits per user when userId is provided", () => {
    const request = new Request("http://localhost/api/groups/group-1/board", {
      method: "PATCH"
    });

    enforceRateLimit({
      scope: "group-board-mark",
      request,
      userId: "user-1",
      policy: {
        windowMs: 60_000,
        maxRequests: 1
      }
    });

    expect(() => {
      enforceRateLimit({
        scope: "group-board-mark",
        request,
        userId: "user-2",
        policy: {
          windowMs: 60_000,
          maxRequests: 1
        }
      });
    }).not.toThrow();
  });
});
