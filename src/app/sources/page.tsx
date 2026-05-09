import { AppShell } from "@/components/layout/shell";
import { SourceLibraryData } from "@/components/sources/source-library-data";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  return (
    <AppShell>
      <SourceLibraryData />
    </AppShell>
  );
}
