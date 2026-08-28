import { NextResponse } from "next/server";
import { ZodError } from "zod";
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

    return NextResponse.json({ error: "Unable to create group right now." }, { status: 500 });
  }
}
