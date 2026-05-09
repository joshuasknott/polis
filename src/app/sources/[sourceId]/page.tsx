import { AppShell } from "@/components/layout/shell";
import { SourceViewerData } from "@/components/sources/source-viewer-data";

export default async function SourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;

  return (
    <AppShell>
      <SourceViewerData sourceId={sourceId} />
    </AppShell>
  );
}
