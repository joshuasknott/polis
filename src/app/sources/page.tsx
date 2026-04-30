import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SourceLibraryContent } from "@/components/sources/source-library-content";
import { getUserSources, getUserModules } from "@/lib/services/data-service";

export default async function SourcesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [sources, modules] = await Promise.all([
    getUserSources(session.user.id),
    getUserModules(session.user.id),
  ]);

  return (
    <AppShell user={session.user}>
      <SourceLibraryContent
        sources={sources.map((s) => ({
          id: s.id,
          moduleId: s.moduleId,
          folderId: s.folderId || "",
          title: s.title,
          author: s.authors,
          year: s.year,
          type: s.type as "journal_article",
          status: s.status === "ready" ? "processed" : s.status === "error" ? "failed" : "processing",
          tags: s.concepts ? s.concepts.split(",").map((c) => c.trim()) : [],
          citation: `${s.authors} (${s.year})`,
          pageCount: Math.max(1, Math.ceil((s.wordCount || 0) / 300)),
          uploadedAt: s.createdAt.toISOString(),
          summary: s.summary || "",
          mainArgument: s.keyArguments || "",
          keyConcepts: s.concepts ? s.concepts.split(",").map((c) => c.trim()) : [],
          moduleName: s.module?.title || "",
        }))}
        modules={modules.map((m) => ({
          id: m.id,
          title: m.title,
          code: m.code,
        }))}
      />
    </AppShell>
  );
}
