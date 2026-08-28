import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/auth/session";
import {
  GroupAccessError,
  GroupForbiddenError,
  TemplateEditConfirmationRequiredError,
  ZodError,
  saveGroupTemplateForGroup
} from "@/server/services/groups/template-management";

type Params = {
  params: {
    groupId: string;
  };
};

export async function POST(request: Request, { params }: Params) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await saveGroupTemplateForGroup(userId, params.groupId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid template payload." }, { status: 400 });
    }

    if (error instanceof GroupAccessError) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (error instanceof GroupForbiddenError) {
      return NextResponse.json({ error: "Only admins can manage templates." }, { status: 403 });
    }

    if (error instanceof TemplateEditConfirmationRequiredError) {
      return NextResponse.json(
        {
          error: error.message,
          requiresConfirmation: true,
          impactedBoardCount: error.impactedBoardCount
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Unable to save board template right now." }, { status: 500 });
  }
}
