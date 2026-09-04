import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logError } from "@/server/observability/logger";
import { RateLimitExceededError, enforceRateLimit, rateLimitPolicies } from "@/server/rate-limit/request-rate-limit";
import { getAuthSession } from "@/server/auth/session";
import { GroupNotFoundError, joinGroupForUser } from "@/server/services/groups/join-group";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    enforceRateLimit({
      scope: "group-join",
      request,
      userId,
      policy: rateLimitPolicies.groupJoin
    });

    const body = await request.json();
    const membership = await joinGroupForUser(userId, body);
    return NextResponse.json(membership, { status: 200 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: "Too many join attempts. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds)
          }
        }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Provide a valid invite code or share token." },
        { status: 400 }
      );
    }

    if (error instanceof GroupNotFoundError) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    logError("api.groups.join.unexpected_error", error, {
      route: "/api/groups/join",
      method: "POST"
    });

    return NextResponse.json({ error: "Unable to join group right now." }, { status: 500 });
  }
}
