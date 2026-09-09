import { headers } from "next/headers";
import { env } from "@/server/config/env";

export function getRequestOrigin() {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return env.appUrl;
  }

  return `${protocol}://${host}`;
}
