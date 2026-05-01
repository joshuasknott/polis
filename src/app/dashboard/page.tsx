import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { convexServer, api } from "@/lib/convex-server";
import { normalizeSourceStatus } from "@/lib/polis/status";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const modules = await convexServer.query(api.modules.getByUserId, { userId });

  const workspaces = await Promise.all(
    modules.map(async (module: any) => {
      const [sources, knowledgePages, contextPack] = await Promise.all([
        convexServer.query(api.sources.getByModuleId, { userId, moduleId: module.id }),
        convexServer.query(api.knowledgePages.listByModule, { userId, moduleId: module.id }),
        convexServer.query(api.contextPacks.getActive, { userId, moduleId: module.id }),
      ]);
      const plan = await convexServer.query(api.plans.getCurrent, {
        userId,
        moduleId: module.id,
        contextPackId: contextPack?.id,
      });
      const draft = await convexServer.query(api.drafts.getCurrent, {
        userId,
        moduleId: module.id,
        planId: plan?.id,
      });

      return {
        id: module.id as string,
        workspaceId: module.id as string,
        title: module.title as string,
        name: module.name as string,
        code: module.code as string,
        moduleCode: module.moduleCode as string,
        academicYear: module.academicYear || "",
        semester: module.semester || "",
        description: module.description || "",
        assessmentTitle: module.assessmentTitle || "",
        assessmentQuestion: module.assessmentQuestion || "",
        deadline: module.deadline || "",
        targetGrade: module.targetGrade || "",
        referencingStyle: module.referencingStyle || "Harvard",
        currentStage: module.currentStage || "setup",
        sourceCount: sources.length,
        processedSourceCount: sources.filter((source: any) => normalizeSourceStatus(source.status) === "processed").length,
        knowledgePageCount: knowledgePages.length,
        noteCount: 0,
        essayProjectCount: 0,
        lastActivityAt: module.updatedAt || new Date(module._creationTime).toISOString(),
        color: module.colour || "#1e3a5f",
        sources: sources.map((source: any) => ({
          id: source.id as string,
          moduleId: source.moduleId as string,
          folderId: source.folderId || "",
          title: source.title as string,
          author: source.author || source.authors || "Unknown",
          authors: source.authors || source.author || "Unknown",
          year: source.year || new Date().getFullYear(),
          type: source.type || "reading",
          status: normalizeSourceStatus(source.status),
          relevance: source.relevance || "unknown",
          tags: source.tags || [],
          citation: source.citation || "",
          pageCount: Math.max(1, Math.ceil((source.wordCount || 0) / 300)),
          uploadedAt: source.createdAt || new Date(source._creationTime).toISOString(),
          summary: source.summary || "",
          mainArgument: source.keyArguments || "",
          keyConcepts: source.tags || [],
        })),
        knowledgePages,
        contextPack,
        plan,
        draft,
      };
    }),
  );

  return (
    <AppShell user={session.user}>
      <DashboardContent
        user={{ name: session.user.name || "Student" }}
        workspaces={workspaces}
      />
    </AppShell>
  );
}
