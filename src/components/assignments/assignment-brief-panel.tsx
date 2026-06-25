"use client";

import { CalendarDays, FileText, Hash, BookOpen, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Assignment, RubricCriterion } from "@/lib/types";

interface AssignmentBriefPanelProps {
  assignment: Assignment;
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

function PlanContextBlock({ assignment }: { assignment: Assignment }) {
  const checklist = [
    { label: "Assessment question captured", done: assignment.question.trim().length > 0 },
    { label: "Deadline confirmed", done: Boolean(assignment.dueDate) },
    { label: "Word limit confirmed", done: Boolean(assignment.wordLimit && assignment.wordLimit > 0) },
    { label: "Rubric attached", done: assignment.rubric.length > 0 },
    { label: "Sources selected", done: assignment.selectedSourceIds.length > 0 },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Plan context
        </span>
      </div>
      <ul className="space-y-2 mb-3">
        {checklist.map((item) => {
          return (
            <li key={item.label} className="flex items-start gap-2">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
              )}
              <span className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {doneCount} of {checklist.length} context item{checklist.length === 1 ? "" : "s"} ready for planning.
      </p>
    </div>
  );
}

export function AssignmentBriefPanel({ assignment }: AssignmentBriefPanelProps) {
  const dueDateValue = assignment.dueDate;
  const hasDueDate = !!dueDateValue && dueDateValue.length > 0;
  const dueDate = hasDueDate ? new Date(dueDateValue) : null;
  const now = new Date();
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

  const totalWeight = assignment.rubric.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assignment Question
          </span>
        </div>
        {assignment.question ? (
          <blockquote className="border-l-4 border-accent pl-4 py-1">
            <p className="text-base font-serif leading-relaxed text-foreground">{assignment.question}</p>
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground italic">No question set. Edit the assignment to add one.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Hash className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Word limit</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            {assignment.wordLimit && assignment.wordLimit > 0 ? assignment.wordLimit.toLocaleString() : "—"}
          </span>
        </div>

        <div className={cn("rounded-lg border p-3", isOverdue ? "border-danger/40 bg-danger/5" : isUrgent ? "border-warning/40 bg-warning/5" : "border-border bg-card")}>
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Due date</span>
          </div>
          {dueDate ? (
            <>
              <span className={cn("text-sm font-semibold", isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-foreground")}>
                {dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <p className={cn("text-xs mt-0.5", isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-muted-foreground")}>
                {isOverdue
                  ? `${Math.abs(daysUntilDue!)} days overdue`
                  : daysUntilDue === 0
                  ? "Due today"
                  : `${daysUntilDue} days remaining`}
              </p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No due date</span>
          )}
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

      {assignment.rubric.length > 0 && (
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
      )}

      <PlanContextBlock assignment={assignment} />
    </div>
  );
}
