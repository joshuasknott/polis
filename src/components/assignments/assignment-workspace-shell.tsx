"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  GitMerge,
  FileText,
  CheckCircle,
  Scale,
  Beaker,
  PanelRightOpen,
  PanelRightClose,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module, Assignment, SourceFile, Argument, Judgement, Draft, Review, ProductionStage } from "@/lib/types";
import { IngestStage } from "./ingest-stage";
import { UnderstandStage } from "./understand-stage";
import { EvidenceMap } from "@/components/evidence/evidence-map";
import { JudgeStage } from "@/components/arguments/judge-stage";
import { ArgumentBuilder } from "@/components/arguments/argument-builder";
import { DraftStudio } from "@/components/drafts/draft-studio";
import { RefineWorkspace } from "@/components/refine/refine-workspace";
import { CoThinkerPanel } from "@/components/cothinker/cothinker-panel";

const WORKFLOW_STAGES = [
  { id: "ingest", label: "Ingest", icon: BookOpen, description: "Collect raw material" },
  { id: "understand", label: "Understand", icon: Layers, description: "Comprehend sources" },
  { id: "map", label: "Map", icon: GitMerge, description: "Connect ideas" },
  { id: "judge", label: "Judge", icon: Scale, description: "Evaluate argument" },
  { id: "build", label: "Build", icon: Beaker, description: "Structure assignment" },
  { id: "draft", label: "Draft", icon: FileText, description: "Write with evidence" },
  { id: "refine", label: "Refine", icon: CheckCircle, description: "Polish and validate" },
] satisfies Array<{
  id: ProductionStage;
  label: string;
  icon: React.ElementType;
  description: string;
}>;

const STAGE_PREREQUISITES: Record<ProductionStage, string[]> = {
  ingest: [],
  understand: ["At least one source selected in Ingest"],
  map: ["Sources processed"],
  judge: ["Evidence links started"],
  build: ["Evidence map reviewed"],
  draft: ["Argument builder complete"],
  refine: ["Draft submitted for review"],
};

interface AssignmentWorkspaceShellProps {
  module: Module;
  assignment: Assignment;
  activeStage: ProductionStage;
  allModuleSources?: SourceFile[];
  assignmentArguments?: Argument[];
  draft?: Draft;
  review?: Review;
  judgements?: Judgement[];
  workingThesis?: string;
  assignmentSources?: SourceFile[];
  assignmentConvexId?: string;
  moduleConvexId?: string;
}

function StagePlaceholder({ label, description, icon: Icon }: { label: string; description: string; icon: React.ElementType }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{label}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}. This area will be implemented in future phases.
      </p>
    </div>
  );
}

