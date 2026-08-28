import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthSession } from "@/server/auth/session";
import { GroupNotFoundError, joinGroupForUser } from "@/server/services/groups/join-group";

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const membership = await joinGroupForUser(userId, body);
    return NextResponse.json(membership, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Provide a valid invite code or share token." },
        { status: 400 }
      );
    }

    if (error instanceof GroupNotFoundError) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to join group right now." }, { status: 500 });
  }
}
