import { getOptionalEnv } from "@/server/config/env-helpers";

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
  const configuredOrigin =
    getOptionalEnv("NEXT_PUBLIC_SHARE_BASE_URL") || getOptionalEnv("NEXT_PUBLIC_APP_URL") || fallbackOrigin || "";

  return normalizeOrigin(configuredOrigin);
}
