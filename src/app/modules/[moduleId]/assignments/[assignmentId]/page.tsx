import { AppShell } from "@/components/layout/shell";
import { AssignmentWorkspaceData } from "@/components/assignments/assignment-workspace-data";
import { PRODUCTION_STAGES, type ProductionStage } from "@/lib/types";

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
  const requestedStage =
    typeof resolvedSearchParams.stage === "string" ? resolvedSearchParams.stage : "ingest";
  const stage: ProductionStage = PRODUCTION_STAGES.includes(requestedStage as ProductionStage)
    ? (requestedStage as ProductionStage)
    : "ingest";

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
        activeStage={stage}
      />
    </AppShell>
  );
}
