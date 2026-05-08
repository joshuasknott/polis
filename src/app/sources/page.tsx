import { AppShell } from "@/components/layout/shell";
import { SourceLibraryContent } from "@/components/sources/source-library-content";
import { getModuleById, mockModules, mockSources } from "@/lib/data/mock-data";

export default function SourcesPage() {
  return (
    <AppShell>
      <SourceLibraryContent
        sources={mockSources.map((s) => ({
          ...s,
          moduleName: getModuleById(s.moduleId)?.title || "",
        }))}
        modules={mockModules.map((m) => ({
          id: m.id,
          title: m.title,
          code: m.code,
        }))}
      />
    </AppShell>
  );
}
