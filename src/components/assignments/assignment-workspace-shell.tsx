"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  GitMerge,
  Beaker,
  PenLine,
  ShieldCheck,
  PanelRightOpen,
  PanelRightClose,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Module,
  Assignment,
  SourceFile,
  Argument,
  Judgement,
  Draft,
  Review,
  ProductionStage,
  SectionPlan,
  DraftSegment,
  AssessmentTab,
} from "@/lib/types";
import { ASSESSMENT_TABS } from "@/lib/types";
import { AssignmentBriefPanel } from "./assignment-brief-panel";
import { AssignmentSourceBase } from "./assignment-source-base";
import { UnderstandStage } from "./understand-stage";
import { EvidenceMap } from "@/components/evidence/evidence-map";
import { JudgeStage } from "@/components/arguments/judge-stage";
import { ArgumentBuilder } from "@/components/arguments/argument-builder";
import { DraftWriteSurface } from "@/components/write";
import { RefineWorkspace } from "@/components/refine";
import { CoThinkerPanel } from "@/components/cothinker";

const TABS = [
  {
    id: "brief",
    label: "Brief",
    icon: FileText,
    description: "Question, rubric, deadline, and stage readiness.",
    stage: "ingest" as ProductionStage,
  },
  {
    id: "sources",
    label: "Source Base",
    icon: BookOpen,
    description: "Selected sources and per-source analyses.",
    stage: "understand" as ProductionStage,
  },
  {
    id: "evidence",
    label: "Evidence Map",
    icon: GitMerge,
    description: "Claims, evidence links, and judgement gaps.",
    stage: "map" as ProductionStage,
  },
  {
    id: "plan",
    label: "Plan",
    icon: Beaker,
    description: "Working thesis, section plan, and word budget.",
    stage: "build" as ProductionStage,
  },
  {
    id: "write",
    label: "Write",
    icon: PenLine,
    description: "Living draft with provenance labels and warnings.",
    stage: "draft" as ProductionStage,
  },
  {
    id: "review",
    label: "Review",
    icon: ShieldCheck,
    description: "Findings, rubric alignment, citation safety.",
    stage: "refine" as ProductionStage,
  },
] satisfies Array<{
  id: AssessmentTab;
  label: string;
  icon: React.ElementType;
  description: string;
  stage: ProductionStage;
}>;

const TAB_STAGE: Record<AssessmentTab, ProductionStage> = TABS.reduce(
  (acc, tab) => {
    acc[tab.id] = tab.stage;
    return acc;
  },
  {} as Record<AssessmentTab, ProductionStage>,
);

const STAGE_ORDER: ProductionStage[] = [
  "ingest",
  "understand",
  "map",
  "judge",
  "build",
  "draft",
  "refine",
];

interface AssignmentWorkspaceShellProps {
  module: Module;
  assignment: Assignment;
  activeTab: AssessmentTab;
  allModuleSources?: SourceFile[];
  assignmentArguments?: Argument[];
  draft?: Draft;
  draftSegments?: DraftSegment[];
  review?: Review;
  reviewRunId?: string;
  judgements?: Judgement[];
  workingThesis?: string;
  assignmentSources?: SourceFile[];
  assignmentConvexId?: string;
  moduleConvexId?: string;
  sectionPlans?: SectionPlan[];
}

