import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ModuleShell } from "@/components/modules/module-shell";
import { convexServer, api } from "@/lib/convex-server";
import { normalizeSourceStatus } from "@/lib/polis/status";
import type { PolisSection } from "@/lib/types";

const validSections: PolisSection[] = ["overview", "sources", "knowledge", "context", "plan", "draft", "final"];

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ section?: string; assignmentId?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const { moduleId } = await params;
  const { section, assignmentId } = await searchParams;
  const activeSection = validSections.includes(section as PolisSection) ? section as PolisSection : "overview";
  const userId = session.user.id;

  const [mod, sources, knowledgePages, contextPacks, assignments, moduleProfile] = await Promise.all([
    convexServer.query(api.modules.getById, { userId, moduleId }),
    convexServer.query(api.sources.getByModuleId, { userId, moduleId }),
    convexServer.query(api.knowledgePages.listByModule, { userId, moduleId }),
    convexServer.query(api.contextPacks.listByModule, { userId, moduleId }),
    convexServer.query(api.assignments.listByModule, { userId, moduleId }),
    convexServer.query(api.moduleProfiles.getByModule, { userId, moduleId }),
  ]);

  if (!mod) notFound();

  const activeContextPack = await convexServer.query(api.contextPacks.getActive, {
    userId,
    moduleId,
    assignmentId: assignmentId || undefined,
  });
  const currentPlan = await convexServer.query(api.plans.getCurrent, {
    userId,
    moduleId,
    contextPackId: activeContextPack?.id,
    assignmentId: assignmentId || undefined,
  });
  const currentDraft = await convexServer.query(api.drafts.getCurrent, {
    userId,
    moduleId,
    planId: currentPlan?.id,
    assignmentId: assignmentId || undefined,
  });
  const feedback = currentDraft
    ? await convexServer.query(api.feedback.listByDraft, { userId, draftId: currentDraft.id })
    : [];

  return (
    <AppShell user={session.user}>
      <ModuleShell
        module={{
          id: mod.id as string,
          title: mod.title,
          code: mod.code,
          description: mod.description || "",
          colour: mod.colour || "#1e3a5f",
          assessmentTitle: mod.assessmentTitle || "",
          assessmentQuestion: mod.assessmentQuestion || "",
          deadline: mod.deadline || "",
          targetGrade: mod.targetGrade || "",
          referencingStyle: mod.referencingStyle || "Harvard",
          currentStage: mod.currentStage || "setup",
        }}
        activeSection={activeSection}
        sources={sources.map((source: any) => ({
          id: source.id as string,
          moduleId: source.moduleId as string,
          folderId: source.folderId || "",
          title: source.title as string,
          author: source.author || source.authors || "Unknown",
          authors: source.authors || source.author || "Unknown",
          year: source.year || new Date().getFullYear(),
          type: source.type || "reading",
          status: normalizeSourceStatus(source.status, source.processingStatus),
          rawStatus: source.rawStatus,
          processingStatus: source.processingStatus,
          relevance: source.relevance || "unknown",
          tags: source.tags || [],
          citation: source.citation || "",
          fileUrl: source.fileUrl || "",
          storagePath: source.storagePath || "",
          extractedText: source.extractedText || "",
          rawText: source.rawText || "",
          pageCount: Math.max(1, Math.ceil((source.wordCount || 0) / 300)),
          uploadedAt: source.createdAt || new Date(source._creationTime).toISOString(),
          summary: source.summary || "",
          mainArgument: source.keyArguments || "",
          keyConcepts: source.tags || [],
          linkedKnowledgeCount: source.linkedKnowledgeCount || 0,
          fileName: source.fileName || "",
          fileType: source.fileType || "",
          fileSize: source.fileSize || 0,
          wordCount: source.wordCount || 0,
          errorMessage: source.errorMessage || "",
        }))}
        knowledgePages={knowledgePages}
        contextPacks={contextPacks}
        activeContextPack={activeContextPack}
        currentPlan={currentPlan}
        currentDraft={currentDraft}
        feedback={feedback}
        assignments={assignments}
        moduleProfile={moduleProfile}
        activeAssignmentId={assignmentId || null}
      />
    </AppShell>
  );
}
