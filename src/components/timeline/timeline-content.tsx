"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Inbox,
  ArrowRight,
} from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  cn,
  daysUntil,
  getProductionStageLabel,
  getProductionStageColor,
  getDeadlineUrgency,
  getDeadlineUrgencyClasses,
} from "@/lib/utils";

export interface TimelineAssignment {
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleCode: string;
  moduleColour: string;
  title: string;
  dueDate: string | null;
  stage: Doc<"assignments">["stage"];
  wordLimit: number | null;
}

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "unscheduled", label: "No due date" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export function TimelineContent({ assignments }: { assignments: TimelineAssignment[] }) {
  const [filter, setFilter] = useState<FilterValue>("upcoming");

  const sorted = useMemo(() => {
    const withDates = assignments.filter((a) => a.dueDate);
    const noDates = assignments.filter((a) => !a.dueDate);
    const sortedDates = [...withDates].sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    );
    return { withDates: sortedDates, noDates };
  }, [assignments]);

  const visible = useMemo(() => {
    switch (filter) {
      case "overdue":
        return sorted.withDates.filter((a) => getDeadlineUrgency(a.dueDate) === "overdue");
      case "unscheduled":
        return sorted.noDates;
      case "all":
        return [...sorted.withDates, ...sorted.noDates];
      case "upcoming":
      default:
        return sorted.withDates.filter((a) => getDeadlineUrgency(a.dueDate) !== "overdue");
    }
  }, [filter, sorted]);

  const overdueCount = sorted.withDates.filter((a) => getDeadlineUrgency(a.dueDate) === "overdue").length;
  const imminentCount = sorted.withDates.filter((a) => getDeadlineUrgency(a.dueDate) === "imminent").length;
  const nextSeven = sorted.withDates.filter((a) => {
    const remaining = daysUntil(a.dueDate!);
    return remaining >= 0 && remaining <= 7;
  }).length;

  return (
    <div className="max-w-4xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-serif tracking-tight text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Cross-module deadline view. Every confirmed assessment across your workspaces, ordered by due date.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Total assessments" value={assignments.length} tone="muted" />
        <SummaryTile label="Overdue" value={overdueCount} tone="danger" />
        <SummaryTile label="Due ≤ 3 days" value={imminentCount} tone="warning" />
        <SummaryTile label="Due this week" value={nextSeven} tone="accent" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === option.value
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">Nothing here</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {assignments.length === 0
              ? "Add an assessment in a workspace to see it on the timeline."
              : "No assessments match this filter."}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {visible.map((assignment) => (
            <TimelineRow key={assignment.id} assignment={assignment} />
          ))}
        </ol>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "danger" | "warning" | "accent";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/5 text-danger"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning"
        : tone === "accent"
          ? "border-accent/25 bg-accent/5 text-accent"
          : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function TimelineRow({ assignment }: { assignment: TimelineAssignment }) {
  const urgency = getDeadlineUrgency(assignment.dueDate);
  const remaining = assignment.dueDate ? daysUntil(assignment.dueDate) : null;

  return (
    <li>
      <Link
        href={`/modules/${assignment.moduleId}/assignments/${assignment.id}`}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:bg-muted/40 transition-colors"
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border text-center",
            getDeadlineUrgencyClasses(urgency),
          )}
        >
          {assignment.dueDate ? (
            <>
              <span className="text-[9px] uppercase tracking-wider leading-none">
                {new Date(assignment.dueDate).toLocaleDateString("en-GB", { month: "short" })}
              </span>
              <span className="text-base font-bold leading-none mt-0.5">
                {new Date(assignment.dueDate).getDate()}
              </span>
            </>
          ) : (
            <CalendarDays className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
            {assignment.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: assignment.moduleColour }}
              />
              {assignment.moduleCode} · {assignment.moduleTitle}
            </span>
            {assignment.dueDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {remaining! < 0
                  ? `${Math.abs(remaining!)}d overdue`
                  : remaining === 0
                    ? "Due today"
                    : `${remaining}d remaining`}
              </span>
            )}
            {assignment.wordLimit ? (
              <span>{assignment.wordLimit.toLocaleString()} words</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              getProductionStageColor(assignment.stage),
            )}
          >
            {getProductionStageLabel(assignment.stage)}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </li>
  );
}