function TabLockedBanner({
  assignmentConvexId,
  activeTab,
  assignment,
}: {
  assignmentConvexId: string;
  activeTab: AssessmentTab;
  assignment: Assignment;
}) {
  const updateStage = useMutation(api.assignments.updateStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabStage = TAB_STAGE[activeTab];
  const assignmentStageIndex = STAGE_ORDER.indexOf(assignment.stage);
  const tabStageIndex = STAGE_ORDER.indexOf(tabStage);

  if (tabStageIndex <= assignmentStageIndex) return null;

  const handleOverride = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateStage({
        assignmentId: assignmentConvexId as Id<"assignments">,
        stage: tabStage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance stage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            This tab sits ahead of your current stage ({assignment.stage}).
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can preview the surface, but Polis will treat your source base
            and evidence map as the live context. Advance the stage if you are
            ready to commit.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleOverride}
              disabled={loading}
              className="text-xs font-medium text-warning transition-colors hover:text-warning/80 disabled:opacity-50"
            >
              {loading ? "Advancing…" : `Advance to ${tabStage}`}
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-danger">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AssignmentWorkspaceShell({
  module,
  assignment,
  activeTab,
  allModuleSources = [],
  assignmentArguments = [],
  draft,
  draftSegments = [],
  review,
  reviewRunId,
  judgements = [],
  workingThesis,
  assignmentSources = [],
  assignmentConvexId,
  moduleConvexId,
  sectionPlans = [],
}: AssignmentWorkspaceShellProps) {
  const [coThinkerOpen, setCoThinkerOpen] = useState(true);
  const activeTabConfig = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const ActiveIcon = activeTabConfig.icon;
  const activeStage = TAB_STAGE[activeTab];
  const hasFullBleedContent = activeTab === "write" || activeTab === "review";

  const evidenceGaps = judgements
    .filter(
      (judgement) =>
        judgement.type === "evidence_sufficiency" ||
        judgement.type === "gap_analysis",
    )
    .flatMap((judgement) => judgement.findings);

  const renderTabContent = () => {
    switch (activeTab) {
      case "brief":
        return (
          <AssignmentBriefPanel assignment={assignment} activeStage={activeStage} />
        );
      case "sources":
        return (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected for this assessment
                </h3>
              </div>
              <AssignmentSourceBase
                allModuleSources={allModuleSources}
                initialSelectedIds={assignment.selectedSourceIds}
                assignmentId={assignmentConvexId ?? assignment.id}
              />
            </section>
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-source" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Per-source analyses
                </h3>
              </div>
              <UnderstandStage
                assignment={assignment}
                assignmentSources={assignmentSources}
                assignmentConvexId={assignmentConvexId}
              />
            </section>
          </div>
        );
      case "evidence":
        return (
          <div className="space-y-8">
            <EvidenceMap
              arguments={assignmentArguments}
              evidenceGaps={evidenceGaps}
              assignmentConvexId={assignmentConvexId ?? assignment.id}
              assignmentSources={assignmentSources}
            />
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-interpretation" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Position judgements
                </h3>
              </div>
              <JudgeStage
                assignment={assignment}
                arguments={assignmentArguments}
                judgements={judgements}
                assignmentConvexId={assignmentConvexId ?? assignment.id}
              />
            </section>
          </div>
        );
      case "plan":
        return (
          <ArgumentBuilder
            assignment={assignment}
            arguments={assignmentArguments}
            workingThesis={workingThesis}
            sectionPlans={sectionPlans}
            assignmentConvexId={assignmentConvexId ?? assignment.id}
          />
        );
      case "write":
        return (
          <DraftWriteSurface
            key={draft?.id ?? "no-draft"}
            module={module}
            assignment={assignment}
            draft={draft}
            initialSegments={draftSegments}
            arguments={assignmentArguments}
            sources={assignmentSources}
            assignmentConvexId={assignmentConvexId ?? assignment.id}
            moduleConvexId={moduleConvexId ?? module.id}
            reviewRunId={reviewRunId}
          />
        );
      case "review":
        return (
          <RefineWorkspace
            module={module}
            assignment={assignment}
            draft={draft}
            review={review}
            assignmentConvexId={assignmentConvexId ?? assignment.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 xl:flex-row xl:gap-0">
      <div className="min-w-0 flex-1 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href={`/modules/${module.id}?tab=assignments`}
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Assignments
              </Link>
              <span>/</span>
              <span className="truncate">{assignment.title}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
                  {assignment.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-accent">
                    {activeTabConfig.label}
                  </span>
                  {module.code && (
                    <span className="text-sm text-muted-foreground">
                      {module.code} &middot; {module.title}
                    </span>
                  )}
                  {assignment.dueDate && (
                    <span className="text-sm text-muted-foreground">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCoThinkerOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                title={coThinkerOpen ? "Hide CoThinker" : "Show CoThinker"}
                aria-label={coThinkerOpen ? "Hide CoThinker panel" : "Show CoThinker panel"}
              >
                {coThinkerOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">CoThinker</span>
              </button>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav
              aria-label="Assessment tabs"
              className="flex min-w-[640px] gap-1 rounded-xl border border-border bg-card p-1.5"
            >
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={`/modules/${module.id}/assignments/${assignment.id}?tab=${tab.id}`}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    title={tab.description}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div
            className={cn(
              "flex-1 rounded-2xl border border-border p-6 md:p-8",
              hasFullBleedContent && "border-none bg-transparent p-0 md:p-0",
              !hasFullBleedContent && "bg-card",
            )}
          >
            {!hasFullBleedContent && (
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <ActiveIcon className="h-5 w-5 text-accent" />
                    {activeTabConfig.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTabConfig.description}
                  </p>
                </div>
              </div>
            )}

            <TabLockedBanner
              assignmentConvexId={assignmentConvexId ?? assignment.id}
              activeTab={activeTab}
              assignment={assignment}
            />

            {renderTabContent()}
          </div>
        </div>
      </div>

      {coThinkerOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm xl:hidden"
          onClick={() => setCoThinkerOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 shrink-0 border-l border-border bg-card shadow-2xl transition-transform duration-300 xl:static xl:z-auto xl:shadow-none xl:bg-card/50",
          coThinkerOpen
            ? "translate-x-0 w-80"
            : "translate-x-full w-80 xl:w-0 xl:translate-x-0 xl:hidden",
        )}
      >
        {coThinkerOpen && (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-border p-2 xl:hidden">
              <span className="px-2 text-sm font-medium">CoThinker</span>
              <button
                onClick={() => setCoThinkerOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Close CoThinker panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CoThinkerPanel
                stage={activeStage}
                assignment={assignment}
                arguments={assignmentArguments}
                review={review}
                judgements={judgements}
                assignmentConvexId={assignmentConvexId}
                moduleConvexId={moduleConvexId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ASSESSMENT_TABS, TAB_STAGE };
