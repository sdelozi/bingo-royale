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
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupTemplatePage({ params }: GroupTemplatePageProps) {
  const { groupId } = await params;
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  try {
    const data = await getGroupTemplateEditorData(user.id, groupId);

    return (
      <main className="ui-stack ui-page">
        <header className="ui-page-header">
          <h1 className="ui-page-title">Template Editor: {data.groupName}</h1>
          <p className="ui-page-subtitle">Configure the board objectives and decide whether the free-space starts marked.</p>
        </header>
        <nav className="ui-tab-row" aria-label="Group navigation">
          <Link className="ui-tab-link" href={`/groups/${data.groupId}`}>Details</Link>
          <Link className="ui-tab-link" href={`/groups/${data.groupId}/board`}>Board</Link>
          <Link className="ui-tab-link" href={`/groups/${data.groupId}/leaderboard`}>Leaderboard</Link>
          <Link className="ui-tab-link is-active" href={`/groups/${data.groupId}/template`}>Template</Link>
        </nav>

        <GroupTemplateForm
          groupId={data.groupId}
          initialFreeSpaceObjective={data.freeSpaceObjective}
          initialObjectives={data.objectives}
          initialFreeSpaceMarkedByDefault={data.freeSpaceMarkedByDefault}
          hasExistingBoards={data.hasExistingBoards}
          currentVersion={data.currentVersion}
        />
        <div className="ui-actions">
          <Link className="ui-link-button" href={`/groups/${data.groupId}`}>Back to group</Link>
          <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${data.groupId}/leaderboard`}>View leaderboard</Link>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof GroupForbiddenError) {
      return (
        <main className="ui-stack ui-page">
          <header className="ui-page-header">
            <h1 className="ui-page-title">Admin only</h1>
            <p className="ui-page-subtitle">Only admins can edit objectives and free-space defaults.</p>
          </header>
          <p className="ui-empty-state">Only group admins can edit the board template.</p>
          <div className="ui-actions">
            <Link className="ui-link-button ui-link-button-secondary" href={`/groups/${groupId}`}>Back to group</Link>
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
