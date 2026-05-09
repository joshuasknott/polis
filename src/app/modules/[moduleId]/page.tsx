import { AppShell } from "@/components/layout/shell";
import { ModuleWorkspaceData } from "@/components/modules/module-workspace-data";

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
  const tab =
    typeof resolvedSearchParams.tab === "string"
      ? resolvedSearchParams.tab
      : "module-info";

  return (
    <AppShell>
      <ModuleWorkspaceData moduleId={moduleId} activeTab={tab} />
    </AppShell>
  );
}
