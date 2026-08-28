import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import {
  GroupAccessError,
  GroupBoardTemplateMissingError,
  PlayerBoardSquareNotFoundError,
  ZodError,
  updatePlayerBoardMark
} from "@/server/services/groups/board-marking";

type Params = {
  params: {
    groupId: string;
  };
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await updatePlayerBoardMark(userId, params.groupId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid mark update payload." }, { status: 400 });
    }

    if (error instanceof GroupAccessError || error instanceof PlayerBoardSquareNotFoundError) {
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    }

    if (error instanceof GroupBoardTemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to update board mark right now." }, { status: 500 });
  }
}