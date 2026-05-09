"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ProductionStage } from "@/lib/types";
import { AssignmentWorkspaceShell } from "./assignment-workspace-shell";
import {
  mapModule,
  mapSource,
  mapFullAssignment,
  mapArgument,
  mapEvidenceLink,
  mapDraft,
  mapReview,
  mapJudgement,
} from "@/lib/convex-ui-mappers";

interface AssignmentWorkspaceDataProps {
  moduleId: string;
  assignmentId: string;
  activeStage: ProductionStage;
}

export function AssignmentWorkspaceData({
  moduleId,
  assignmentId,
  activeStage,
}: AssignmentWorkspaceDataProps) {
  const bundle = useQuery(api.assignments.getWorkspaceBundle, {
    moduleId: moduleId as Id<"modules">,
    assignmentId: assignmentId as Id<"assignments">,
  });

  if (bundle === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-muted-foreground">Loading assignment…</p>
        </div>
      </div>
    );
  }

  if (bundle === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-sm">
          <p className="text-base font-medium text-foreground mb-1">Assignment not found</p>
          <p className="text-sm text-muted-foreground">
            This assignment may have been removed or you may not have access to it.
          </p>
        </div>
      </div>
    );
  }

  const mod = mapModule(bundle.module as Parameters<typeof mapModule>[0]);

  const allModuleSources = bundle.moduleSources.map(mapSource);

  const selectedSourceIdSet = new Set(
    bundle.assignmentSourceLinks.map((l) => l.sourceId as string),
  );

  const mappedAssignment = mapFullAssignment(
    bundle.assignment,
    Array.from(selectedSourceIdSet),
  );

  const sourceTitleMap = new Map(
    bundle.moduleSources.map((s) => [s._id as string, s.title]),
  );

  const evidenceByArgId = new Map<string, ReturnType<typeof mapEvidenceLink>[]>();
  for (const link of bundle.evidence) {
    const argId = link.argumentId as string;
    if (!evidenceByArgId.has(argId)) evidenceByArgId.set(argId, []);
    evidenceByArgId.get(argId)!.push(
      mapEvidenceLink(link, sourceTitleMap.get(link.sourceId as string) ?? "Unknown source"),
    );
  }

  const counterNodesByArgId = new Map<string, typeof bundle.counterargumentNodes>();
  for (const node of bundle.counterargumentNodes ?? []) {
    const argId = node.argumentId as string;
    if (!counterNodesByArgId.has(argId)) counterNodesByArgId.set(argId, []);
    counterNodesByArgId.get(argId)!.push(node);
  }

  const assignmentArguments = bundle.arguments.map((arg) =>
    mapArgument(arg, evidenceByArgId.get(arg._id as string) ?? [], counterNodesByArgId.get(arg._id as string) ?? []),
  );

  const draft = bundle.latestDraft ? mapDraft(bundle.latestDraft) : undefined;

  const review =
    bundle.latestReview
      ? mapReview(bundle.latestReview.run, bundle.latestReview.findings)
      : undefined;

  const assignmentSources = allModuleSources.filter((s) =>
    selectedSourceIdSet.has(s.id),
  );

  const judgements = (bundle.judgementOptions ?? []).map((opt) =>
    mapJudgement(opt, bundle.judgementDecisions ?? []),
  );

  const workingThesis = bundle.assignment.thesis ?? undefined;

  const sectionPlans = (bundle.sectionPlans ?? []).map((p) => ({
    id: p._id,
    assignmentId: p.assignmentId,
    label: p.label,
    wordBudget: p.wordBudget,
    argumentIds: (p.argumentIds ?? []) as string[],
    counterargumentPlan: p.counterargumentPlan ?? "",
    rebuttalPlan: p.rebuttalPlan ?? "",
    sortOrder: p.sortOrder,
  }));

  const fullModule = {
    ...mod,
  };

  return (
    <AssignmentWorkspaceShell
      module={fullModule}
      assignment={mappedAssignment}
      activeStage={activeStage}
      allModuleSources={allModuleSources}
      assignmentArguments={assignmentArguments}
      draft={draft}
      review={review}
      judgements={judgements}
      workingThesis={workingThesis}
      assignmentSources={assignmentSources}
      assignmentConvexId={assignmentId}
      moduleConvexId={moduleId}
      sectionPlans={sectionPlans}
    />
  );
}
