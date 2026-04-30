import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { EssayWorkspaceContent } from "@/components/essays/essay-workspace-content";
import { getEssayById } from "@/lib/services/data-service";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { essayId } = await params;
  const essay = await getEssayById(session.user.id, essayId);

  if (!essay) notFound();

  return (
    <AppShell user={session.user}>
      <EssayWorkspaceContent
          essay={{
            id: essay.id,
            moduleId: essay.moduleId,
            title: essay.title,
            question: essay.question || "",
            wordCount: essay.targetWordCount,
            thesis: essay.thesis || "",
            status: essay.status,
            createdAt: essay.createdAt.toISOString(),
            moduleTitle: essay.module?.title || "",
            moduleCode: essay.module?.code || "",
            draftContent: essay.draftContent || "",
            sections: essay.sections.map((s) => ({
            id: s.id,
            heading: s.title,
            purpose: s.purpose || "",
            points: s.notes ? JSON.parse(s.notes) : [],
            evidenceIds: [],
            wordAllocation: s.targetWordCount,
            displayOrder: s.displayOrder,
          })),
          evidence: essay.evidence.map((e) => ({
            id: e.id,
            sourceId: e.sourceId || "",
            sourceTitle: e.source?.title || "Unknown source",
            quote: e.evidenceText || "",
            pageRange: e.citation || "",
            argumentUse: e.explanation || "",
            claim: e.claim,
          })),
        }}
      />
    </AppShell>
  );
}
