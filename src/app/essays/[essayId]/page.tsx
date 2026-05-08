import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { EssayWorkspaceContent } from "@/components/essays/essay-workspace-content";
import { getModuleById, getSourceById, mockEssayProject } from "@/lib/data/mock-data";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const essay = mockEssayProject.id === essayId ? mockEssayProject : undefined;

  if (!essay) notFound();
  const moduleInfo = getModuleById(essay.moduleId);

  return (
    <AppShell>
      <EssayWorkspaceContent
        essay={{
          id: essay.id,
          moduleId: essay.moduleId,
          title: essay.title,
          question: essay.question,
          wordCount: essay.wordCount,
          thesis: essay.thesis,
          status: essay.status,
          createdAt: "",
          moduleTitle: moduleInfo?.title || "",
          moduleCode: moduleInfo?.code || "",
          draftContent: essay.draftContent,
          sections: essay.structure.map((s, index) => ({
            id: s.id,
            heading: s.heading,
            purpose: "",
            points: s.points,
            evidenceIds: s.evidenceIds,
            wordAllocation: s.wordAllocation,
            displayOrder: index,
          })),
          evidence: essay.evidenceBank.map((e) => ({
            id: e.id,
            sourceId: e.sourceId,
            sourceTitle: getSourceById(e.sourceId)?.title || e.sourceTitle,
            quote: e.quote,
            pageRange: e.pageRange,
            argumentUse: e.argumentUse,
            claim: e.argumentUse,
          })),
        }}
      />
    </AppShell>
  );
}
