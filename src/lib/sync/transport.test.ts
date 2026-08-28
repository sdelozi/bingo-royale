import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPollingSyncTransport } from "./transport";

describe("createPollingSyncTransport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("emits payload and resets delay on success", async () => {
    const onData = vi.fn();
    const onError = vi.fn();
    const onRefreshingChange = vi.fn();
    const onNextDelayChange = vi.fn();

    const transport = createPollingSyncTransport({
      pollingConfig: {
        baseIntervalMs: 1000,
        maxIntervalMs: 8000
      },
      fetchLatest: vi.fn().mockResolvedValue({ value: 1 })
    });

    const dispose = transport.start({ onData, onError, onRefreshingChange, onNextDelayChange });

    await vi.advanceTimersByTimeAsync(1000);

    expect(onData).toHaveBeenCalledWith({ value: 1 });
    expect(onError).toHaveBeenCalledWith(null);
    expect(onRefreshingChange).toHaveBeenCalledWith(true);
    expect(onRefreshingChange).toHaveBeenCalledWith(false);
    expect(transport.getNextDelayMs()).toBe(1000);

    dispose();
  });

  it("backs off delay on failures and refreshNow resets delay", async () => {
    const onData = vi.fn();
    const onError = vi.fn();
    const onRefreshingChange = vi.fn();
    const onNextDelayChange = vi.fn();

    const fetchLatest = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ value: 2 });

    const transport = createPollingSyncTransport({
      pollingConfig: {
        baseIntervalMs: 1000,
        maxIntervalMs: 4000
      },
      fetchLatest
    });

    const dispose = transport.start({ onData, onError, onRefreshingChange, onNextDelayChange });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onError).toHaveBeenCalledWith("network");
    expect(transport.getNextDelayMs()).toBe(2000);

    await transport.refreshNow();
    expect(onData).toHaveBeenCalledWith({ value: 2 });
    expect(transport.getNextDelayMs()).toBe(1000);

    dispose();
  });
});
