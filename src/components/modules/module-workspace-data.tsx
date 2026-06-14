"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  mapCommandCenterAssignment,
  mapWorkspaceSource,
} from "@/lib/convex-ui-mappers";
import type { WorkspaceTab } from "@/lib/types";
import type { WorkspaceSectionData } from "./workspace-sections";
import { WorkspaceHome } from "./workspace-home";
import { WorkspaceImports } from "./workspace-imports";
import { WorkspaceAssessments } from "./workspace-assessments";
import { WorkspaceKnowledgeBase } from "./workspace-knowledge-base";
import { WorkspaceSettings } from "./workspace-settings";

interface ModuleWorkspaceDataProps {
  moduleId: string;
  activeTab: WorkspaceTab;
}

export function ModuleWorkspaceData({
  moduleId,
  activeTab,
}: ModuleWorkspaceDataProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const bundle = useQuery(
    api.modules.getWorkspaceBundle,
    isLoaded && isSignedIn ? { moduleId: moduleId as Id<"modules"> } : "skip",
  );

  const assignmentsWithCounts = useQuery(
    api.assignments.listWithSourceCounts,
    bundle !== null && bundle !== undefined
      ? { moduleId: moduleId as Id<"modules"> }
      : "skip",
  );

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
        <p className="text-sm font-medium text-foreground">Workspace not found.</p>
        <p className="text-xs">
          It may have been deleted or you may not have access.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 text-sm font-medium text-accent hover:underline"
        >
          Back to Workspaces
        </Link>
      </div>
    );
  }

  const { module: mod, folders, sources } = bundle;

  const folderSourceCounts: Record<string, number> = {};
  for (const source of sources) {
    const fid = source.folderId ?? "unassigned";
    folderSourceCounts[fid] = (folderSourceCounts[fid] || 0) + 1;
  }

  const data: WorkspaceSectionData = {
    module: {
      id: mod._id,
      title: mod.title,
      code: mod.code,
      description: mod.description ?? "",
      academicYear: mod.academicYear ?? "",
      semester: mod.semester ?? "",
      colour: mod.colour ?? "var(--color-border)",
    },
    folders: folders.map((f: Doc<"folders">) => ({
      id: f._id,
      name: f.name,
      type: f.type,
      sourceCount: folderSourceCounts[f._id] ?? 0,
    })),
    sources: sources.map(mapWorkspaceSource),
    assignments: (assignmentsWithCounts ?? bundle.assignments).map(
      (a: Doc<"assignments"> & { selectedSourceCount?: number }) =>
        mapCommandCenterAssignment(a),
    ),
  };

  switch (activeTab) {
    case "home":
      return <WorkspaceHome data={data} />;
    case "imports":
      return <WorkspaceImports data={data} />;
    case "assessments":
      return <WorkspaceAssessments data={data} />;
    case "knowledge-base":
      return <WorkspaceKnowledgeBase data={data} />;
    case "settings":
      return <WorkspaceSettings data={data} />;
    default:
      return <WorkspaceHome data={data} />;
  }
}
