import { ModuleWorkspaceData } from "@/components/modules/module-workspace-data";
import { normalizeWorkspaceTab } from "@/lib/types";

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
      : undefined;
  const tab = normalizeWorkspaceTab(rawTab);

  return <ModuleWorkspaceData moduleId={moduleId} activeTab={tab} />;
}
