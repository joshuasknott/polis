"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ModuleWorkspace } from "./module-workspace";
import { mapFolder, mapSource, mapAssignment } from "@/lib/convex-ui-mappers";
import { Loader2 } from "lucide-react";

interface ModuleWorkspaceDataProps {
  moduleId: string;
  activeTab: string;
}

export function ModuleWorkspaceData({ moduleId, activeTab }: ModuleWorkspaceDataProps) {
  const bundle = useQuery(api.modules.getWorkspaceBundle, {
    moduleId: moduleId as Id<"modules">,
  });

  if (bundle === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading workspace…</p>
      </div>
    );
  }

  if (bundle === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <p className="text-sm font-medium">Module not found.</p>
        <p className="text-xs">It may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const { module: mod, folders, sources, assignments } = bundle;

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = source.folderId ?? "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  const modContext = {
    id: mod._id,
    title: mod.title,
    code: mod.code,
    description: mod.description ?? "",
    colour: mod.colour ?? "var(--color-border)",
    activeTab,
  };

  return (
    <ModuleWorkspace
      module={modContext}
      folders={folders.map((f) => mapFolder(f, folderSourceCounts[f._id] ?? 0))}
      sources={sources.map(mapSource)}
      assignments={assignments.map(mapAssignment)}
    />
  );
}
