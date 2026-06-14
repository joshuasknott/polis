import { AppShell } from "@/components/layout/shell";
import { AssignmentWorkspaceData } from "@/components/assignments/assignment-workspace-data";
import { ASSESSMENT_TABS, type AssessmentTab } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string; assignmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { moduleId, assignmentId } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedTab =
    typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : "brief";
  const activeTab: AssessmentTab = ASSESSMENT_TABS.includes(
    requestedTab as AssessmentTab,
  )
    ? (requestedTab as AssessmentTab)
    : "brief";

  const modContext = {
    id: moduleId,
    title: "",
    code: "",
    description: "",
    colour: undefined,
    activeTab: "assignments" as const,
  };

  return (
    <AppShell moduleContext={modContext}>
      <AssignmentWorkspaceData
        moduleId={moduleId}
        assignmentId={assignmentId}
        activeTab={activeTab}
      />
    </AppShell>
  );
}
