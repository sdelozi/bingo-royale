import { getDefaultPollingConfig, getNextPollDelay, type PollingConfig } from "@/lib/polling";

export type SyncTransportHandlers<TPayload> = {
  onData: (payload: TPayload) => void;
  onError: (message: string | null) => void;
  onRefreshingChange: (isRefreshing: boolean) => void;
  onNextDelayChange: (nextDelayMs: number) => void;
};

export type SyncTransport<TPayload> = {
  start: (handlers: SyncTransportHandlers<TPayload>) => () => void;
  refreshNow: () => Promise<void>;
  getNextDelayMs: () => number;
};

type PollingTransportOptions<TPayload> = {
  fetchLatest: () => Promise<TPayload>;
  pollingConfig?: PollingConfig;
  getErrorMessage?: (error: unknown) => string;
};

function getDefaultErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to refresh data.";
}

export function createPollingSyncTransport<TPayload>(
  options: PollingTransportOptions<TPayload>
): SyncTransport<TPayload> {
  const pollingConfig = options.pollingConfig ?? getDefaultPollingConfig();
  const getErrorMessage = options.getErrorMessage ?? getDefaultErrorMessage;
  let nextDelayMs = pollingConfig.baseIntervalMs;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isActive = false;
  let handlers: SyncTransportHandlers<TPayload> | null = null;

  const clearTimer = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const scheduleNextRefresh = () => {
    if (!isActive || !handlers) {
      return;
    }

    handlers.onNextDelayChange(nextDelayMs);

    timeoutId = setTimeout(async () => {
      await executeRefresh();
    }, nextDelayMs);
  };

  const executeRefresh = async () => {
    if (!handlers) {
      return;
    }

    handlers.onRefreshingChange(true);

    let wasSuccessful = false;

    try {
      const payload = await options.fetchLatest();
      handlers.onData(payload);
      handlers.onError(null);
      wasSuccessful = true;
    } catch (error) {
      handlers.onError(getErrorMessage(error));
    } finally {
      handlers.onRefreshingChange(false);
    }

    nextDelayMs = getNextPollDelay(nextDelayMs, wasSuccessful, pollingConfig);
    scheduleNextRefresh();
  };

  return {
    start(nextHandlers) {
      handlers = nextHandlers;
      isActive = true;
      nextDelayMs = pollingConfig.baseIntervalMs;
      scheduleNextRefresh();

      return () => {
        isActive = false;
        handlers = null;
        clearTimer();
      };
    },
    async refreshNow() {
      if (!isActive) {
        return;
      }

      clearTimer();
      nextDelayMs = pollingConfig.baseIntervalMs;

      if (handlers) {
        handlers.onNextDelayChange(nextDelayMs);
      }

      await executeRefresh();
    },
    getNextDelayMs() {
      return nextDelayMs;
    }
  };
}
