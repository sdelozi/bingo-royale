import { NextResponse } from "next/server";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit, rateLimitPolicies } from "@/server/rate-limit/request-rate-limit";
import { getAuthSession } from "@/server/auth/session";
import {
  GroupAccessError,
  PlayerBoardSquareNotFoundError,
  ZodError,
  updatePlayerBoardMark
} from "@/server/services/groups/board-marking";
import { GroupBoardTemplateMissingError, getOrCreatePlayerBoardForGroup } from "@/server/services/groups/player-board";

type Params = {
  params: {
    groupId: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const board = await getOrCreatePlayerBoardForGroup(userId, params.groupId);

    return NextResponse.json(
      {
        ...board,
        generatedAt: new Date()
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    }

    if (error instanceof GroupBoardTemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    logError("api.groups.board.read.unexpected_error", error, {
      route: "/api/groups/[groupId]/board",
      method: "GET",
      groupId: params.groupId
    });

    return NextResponse.json({ error: "Unable to load board right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    enforceRateLimit({
      scope: "group-board-mark",
      request,
      userId,
      policy: rateLimitPolicies.boardMark
    });

    const body = await request.json();
    const result = await updatePlayerBoardMark(userId, params.groupId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: "Too many board updates. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds)
          }
        }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid mark update payload." }, { status: 400 });
    }

    if (error instanceof GroupAccessError || error instanceof PlayerBoardSquareNotFoundError) {
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    }

    if (error instanceof GroupBoardTemplateMissingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    logError("api.groups.board.mark.unexpected_error", error, {
      route: "/api/groups/[groupId]/board",
      method: "PATCH",
      groupId: params.groupId
    });

    return NextResponse.json({ error: "Unable to update board mark right now." }, { status: 500 });
  }
}