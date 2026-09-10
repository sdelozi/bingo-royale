import { env } from "@/server/config/env";

function normalizeOrigin(rawOrigin: string): string {
  const trimmed = rawOrigin.trim();

  if (!trimmed) {
    return trimmed;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export function getShareOrigin(fallbackOrigin?: string): string {
  const configuredOrigin = env.shareBaseUrl?.trim() || env.appUrl;

  return normalizeOrigin(configuredOrigin || fallbackOrigin || "");
}
