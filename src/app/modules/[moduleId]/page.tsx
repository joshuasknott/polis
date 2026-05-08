import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspace } from "@/components/modules/module-workspace";
import {
  getFoldersForModule,
  getModuleById,
  getSourcesForModule,
  mockEssayProject,
} from "@/lib/data/mock-data";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const mod = getModuleById(moduleId);

  if (!mod) notFound();

  const sources = getSourcesForModule(moduleId);
  const folders = getFoldersForModule(moduleId);
  const essays = mockEssayProject.moduleId === moduleId ? [mockEssayProject] : [];

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = source.folderId || "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  return (
    <AppShell>
      <ModuleWorkspace
        module={{
          id: mod.id,
          title: mod.title,
          code: mod.code,
          description: mod.description,
          colour: mod.color,
        }}
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
        essays={essays.map((e) => ({
          id: e.id,
          title: e.title,
          status: e.status,
        }))}
      />
    </AppShell>
  );
}