function StageOverrideButton({
  assignmentId,
  targetStage,
  currentStageIndex,
  targetIndex,
}: {
  assignmentId: string;
  targetStage: ProductionStage;
  currentStageIndex: number;
  targetIndex: number;
}) {
  const updateStage = useMutation(api.assignments.updateStage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAhead = targetIndex > currentStageIndex;

  if (!isAhead) return null;

  const prerequisites = STAGE_PREREQUISITES[targetStage];
  if (prerequisites.length === 0) return null;

  const handleOverride = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateStage({
        assignmentId: assignmentId as Id<"assignments">,
        stage: targetStage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance stage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <div className="flex items-start gap-3">
        <Lock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Prerequisites for this stage:
          </p>
          <ul className="mt-1.5 space-y-1">
            {prerequisites.map((req, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
                {req}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleOverride}
              disabled={loading}
              className="text-xs font-medium text-warning hover:text-warning/80 transition-colors disabled:opacity-50"
            >
              {loading ? "Advancing..." : "Advance anyway"}
            </button>
            <span className="text-[10px] text-muted-foreground">This is your decision — prerequisites may not be met</span>
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
  activeStage,
  allModuleSources = [],
  assignmentArguments = [],
  draft,
  review,
  judgements = [],
  workingThesis,
  assignmentSources = [],
  assignmentConvexId,
  moduleConvexId,
}: AssignmentWorkspaceShellProps) {
  const [coThinkerOpen, setCoThinkerOpen] = useState(true);

  const currentStageIndex = WORKFLOW_STAGES.findIndex((stage) => stage.id === assignment.stage);
  const activeStageIndex = WORKFLOW_STAGES.findIndex((stage) => stage.id === activeStage);
  const activeStageConfig = WORKFLOW_STAGES.find((stage) => stage.id === activeStage) ?? WORKFLOW_STAGES[0];
  const ActiveIcon = activeStageConfig.icon;
  const hasFullBleedStageContent = (activeStage === "draft" && Boolean(draft)) || (activeStage === "refine" && Boolean(draft && review));

  const evidenceGaps = judgements
    .filter((judgement) => judgement.type === "evidence_sufficiency" || judgement.type === "gap_analysis")
    .flatMap((judgement) => judgement.findings);

  const isViewingAhead = activeStageIndex > currentStageIndex;

  const renderStageContent = () => {
    switch (activeStage) {
      case "ingest":
        return (
          <IngestStage
            assignment={assignment}
            allModuleSources={allModuleSources}
            activeStage={assignment.stage}
            assignmentId={assignmentConvexId ?? assignment.id}
          />
        );
      case "understand":
        return (
          <UnderstandStage
            assignment={assignment}
            assignmentSources={assignmentSources}
            assignmentConvexId={assignmentConvexId}
          />
        );
      case "map":
        return <EvidenceMap arguments={assignmentArguments} evidenceGaps={evidenceGaps} />;
      case "judge":
        return <JudgeStage assignment={assignment} arguments={assignmentArguments} judgements={judgements} />;
      case "build":
        return <ArgumentBuilder assignment={assignment} arguments={assignmentArguments} workingThesis={workingThesis} />;
      case "draft":
        if (draft) {
          return (
            <DraftStudio
              module={module}
              assignment={assignment}
              draft={draft}
              arguments={assignmentArguments}
              sources={assignmentSources}
            />
          );
        }

        return (
          <StagePlaceholder
            label="Draft Studio"
            description="Write with source-grounded guidance"
            icon={FileText}
          />
        );
      case "refine":
        if (draft && review) {
          return <RefineWorkspace module={module} assignment={assignment} draft={draft} review={review} />;
        }

        return (
          <StagePlaceholder
            label="Refine"
            description="Review your draft against rubric, evidence, and citation safety"
            icon={CheckCircle}
          />
        );
      default:
        return (
          <StagePlaceholder
            label={activeStageConfig.label}
            description={activeStageConfig.description}
            icon={ActiveIcon}
          />
        );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 xl:flex-row xl:gap-0">
      <div className="min-w-0 flex-1 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
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
                <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">{assignment.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-accent">
                    {assignment.stage.replace("-", " ")}
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
                {coThinkerOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <span className="hidden sm:inline">CoThinker</span>
              </button>
            </div>
          </div>

          {/* Stage rail - mobile scrollable */}
          <div className="mb-8 overflow-x-auto pb-4 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav aria-label="Production stages" className="flex min-w-[640px] sm:min-w-[700px] items-center">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isActive = stage.id === activeStage;
                const isPast = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isAhead = index > currentStageIndex;

                return (
                  <div key={stage.id} className="group relative flex flex-1 flex-col items-center">
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute left-[-50%] top-5 h-[2px] w-full transition-colors",
                          index <= currentStageIndex ? "bg-accent" : "bg-border"
                        )}
                        aria-hidden="true"
                      />
                    )}

                    <Link
                      href={`/modules/${module.id}/assignments/${assignment.id}?stage=${stage.id}`}
                      className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        isActive
                          ? "border-accent bg-accent text-accent-foreground"
                          : isPast
                            ? "border-accent bg-background text-accent hover:bg-accent/10"
                            : isCurrent
                              ? "border-accent/60 bg-background text-accent"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                      )}
                      title={isAhead ? `${stage.label} — prerequisites not yet met` : stage.description}
                      aria-label={`${stage.label} stage${isActive ? " (current)" : isPast ? " (completed)" : isAhead ? " (locked)" : ""}`}
                    >
                      <stage.icon className="h-4 w-4" />
                    </Link>

                    <span
                      className={cn(
                        "mt-3 text-xs font-medium uppercase tracking-wider transition-colors text-center",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                      )}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          </div>

          <div
            className={cn(
              "flex-1 rounded-2xl border border-border p-6 md:p-8",
              hasFullBleedStageContent ? "border-none bg-transparent p-0 md:p-0" : "bg-card"
            )}
          >
            {!hasFullBleedStageContent && (
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <ActiveIcon className="h-5 w-5 text-accent" />
                    {activeStageConfig.label}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{activeStageConfig.description}</p>
                </div>
              </div>
            )}

            {isViewingAhead && (
              <StageOverrideButton
                assignmentId={assignmentConvexId ?? assignment.id}
                targetStage={activeStage}
                currentStageIndex={currentStageIndex}
                targetIndex={activeStageIndex}
              />
            )}

            {renderStageContent()}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 overflow-hidden border-border bg-card/50 transition-all duration-200 xl:border-l",
          coThinkerOpen ? "w-full xl:w-80" : "hidden xl:block xl:w-0"
        )}
      >
        {coThinkerOpen && (
          <CoThinkerPanel
            stage={activeStage}
            assignment={assignment}
            arguments={assignmentArguments}
            review={review}
            judgements={judgements}
            assignmentConvexId={assignmentConvexId}
            moduleConvexId={moduleConvexId}
          />
        )}
      </div>
    </div>
  );
}
