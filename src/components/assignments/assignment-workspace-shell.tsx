"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, GitMerge, FileText, CheckCircle, Scale, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module, Assignment, SourceFile, Argument, Judgement } from "@/lib/types";
import { IngestStage } from "./ingest-stage";
import { EvidenceMap } from "@/components/evidence/evidence-map";
import { JudgeStage } from "@/components/arguments/judge-stage";
import { ArgumentBuilder } from "@/components/arguments/argument-builder";

const WORKFLOW_STAGES = [
  { id: "ingest", label: "Ingest", icon: BookOpen, description: "Collect raw material" },
  { id: "understand", label: "Understand", icon: Layers, description: "Comprehend sources" },
  { id: "map", label: "Map", icon: GitMerge, description: "Connect ideas" },
  { id: "judge", label: "Judge", icon: Scale, description: "Evaluate argument" },
  { id: "build", label: "Build", icon: Beaker, description: "Structure submission" },
  { id: "draft", label: "Draft", icon: FileText, description: "Write submission" },
  { id: "refine", label: "Refine", icon: CheckCircle, description: "Polish and validate" },
] as const;

interface AssignmentWorkspaceShellProps {
  module: Module;
  assignment: Assignment;
  activeStage: string;
  allModuleSources?: SourceFile[];
  assignmentArguments?: Argument[];
  judgements?: Judgement[];
  workingThesis?: string;
}

function StagePlaceholder({ label, description, icon: Icon }: { label: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center mt-6">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{label}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}. This area will be implemented in future phases.</p>
    </div>
  );
}

export function AssignmentWorkspaceShell({
  module,
  assignment,
  activeStage,
  allModuleSources = [],
  assignmentArguments = [],
  judgements = [],
  workingThesis,
}: AssignmentWorkspaceShellProps) {
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === activeStage);
  const activeStageConfig = WORKFLOW_STAGES.find((s) => s.id === activeStage) ?? WORKFLOW_STAGES[0];
  const ActiveIcon = activeStageConfig.icon;

  const evidenceGaps = judgements
    .filter((j) => j.type === "evidence_sufficiency" || j.type === "gap_analysis")
    .flatMap((j) => j.findings);

  const renderStageContent = () => {
    switch (activeStage) {
      case "ingest":
        return (
          <IngestStage
            assignment={assignment}
            allModuleSources={allModuleSources}
            activeStage={assignment.stage}
          />
        );
      case "understand":
        return (
          <StagePlaceholder
            label="Understand"
            description="Comprehend individual sources — summaries and key concept extraction"
            icon={Layers}
          />
        );
      case "map":
        return (
          <EvidenceMap
            arguments={assignmentArguments}
            evidenceGaps={evidenceGaps}
          />
        );
      case "judge":
        return (
          <JudgeStage
            assignment={assignment}
            arguments={assignmentArguments}
            judgements={judgements}
          />
        );
      case "build":
        return (
          <ArgumentBuilder
            assignment={assignment}
            arguments={assignmentArguments}
            workingThesis={workingThesis}
          />
        );
      case "draft":
        return (
          <StagePlaceholder
            label="Draft Studio"
            description="Write your submission with source-grounded guidance"
            icon={FileText}
          />
        );
      case "refine":
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
    <div className="max-w-5xl mx-auto pb-12 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link
            href={`/modules/${module.id}?tab=assignments`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Assignments
          </Link>
          <span>/</span>
          <span>{assignment.title}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">{assignment.title}</h1>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider bg-accent/10 text-accent">
                {assignment.stage.replace("-", " ")}
              </span>
              {assignment.dueDate && (
                <span className="text-sm text-muted-foreground">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Rail */}
      <div className="mb-8 overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex items-center min-w-[700px]">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isActive = stage.id === activeStage;
            const isPast = index < currentStageIndex;

            return (
              <div key={stage.id} className="flex-1 relative flex flex-col items-center group">
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-5 left-[-50%] w-full h-[2px] transition-colors",
                      isPast || isActive ? "bg-accent" : "bg-border"
                    )}
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
                      : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                  )}
                  title={stage.description}
                >
                  <stage.icon className="h-4 w-4" />
                </Link>

                <span
                  className={cn(
                    "mt-3 text-xs font-medium uppercase tracking-wider transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 bg-card rounded-2xl border border-border p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-accent" />
              {activeStageConfig.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{activeStageConfig.description}</p>
          </div>
        </div>

        {renderStageContent()}
      </div>
    </div>
  );
}