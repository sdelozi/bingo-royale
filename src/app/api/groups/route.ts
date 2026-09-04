import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logError } from "@/server/observability/logger";
import { getAuthSession } from "@/server/auth/session";
import { createGroupForUser } from "@/server/services/groups/create-group";

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const group = await createGroupForUser(userId, body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please provide a valid group name." }, { status: 400 });
    }

    logError("api.groups.create.unexpected_error", error, {
      route: "/api/groups",
      method: "POST"
    });

    return NextResponse.json({ error: "Unable to create group right now." }, { status: 500 });
  }
}
