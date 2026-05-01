import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SourceLibraryContent } from "@/components/sources/source-library-content";
import { convexServer, api } from "@/lib/convex-server";

export default async function SourcesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const [sources, modules] = await Promise.all([
    convexServer.query(api.sources.getByUserId, { userId }),
    convexServer.query(api.modules.getByUserId, { userId }),
  ]);

  return (
    <AppShell user={session.user}>
      <SourceLibraryContent
        sources={sources.map((s: any) => ({
          id: s.id as string,
          moduleId: s.moduleId as string,
          folderId: s.folderId || "",
          title: s.title as string,
          author: s.authors || "",
          year: s.year || 2026,
          type: s.type as "journal_article",
          status: s.status === "ready" ? "processed" : s.status === "error" ? "failed" : "processing",
          tags: s.concepts ? s.concepts.split(",").map((c: string) => c.trim()) : [],
          citation: `${s.authors} (${s.year})`,
          pageCount: Math.max(1, Math.ceil((s.wordCount || 0) / 300)),
          uploadedAt: new Date(s._creationTime).toISOString(),
          summary: s.summary || "",
          mainArgument: s.keyArguments || "",
          keyConcepts: s.concepts ? s.concepts.split(",").map((c: string) => c.trim()) : [],
          moduleName: s.module?.title || "",
        }))}
        modules={modules.map((m: any) => ({
          id: m.id as string,
          title: m.title as string,
          code: m.code as string,
        }))}
      />
    </AppShell>
  );
}
