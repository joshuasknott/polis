import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SourceViewerContent } from "@/components/sources/source-viewer-content";
import { getSourceById } from "@/lib/services/data-service";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { sourceId } = await params;
  const source = await getSourceById(session.user.id, sourceId);

  if (!source) notFound();

  return (
    <AppShell user={session.user}>
      <SourceViewerContent
        source={{
          id: source.id,
          moduleId: source.moduleId,
          folderId: source.folderId || "",
          title: source.title,
          author: source.authors,
          year: source.year,
          type: source.type,
          status: source.status === "ready" ? "processed" : source.status === "error" ? "failed" : "processing",
          tags: source.concepts ? source.concepts.split(",").map((c) => c.trim()) : [],
          citation: `${source.authors} (${source.year})`,
          pageCount: Math.max(1, Math.ceil((source.wordCount || 0) / 300)),
          uploadedAt: source.createdAt.toISOString(),
          summary: source.summary || "",
          mainArgument: source.keyArguments || "",
          keyConcepts: source.concepts ? source.concepts.split(",").map((c) => c.trim()) : [],
          extractedText: source.extractedText || "",
          errorMessage: source.errorMessage || "",
        }}
        moduleTitle={source.module?.title || ""}
        moduleCode={source.module?.code || ""}
        chunks={source.chunks.map((c) => ({
          id: c.id,
          text: c.text,
          chunkIndex: c.chunkIndex,
        }))}
      />
    </AppShell>
  );
}
