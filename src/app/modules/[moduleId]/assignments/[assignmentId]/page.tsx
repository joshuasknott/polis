import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { AssignmentWorkspaceShell } from "@/components/assignments/assignment-workspace-shell";
import {
  getModuleById,
  getAssignmentsForModule,
  getArgumentsForAssignment,
  getLatestDraftForAssignment,
  mockReviews,
  mockJudgements,
  mockSources,
} from "@/lib/data/mock-data";

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

  const args = getArgumentsForAssignment(assignmentId);
  const draft = getLatestDraftForAssignment(assignmentId);
  const review = mockReviews.find(r => r.draftId === draft?.id);
  const judgements = mockJudgements.filter(j => j.assignmentId === assignmentId);
  const sources = mockSources.filter(s => assignment.selectedSourceIds.includes(s.id));

  const modContext = {
    id: mod.id,
    title: mod.title,
    code: mod.code,
    description: mod.description,
    colour: mod.color,
    activeTab: "assignments",
  };

  return (
    <AppShell moduleContext={modContext}>
      <AssignmentWorkspaceShell 
        module={mod} 
        assignment={assignment} 
        activeStage={stage}
        arguments={args}
        draft={draft}
        review={review}
        judgements={judgements}
        sources={sources}
      />
    </AppShell>
  );
}