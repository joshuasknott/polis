import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { EssayWorkspaceContent } from "@/components/essays/essay-workspace-content";
import { convexServer, api } from "@/lib/convex-server";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ essayId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const { essayId } = await params;
  const essay = await convexServer.query(api.essays.getById, {
    userId: session.user.id,
    essayId,
  });

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
          createdAt: new Date(essay._creationTime).toISOString(),
          moduleTitle: essay.module?.title || "",
          moduleCode: essay.module?.code || "",
          draftContent: essay.draftContent || "",
          sections: essay.sections.map((s: any) => ({
            id: s.id as string,
            heading: s.title as string,
            purpose: s.purpose || "",
            points: s.notes ? JSON.parse(s.notes) : [],
            evidenceIds: [],
            wordAllocation: s.targetWordCount ?? 0,
            displayOrder: s.displayOrder ?? 0,
          })),
          evidence: essay.evidence.map((e: any) => ({
            id: e.id as string,
            sourceId: e.sourceId || "",
            sourceTitle: e.source?.title || "Unknown source",
            quote: e.evidenceText || "",
            pageRange: e.citation || "",
            argumentUse: e.explanation || "",
            claim: e.claim as string,
          })),
        }}
      />
    </AppShell>
  );
}
