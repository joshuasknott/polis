import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspace } from "@/components/modules/module-workspace";
import { getModuleById, getModuleSources, getEssaysByModule } from "@/lib/services/data-service";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { moduleId } = await params;
  const [mod, sources, essays] = await Promise.all([
    getModuleById(session.user.id, moduleId),
    getModuleSources(moduleId),
    getEssaysByModule(session.user.id, moduleId),
  ]);

  if (!mod) notFound();

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = source.folderId || "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  return (
    <AppShell user={session.user}>
      <ModuleWorkspace
        module={{
          id: mod.id,
          title: mod.title,
          code: mod.code,
          description: mod.description,
          colour: mod.colour,
        }}
        folders={mod.folders.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          sortOrder: f.displayOrder,
          sourceCount: folderSourceCounts[f.id] || 0,
        }))}
        sources={sources.map((s) => ({
          id: s.id,
          folderId: s.folderId || "",
          title: s.title,
          author: s.authors,
          year: s.year,
          type: s.type,
          status: s.status === "ready" ? "processed" : s.status === "error" ? "failed" : "processing",
          tags: s.concepts ? s.concepts.split(",").map((c) => c.trim()) : [],
          summary: s.summary || "",
          pageCount: Math.max(1, Math.ceil((s.wordCount || 0) / 300)),
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
