import { AppShell } from "@/components/layout/shell";
import { SourceViewerData } from "@/components/sources/source-viewer-data";

export const dynamic = "force-dynamic";

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
