"use client";

import { CalendarDays, FileText, Hash, BookOpen, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Assignment, RubricCriterion, ProductionStage } from "@/lib/types";

const STAGE_ORDER: ProductionStage[] = ["ingest", "understand", "map", "judge", "build", "draft", "refine"];

const STAGE_READINESS: Record<
  ProductionStage,
  { requires: string[]; unlocks: string }
> = {
  ingest: {
    requires: ["Assignment brief uploaded", "At least one source selected"],
    unlocks: "Understand",
  },
  understand: {
    requires: ["Sources processed", "At least 2 readings summarised"],
    unlocks: "Map",
  },
  map: {
    requires: ["Key concepts identified", "Evidence links started"],
    unlocks: "Judge",
  },
  judge: {
    requires: ["Evidence map complete", "Gaps identified"],
    unlocks: "Build",
  },
  build: {
    requires: ["Position selected", "Working thesis drafted"],
    unlocks: "Draft",
  },
  draft: {
    requires: ["Argument builder complete", "All claims evidenced"],
    unlocks: "Refine",
  },
  refine: {
    requires: ["Draft submitted for review"],
    unlocks: "Submission",
  },
};

interface AssignmentBriefPanelProps {
  assignment: Assignment;
  activeStage: ProductionStage;
}

function RubricRow({ criterion }: { criterion: RubricCriterion }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{criterion.name}</span>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{criterion.description}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-sm font-semibold text-foreground">{criterion.weight}%</span>
        <div
          className="mt-1 h-1 w-16 rounded-full bg-border overflow-hidden"
          aria-label={`${criterion.weight}% weight`}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${criterion.weight}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StageReadinessBlock({
  assignment,
  activeStage,
}: {
  assignment: Assignment;
  activeStage: ProductionStage;
}) {
  const currentIndex = STAGE_ORDER.indexOf(assignment.stage);
  const readiness = STAGE_READINESS[activeStage];

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Stage Readiness
        </span>
      </div>
      <ul className="space-y-2 mb-3">
        {readiness.requires.map((req, i) => {
          const stageIndex = STAGE_ORDER.indexOf(activeStage);
          const done = currentIndex > stageIndex;
          return (
            <li key={i} className="flex items-start gap-2">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
              )}
              <span className={cn("text-sm", done ? "text-muted-foreground line-through" : "text-foreground")}>
                {req}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Completing this stage unlocks{" "}
        <span className="font-medium text-foreground">{readiness.unlocks}</span>.
      </p>
    </div>
  );
}

export function AssignmentBriefPanel({ assignment, activeStage }: AssignmentBriefPanelProps) {
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 7;

  const totalWeight = assignment.rubric.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      {/* Question block */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assignment Question
          </span>
        </div>
        <blockquote className="border-l-4 border-accent pl-4 py-1">
          <p className="text-base font-serif leading-relaxed text-foreground">{assignment.question}</p>
        </blockquote>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Hash className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Word limit</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            {assignment.wordLimit.toLocaleString()}
          </span>
        </div>

        <div className={cn("rounded-lg border p-3", isOverdue ? "border-danger/40 bg-danger/5" : isUrgent ? "border-warning/40 bg-warning/5" : "border-border bg-card")}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Due date</span>
          </div>
          <span className={cn("text-sm font-semibold", isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-foreground")}>
            {dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <p className={cn("text-xs mt-0.5", isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-muted-foreground")}>
            {isOverdue
              ? `${Math.abs(daysUntilDue)} days overdue`
              : daysUntilDue === 0
              ? "Due today"
              : `${daysUntilDue} days remaining`}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Sources</span>
          </div>
          <span className="text-lg font-semibold text-foreground">{assignment.selectedSourceIds.length}</span>
          <p className="text-xs text-muted-foreground mt-0.5">selected</p>
        </div>
      </div>

      {/* Rubric */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Marking Rubric
            </span>
          </div>
          {totalWeight !== 100 && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>Weights sum to {totalWeight}%</span>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 divide-y divide-border">
          {assignment.rubric.map((criterion) => (
            <RubricRow key={criterion.name} criterion={criterion} />
          ))}
        </div>
      </div>

      {/* Stage readiness */}
      <StageReadinessBlock assignment={assignment} activeStage={activeStage} />
    </div>
  );
}
