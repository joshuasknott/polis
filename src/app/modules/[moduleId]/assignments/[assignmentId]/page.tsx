import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { AssignmentWorkspaceShell } from "@/components/assignments/assignment-workspace-shell";
import { getModuleById, getAssignmentsForModule } from "@/lib/data/mock-data";

export default async function AssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string; assignmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { moduleId, assignmentId } = await params;
  const resolvedSearchParams = await searchParams;
  const stage = typeof resolvedSearchParams.stage === "string" ? resolvedSearchParams.stage : "ingest";

  const mod = getModuleById(moduleId);
  if (!mod) notFound();

  const assignments = getAssignmentsForModule(moduleId);
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) notFound();

  const modContext = {
    id: mod.id,
    title: mod.title,
    code: mod.code,
    description: mod.description,
    colour: mod.color,
    activeTab: "assignments", // Keeps the sidebar focused on assignments
  };

  return (
    <AppShell moduleContext={modContext}>
      <AssignmentWorkspaceShell 
        module={mod} 
        assignment={assignment} 
        activeStage={stage} 
      />
    </AppShell>
  );
}