import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { logError } from "@/server/observability/logger";

export async function GET() {
  try {
    await db.$queryRawUnsafe("SELECT 1");

    return NextResponse.json(
      {
        status: "ok",
        checks: {
          app: "ok",
          db: "ok"
        },
        generatedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    logError("api.health.db_check_failed", error, {
      route: "/api/health",
      method: "GET"
    });

    return NextResponse.json(
      {
        status: "degraded",
        checks: {
          app: "ok",
          db: "down"
        },
        generatedAt: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
