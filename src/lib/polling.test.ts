import { describe, expect, it } from "vitest";
import { getDefaultPollingConfig, getNextPollDelay, getPollingConfigFromEnv } from "./polling";

describe("polling config", () => {
  it("falls back to defaults for invalid values", () => {
    const config = getPollingConfigFromEnv({
      NEXT_PUBLIC_POLL_INTERVAL_MS: "not-a-number",
      NEXT_PUBLIC_POLL_MAX_INTERVAL_MS: "0"
    });

    expect(config).toEqual({
      baseIntervalMs: 15000,
      maxIntervalMs: 120000
    });
  });

  it("ensures max interval is never below base interval", () => {
    const config = getPollingConfigFromEnv({
      NEXT_PUBLIC_POLL_INTERVAL_MS: "20000",
      NEXT_PUBLIC_POLL_MAX_INTERVAL_MS: "5000"
    });

    expect(config).toEqual({
      baseIntervalMs: 20000,
      maxIntervalMs: 20000
    });
  });

  it("computes next delay with exponential backoff on failures", () => {
    const config = {
      baseIntervalMs: 1000,
      maxIntervalMs: 8000
    };

    expect(getNextPollDelay(1000, false, config)).toBe(2000);
    expect(getNextPollDelay(2000, false, config)).toBe(4000);
    expect(getNextPollDelay(8000, false, config)).toBe(8000);
    expect(getNextPollDelay(4000, true, config)).toBe(1000);
  });

  it("can read process defaults", () => {
    const config = getDefaultPollingConfig();

    expect(config.baseIntervalMs).toBeGreaterThan(0);
    expect(config.maxIntervalMs).toBeGreaterThanOrEqual(config.baseIntervalMs);
  });
});
