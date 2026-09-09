import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupTemplateForm } from "@/components/groups/group-template-form";
import { getCurrentUser } from "@/server/auth/session";
import {
  GroupAccessError,
  GroupForbiddenError,
  getGroupTemplateEditorData
} from "@/server/services/groups/template-management";

type GroupTemplatePageProps = {
  params: {
    groupId: string;
  };
};

export default async function GroupTemplatePage({ params }: GroupTemplatePageProps) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  try {
    const data = await getGroupTemplateEditorData(user.id, params.groupId);

    return (
      <main className="ui-stack">
        <h1>Template Editor: {data.groupName}</h1>
        <GroupTemplateForm
          groupId={data.groupId}
          initialFreeSpaceObjective={data.freeSpaceObjective}
          initialObjectives={data.objectives}
          initialFreeSpaceMarkedByDefault={data.freeSpaceMarkedByDefault}
          hasExistingBoards={data.hasExistingBoards}
          currentVersion={data.currentVersion}
        />
        <div className="ui-actions">
          <Link href={`/groups/${data.groupId}`}>Back to group</Link>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupForbiddenError) {
      return (
        <main className="ui-stack">
          <h1>Admin only</h1>
          <p className="ui-empty-state">Only group admins can edit the board template.</p>
          <div className="ui-actions">
            <Link href={`/groups/${params.groupId}`}>Back to group</Link>
          </div>
        </main>
      );
    }

    if (error instanceof GroupAccessError) {
      notFound();
    }

    throw error;
  }
}
