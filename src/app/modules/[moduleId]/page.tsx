import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspace } from "@/components/modules/module-workspace";
import { convexServer, api } from "@/lib/convex-server";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const { moduleId } = await params;
  const [mod, sources, essays] = await Promise.all([
    convexServer.query(api.modules.getById, { userId: session.user.id, moduleId }),
    convexServer.query(api.sources.getByModuleId, { userId: session.user.id, moduleId }),
    convexServer.query(api.essays.getByModuleId, { userId: session.user.id, moduleId }),
  ]);

  if (!mod) notFound();

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = (source as any).folderId || "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  return (
    <AppShell user={session.user}>
      <ModuleWorkspace
        module={{
          id: mod.id as string,
          title: mod.title,
          code: mod.code,
          description: mod.description || "",
          colour: mod.colour || "#1e3a5f",
        }}
        folders={mod.folders.map((f: any) => ({
          id: f.id as string,
          name: f.name as string,
          type: f.type || "custom",
          sortOrder: f.displayOrder ?? 0,
          sourceCount: folderSourceCounts[f.id as string] || 0,
        }))}
        sources={sources.map((s: any) => ({
          id: (s as any)._id as string,
          folderId: (s as any).folderId || "",
          title: s.title as string,
          author: (s as any).authors || "",
          year: (s as any).year || 2026,
          type: (s as any).type || "journal_article",
          status: (s as any).status === "ready" ? "processed" : (s as any).status === "error" ? "failed" : "processing",
          tags: (s as any).concepts ? (s as any).concepts.split(",").map((c: string) => c.trim()) : [],
          summary: (s as any).summary || "",
          pageCount: Math.max(1, Math.ceil(((s as any).wordCount || 0) / 300)),
        }))}
        essays={essays.map((e: any) => ({
          id: e._id as string,
          title: e.title as string,
          status: (e as any).status || "planning",
        }))}
      />
    </AppShell>
  );
}
