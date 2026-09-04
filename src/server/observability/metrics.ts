type CounterMap = Map<string, number>;

const counters: CounterMap = new Map();

export function incrementCounter(name: string, amount = 1) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Metrics counter increment amount must be a positive number.");
  }

  counters.set(name, (counters.get(name) ?? 0) + amount);
}

export function getMetricsSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryRssBytes: process.memoryUsage().rss,
    counters: Object.fromEntries([...counters.entries()].sort((left, right) => left[0].localeCompare(right[0])))
  };
}

export function resetMetricsForTests() {
  counters.clear();
}
