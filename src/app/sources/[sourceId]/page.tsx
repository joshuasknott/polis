import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SourceViewerContent } from "@/components/sources/source-viewer-content";
import { convexServer, api } from "@/lib/convex-server";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/signin");

  const { sourceId } = await params;
  const source = await convexServer.query(api.sources.getById, {
    userId: session.user.id,
    sourceId,
  });

  if (!source) notFound();

  return (
    <AppShell user={session.user}>
      <SourceViewerContent
        source={{
          id: source.id as string,
          moduleId: source.moduleId as string,
          folderId: source.folderId || "",
          title: source.title as string,
          author: source.authors || "",
          year: source.year || 2026,
          type: source.type as string,
          status: source.status === "ready" ? "processed" : source.status === "error" ? "failed" : "processing",
          tags: (source as any).concepts ? (source as any).concepts.split(",").map((c: string) => c.trim()) : [],
          citation: `${source.authors} (${source.year})`,
          pageCount: Math.max(1, Math.ceil((source.wordCount || 0) / 300)),
          uploadedAt: new Date(source._creationTime).toISOString(),
          summary: (source as any).summary || "",
          mainArgument: (source as any).keyArguments || "",
          keyConcepts: (source as any).concepts ? (source as any).concepts.split(",").map((c: string) => c.trim()) : [],
          extractedText: (source as any).extractedText || "",
          errorMessage: (source as any).errorMessage || "",
        }}
        moduleTitle={source.module?.title || ""}
        moduleCode={source.module?.code || ""}
        chunks={source.chunks.map((c: any) => ({
          id: c.id as string,
          text: c.text as string,
          chunkIndex: c.chunkIndex as number,
        }))}
      />
    </AppShell>
  );
}
