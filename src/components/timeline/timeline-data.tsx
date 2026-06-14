"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { TimelineContent, type TimelineAssignment } from "./timeline-content";

type ModuleSummary = Pick<
  Doc<"modules">,
  "_id" | "title" | "code" | "colour"
>;

type AssignmentSummary = Pick<
  Doc<"assignments">,
  "_id" | "moduleId" | "title" | "dueDate" | "stage" | "wordLimit"
>;

export function TimelineData() {
  const { isLoaded, isSignedIn } = useAuth();
  const modules = useQuery(
    api.modules.list,
    isLoaded && isSignedIn ? {} : "skip",
  );
  const assignments = useQuery(
    api.assignments.list,
    isLoaded && isSignedIn ? {} : "skip",
  );

  if (modules === undefined || assignments === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading timeline…</p>
      </div>
    );
  }

  const moduleMap = new Map<string, ModuleSummary>();
  for (const mod of modules as ModuleSummary[]) {
    moduleMap.set(mod._id, mod);
  }

  const joined = (assignments as AssignmentSummary[]).flatMap<TimelineAssignment>(
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

  return <TimelineContent assignments={joined} />;
}
