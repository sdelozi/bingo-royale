import { incrementCounter } from "./metrics";

type StructuredLogContext = Record<string, unknown>;

function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Non-Error thrown value",
    value: error
  };
}

export function logError(event: string, error: unknown, context: StructuredLogContext = {}) {
  incrementCounter("errors.unexpected_total");
  incrementCounter(`errors.event.${event}`);

  const payload = {
    level: "error",
    timestamp: new Date().toISOString(),
    event,
    context,
    error: toErrorPayload(error)
  };

  console.error(JSON.stringify(payload));
}
