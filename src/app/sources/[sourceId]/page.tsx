import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shell";
import { SourceViewerContent } from "@/components/sources/source-viewer-content";
import { getModuleById, getSourceById } from "@/lib/data/mock-data";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const source = getSourceById(sourceId);

  if (!source) notFound();
  const moduleInfo = getModuleById(source.moduleId);

  return (
    <AppShell>
      <SourceViewerContent
        source={{
          id: source.id,
          moduleId: source.moduleId,
          folderId: source.folderId,
          title: source.title,
          author: source.author,
          year: source.year,
          type: source.type,
          status: source.status,
          tags: source.tags,
          citation: source.citation,
          pageCount: source.pageCount,
          uploadedAt: source.uploadedAt,
          summary: source.summary || "",
          mainArgument: source.mainArgument || "",
          keyConcepts: source.keyConcepts,
          extractedText: "",
          errorMessage: "",
        }}
        moduleTitle={moduleInfo?.title || ""}
        moduleCode={moduleInfo?.code || ""}
        chunks={[]}
      />
    </AppShell>
  );
}
