import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspaceData } from "@/components/modules/module-workspace-data";
import { DEFAULT_WORKSPACE_TAB, isWorkspaceTab } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { moduleId } = await params;
  const resolvedSearchParams = await searchParams;
  const rawTab =
    typeof resolvedSearchParams.tab === "string"
      ? resolvedSearchParams.tab
      : DEFAULT_WORKSPACE_TAB;
  const tab = isWorkspaceTab(rawTab) ? rawTab : DEFAULT_WORKSPACE_TAB;

  return (
    <AppShell>
      <ModuleWorkspaceData moduleId={moduleId} activeTab={tab} />
    </AppShell>
  );
}
