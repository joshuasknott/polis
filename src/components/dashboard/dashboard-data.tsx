"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { DashboardContent } from "./dashboard-content";
import { mapModule } from "@/lib/convex-ui-mappers";
import type { TimelineAssignment } from "@/components/timeline/timeline-content";

type ModuleSummary = Pick<
  Doc<"modules">,
  "_id" | "title" | "code" | "colour"
>;

type AssignmentSummary = Pick<
  Doc<"assignments">,
  "_id" | "moduleId" | "title" | "dueDate" | "stage" | "wordLimit"
>;

export function DashboardData() {
  const { isLoaded, isSignedIn } = useAuth();
  const result = useQuery(
    api.modules.listWithCounts,
    isLoaded && isSignedIn ? {} : "skip",
  );
  const assignments = useQuery(
    api.assignments.list,
    isLoaded && isSignedIn ? {} : "skip",
  );

  if (result === undefined || assignments === undefined) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading workspaces...</p>
      </div>
    );
  }

  const modules = result.map((mod) =>
    mapModule(mod as typeof mod & { sourceCount: number; assignmentCount: number }),
  );
  const moduleMap = new Map<string, ModuleSummary>();
  for (const mod of result as ModuleSummary[]) {
    moduleMap.set(mod._id, mod);
  }

  const timelineAssignments = (assignments as AssignmentSummary[]).flatMap<TimelineAssignment>(
    (assignment) => {
      const mod = moduleMap.get(assignment.moduleId);
      if (!mod) return [];
      return [
        {
          id: assignment._id,
          moduleId: assignment.moduleId,
          moduleTitle: mod.title,
          moduleCode: mod.code,
          moduleColour: mod.colour ?? "var(--color-border)",
          title: assignment.title,
          dueDate: assignment.dueDate ?? null,
          stage: (assignment.stage ?? "ingest") as TimelineAssignment["stage"],
          wordLimit: assignment.wordLimit ?? null,
        },
      ];
    },
  );

  return (
    <DashboardContent
      modules={modules}
      timelineAssignments={timelineAssignments}
    />
  );
}
