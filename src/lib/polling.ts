const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_POLL_MAX_INTERVAL_MS = 120000;

export type PollingConfig = {
  baseIntervalMs: number;
  maxIntervalMs: number;
};

function parsePositiveInt(rawValue: string | undefined, fallback: number) {
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getPollingConfigFromEnv(env: Record<string, string | undefined>): PollingConfig {
  const baseIntervalMs = parsePositiveInt(env.NEXT_PUBLIC_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
  const configuredMaxIntervalMs = parsePositiveInt(env.NEXT_PUBLIC_POLL_MAX_INTERVAL_MS, DEFAULT_POLL_MAX_INTERVAL_MS);

  return {
    baseIntervalMs,
    maxIntervalMs: Math.max(baseIntervalMs, configuredMaxIntervalMs)
  };
}

export function getDefaultPollingConfig(): PollingConfig {
  return getPollingConfigFromEnv(process.env);
}

export function getNextPollDelay(previousDelayMs: number, wasSuccessful: boolean, config: PollingConfig) {
  if (wasSuccessful) {
    return config.baseIntervalMs;
  }

  return Math.min(config.maxIntervalMs, Math.max(config.baseIntervalMs, previousDelayMs * 2));
}
