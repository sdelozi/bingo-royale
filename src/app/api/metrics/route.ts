import { NextResponse } from "next/server";
import { getMetricsSnapshot } from "@/server/observability/metrics";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      ...getMetricsSnapshot()
    },
    { status: 200 }
  );
}
