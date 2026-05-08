import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspace } from "@/components/modules/module-workspace";
import {
  getFoldersForModule,
  getAssignmentsForModule,
  getModuleById,
  getSourcesForModule,
} from "@/lib/data/mock-data";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { moduleId } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : "info";
  const mod = getModuleById(moduleId);

  if (!mod) notFound();

  const modContext = {
    id: mod.id,
    title: mod.title,
    code: mod.code,
    description: mod.description,
    colour: mod.color,
    activeTab: tab,
  };

  const sources = getSourcesForModule(moduleId);
  const folders = getFoldersForModule(moduleId);
  const assignments = getAssignmentsForModule(moduleId);

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = source.folderId || "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  return (
    <AppShell moduleContext={modContext}>
      <ModuleWorkspace
        module={modContext}
        folders={folders.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          sortOrder: f.sortOrder,
          sourceCount: folderSourceCounts[f.id] || 0,
        }))}
        sources={sources.map((s) => ({
          id: s.id,
          folderId: s.folderId,
          title: s.title,
          author: s.author,
          year: s.year,
          type: s.type,
          status: s.status,
          tags: s.tags,
          summary: s.summary || "",
          pageCount: s.pageCount,
        }))}
        essays={assignments.map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          status: assignment.stage,
        }))}
      />
    </AppShell>
  );
}
