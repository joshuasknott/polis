"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDashed,
  ClipboardList,
  FileCheck2,
  FileText,
  Layers,
  PenLine,
  SearchCheck,
  Upload,
} from "lucide-react";
import {
  cn,
  getDeadlineLabel,
  getDeadlineUrgency,
  getDeadlineUrgencyClasses,
  getProductionStageColor,
  getProductionStageLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProductionStage } from "@/lib/types";
import type { WorkspaceSectionProps } from "./workspace-sections";

type SetupStatus = "done" | "active" | "attention" | "next" | "locked";

interface SetupStep {
  id: string;
  label: string;
  detail: string;
  status: SetupStatus;
  href?: string;
  actionLabel?: string;
  icon: React.ElementType;
}

const READING_SOURCE_TYPES = new Set([
  "journal_article",
  "book_chapter",
  "book",
  "lecture_slides",
  "seminar_notes",
  "report",
  "news_article",
]);

const PLAN_STAGES = new Set<ProductionStage>([
  "understand",
  "map",
  "judge",
  "build",
]);

const WRITING_STAGES = new Set<ProductionStage>(["draft"]);
const REVIEW_STAGES = new Set<ProductionStage>(["refine"]);

export function WorkspaceHome({ data }: WorkspaceSectionProps) {
  const { module, assignments, sources } = data;

  const reviewQueue = sources.filter((s) => s.needsReview);
  const processing = sources.filter((s) => s.isProcessing);
  const failed = sources.filter((s) => s.hasError);
  const processedSources = sources.filter((s) => s.status === "processed");
  const assignmentWithMostProgress = getMostAdvancedAssignment(assignments);
  const setupSteps = buildSetupSteps(data, {
    reviewCount: reviewQueue.length,
    processingCount: processing.length,
    failedCount: failed.length,
  });
  const completedSteps = setupSteps.filter((step) => step.status === "done").length;
  const progress = Math.round((completedSteps / setupSteps.length) * 100);
  const nextStep =
    setupSteps.find((step) => step.status === "attention") ??
    setupSteps.find((step) => step.status === "active") ??
    setupSteps.find((step) => step.status === "next");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="space-y-5 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Workspaces
          </Link>
          <span>/</span>
          <span className="text-foreground">Module Info</span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Module Info
            </p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
              {module.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{sources.length} sources</Badge>
            <Badge tone="success">{processedSources.length} processed</Badge>
            {reviewQueue.length > 0 ? (
              <Badge tone="warning">{reviewQueue.length} need review</Badge>
            ) : null}
            {failed.length > 0 ? (
              <Badge tone="danger">{failed.length} failed</Badge>
            ) : null}
            <Badge tone="neutral">{assignments.length} assessments</Badge>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_0.28fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Setup tracker
              </h2>
              <p className="mt-1 text-sm text-foreground">
                {nextStep ? nextStep.label : "Workspace ready"}
              </p>
            </div>
            <div className="w-full sm:w-56">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedSteps} of {setupSteps.length} complete</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <ol className="divide-y divide-border">
            {setupSteps.map((step, index) => (
              <SetupStepRow key={step.id} step={step} index={index} />
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <StatusPanel
            title="Source Base"
            icon={BookOpen}
            rows={[
              [`${sources.length}`, "total"],
              [`${processedSources.length}`, "processed"],
              [`${reviewQueue.length}`, "to review"],
            ]}
          />
          <StatusPanel
            title="Assessments"
            icon={ClipboardList}
            rows={[
              [`${assignments.length}`, "total"],
              [`${assignments.filter((a) => a.missingContext.length === 0).length}`, "complete context"],
              [assignmentWithMostProgress ? getProductionStageLabel(assignmentWithMostProgress.stage) : "None", "furthest stage"],
            ]}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.58fr_0.42fr]">
        <UpcomingAssessments data={data} />
        <SourceOrganization
          reviewCount={reviewQueue.length}
          processingCount={processing.length}
          failedCount={failed.length}
          moduleId={module.id}
        />
      </section>
    </div>
  );
}

function SetupStepRow({ step, index }: { step: SetupStep; index: number }) {
  const meta = getStatusMeta(step.status);
  const StatusIcon = meta.icon;
  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
      <div className="hidden h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground sm:flex">
        {index + 1}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <step.icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{step.label}</p>
          <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", meta.className)}>
            <StatusIcon className="h-3 w-3" />
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
      </div>
      {step.href && step.actionLabel ? (
        <Link
          href={step.href}
          className="inline-flex min-h-9 items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {step.actionLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </li>
  );
}

function StatusPanel({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: React.ElementType;
  rows: Array<[string, string]>;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <dl className="mt-4 space-y-3">
        {rows.map(([value, label]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function UpcomingAssessments({ data }: WorkspaceSectionProps) {
  const { module, assignments, sources } = data;
  const processedSources = sources.filter((s) => s.status === "processed");
  const upcoming = [...assignments]
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 4);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Assessments
        </h2>
        <Link
          href={`/modules/${module.id}?tab=assignments`}
          className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Open Assignments <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Add one from Assignments, or upload a brief and confirm extracted info."
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {upcoming.map((assignment) => {
            const urgency = getDeadlineUrgency(assignment.dueDate);
            return (
              <li key={assignment.id}>
                <Link
                  href={`/modules/${module.id}/assignments/${assignment.id}`}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1.6fr_1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {assignment.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.selectedSourceCount} of {processedSources.length} processed sources selected
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getProductionStageColor(assignment.stage))}>
                      {getProductionStageLabel(assignment.stage)}
                    </span>
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getDeadlineUrgencyClasses(urgency))}>
                      {getDeadlineLabel(urgency, assignment.dueDate)}
                    </span>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SourceOrganization({
  reviewCount,
  processingCount,
  failedCount,
  moduleId,
}: {
  reviewCount: number;
  processingCount: number;
  failedCount: number;
  moduleId: string;
}) {
  const hasWork = reviewCount > 0 || processingCount > 0 || failedCount > 0;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-4 w-4" />
          Polis organization
        </h2>
        <Link
          href={`/modules/${moduleId}?tab=sources`}
          className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Open Sources <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        {hasWork ? (
          <div className="space-y-3">
            <OrganizationRow label="Needs review" value={reviewCount} tone={reviewCount > 0 ? "warning" : "neutral"} />
            <OrganizationRow label="Processing" value={processingCount} tone={processingCount > 0 ? "accent" : "neutral"} />
            <OrganizationRow label="Failed" value={failedCount} tone={failedCount > 0 ? "danger" : "neutral"} />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">Organization clear</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Imported sources have no outstanding review or processing issues.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OrganizationRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "warning" | "danger" | "accent";
}) {
  const className =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : tone === "accent"
          ? "text-accent"
          : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", className)}>{value}</span>
    </div>
  );
}

function getStatusMeta(status: SetupStatus) {
  switch (status) {
    case "done":
      return {
        label: "Done",
        icon: CheckCircle2,
        className: "border-success/30 bg-success/10 text-success",
      };
    case "active":
      return {
        label: "Current",
        icon: CircleDashed,
        className: "border-accent/30 bg-accent/10 text-accent",
      };
    case "attention":
      return {
        label: "Needs attention",
        icon: CircleAlert,
        className: "border-warning/40 bg-warning/10 text-warning",
      };
    case "next":
      return {
        label: "Next",
        icon: Circle,
        className: "border-border bg-muted text-muted-foreground",
      };
    default:
      return {
        label: "Later",
        icon: Circle,
        className: "border-border bg-background text-muted-foreground",
      };
  }
}

function buildSetupSteps(
  data: WorkspaceSectionProps["data"],
  status: { reviewCount: number; processingCount: number; failedCount: number },
): SetupStep[] {
  const { module, assignments, sources } = data;
  const sourceHref = `/modules/${module.id}?tab=sources`;
  const assignmentHref = `/modules/${module.id}?tab=assignments`;
  const firstAssignment = getMostAdvancedAssignment(assignments);
  const firstAssignmentHref = firstAssignment
    ? `/modules/${module.id}/assignments/${firstAssignment.id}`
    : assignmentHref;

  const hasModuleInfo = sources.some(
    (source) =>
      source.classificationLabel === "module_handbook" ||
      /handbook|syllabus|module info|module guide/i.test(source.title),
  );
  const hasReadingList = sources.some(
    (source) =>
      /reading list|reading schedule|bibliography/i.test(source.title) ||
      source.classificationLabel === "module_handbook",
  );
  const hasBriefOrRubric =
    sources.some(
      (source) =>
        source.classificationLabel === "assignment_brief" ||
        source.classificationLabel === "marking_rubric",
    ) ||
    assignments.some((assignment) => assignment.hasQuestion || assignment.hasRubric);
  const hasReadings = sources.some((source) =>
    READING_SOURCE_TYPES.has(source.classificationLabel),
  );
  const hasSourceIssues =
    status.reviewCount > 0 || status.processingCount > 0 || status.failedCount > 0;
  const hasConfirmedInfo = assignments.some(
    (assignment) =>
      assignment.hasQuestion ||
      assignment.hasRubric ||
      assignment.hasDueDate ||
      assignment.hasWordLimit,
  );
  const hasAssignments = assignments.length > 0;
  const hasPlanStarted = assignments.some((assignment) => PLAN_STAGES.has(assignment.stage));
  const hasPlanDone = assignments.some(
    (assignment) => WRITING_STAGES.has(assignment.stage) || REVIEW_STAGES.has(assignment.stage),
  );
  const hasWritingStarted = assignments.some((assignment) => WRITING_STAGES.has(assignment.stage));
  const hasWritingDone = assignments.some((assignment) => REVIEW_STAGES.has(assignment.stage));
  const hasReviewStarted = assignments.some((assignment) => REVIEW_STAGES.has(assignment.stage));

  return [
    {
      id: "workspace-created",
      label: "Workspace created",
      detail: "The workspace exists and is ready for module material.",
      status: "done",
      href: `/modules/${module.id}?tab=settings`,
      actionLabel: "Rename",
      icon: CheckCircle2,
    },
    {
      id: "upload-module-info",
      label: "Upload module info",
      detail: hasModuleInfo
        ? "Module handbook or syllabus material is in the Source Base."
        : "Add a handbook, syllabus, or module guide.",
      status: hasModuleInfo ? "done" : sources.length === 0 ? "active" : "next",
      href: sourceHref,
      actionLabel: hasModuleInfo ? "View" : "Upload",
      icon: Upload,
    },
    {
      id: "upload-reading-list",
      label: "Upload reading list",
      detail: hasReadingList
        ? "Reading-list material is available for organization."
        : "Add the reading list or a schedule that names required readings.",
      status: hasReadingList ? "done" : hasModuleInfo ? "active" : "next",
      href: sourceHref,
      actionLabel: hasReadingList ? "View" : "Upload",
      icon: BookOpen,
    },
    {
      id: "upload-assessment-brief",
      label: "Upload assessment brief/rubric",
      detail: hasBriefOrRubric
        ? "Assessment brief or rubric context is present."
        : "Add the brief, question sheet, or marking rubric.",
      status: hasBriefOrRubric ? "done" : hasModuleInfo || hasReadingList ? "active" : "next",
      href: sourceHref,
      actionLabel: hasBriefOrRubric ? "View" : "Upload",
      icon: FileText,
    },
    {
      id: "upload-readings",
      label: "Upload readings/lecture material",
      detail: hasReadings
        ? "Readings or lecture material are in the Source Base."
        : "Add readings, lecture slides, seminar notes, or reports.",
      status: hasReadings ? "done" : hasBriefOrRubric ? "active" : "next",
      href: sourceHref,
      actionLabel: hasReadings ? "View" : "Upload",
      icon: Layers,
    },
    {
      id: "review-organization",
      label: "Review Polis organization",
      detail: hasSourceIssues
        ? "Check classifications, processing state, and failed uploads."
        : "Source organization has no outstanding review issue.",
      status: sources.length === 0 ? "locked" : hasSourceIssues ? "attention" : "done",
      href: sourceHref,
      actionLabel: hasSourceIssues ? "Review" : "View",
      icon: SearchCheck,
    },
    {
      id: "confirm-extracted-info",
      label: "Confirm extracted info",
      detail: hasConfirmedInfo
        ? "Assessment details have been confirmed or entered."
        : "Review extracted questions, deadlines, word limits, and rubric details.",
      status: hasConfirmedInfo ? "done" : hasBriefOrRubric ? "active" : "locked",
      href: assignmentHref,
      actionLabel: hasConfirmedInfo ? "View" : "Confirm",
      icon: FileCheck2,
    },
    {
      id: "start-assessment",
      label: "Start assessment",
      detail: hasAssignments
        ? "At least one assessment track is ready."
        : "Create or confirm an assessment track.",
      status: hasAssignments ? "done" : hasConfirmedInfo || hasBriefOrRubric ? "active" : "locked",
      href: assignmentHref,
      actionLabel: hasAssignments ? "Open" : "Start",
      icon: ClipboardList,
    },
    {
      id: "plan",
      label: "Plan",
      detail: hasPlanDone
        ? "A workspace assessment has moved beyond planning."
        : hasPlanStarted
          ? "Build the argument, evidence map, and section plan."
          : "Open an assessment and move into Plan.",
      status: hasPlanDone ? "done" : hasPlanStarted ? "active" : hasAssignments ? "next" : "locked",
      href: firstAssignment ? `${firstAssignmentHref}?tab=plan` : assignmentHref,
      actionLabel: hasPlanDone || hasPlanStarted ? "Open" : "Plan",
      icon: Layers,
    },
    {
      id: "write",
      label: "Write",
      detail: hasWritingDone
        ? "A workspace assessment has moved into Review."
        : hasWritingStarted
          ? "Continue drafting with source-aware writing help."
          : "Move from Plan into Write when ready.",
      status: hasWritingDone ? "done" : hasWritingStarted ? "active" : hasPlanDone ? "next" : "locked",
      href: firstAssignment ? `${firstAssignmentHref}?tab=write` : assignmentHref,
      actionLabel: hasWritingDone || hasWritingStarted ? "Open" : "Write",
      icon: PenLine,
    },
    {
      id: "review",
      label: "Review",
      detail: hasReviewStarted
        ? "Review is available for citation safety, evidence gaps, and revision priorities."
        : "Use Review after drafting.",
      status: hasReviewStarted ? "active" : hasWritingDone ? "next" : "locked",
      href: firstAssignment ? `${firstAssignmentHref}?tab=review` : assignmentHref,
      actionLabel: "Review",
      icon: CheckCircle2,
    },
  ];
}

function getMostAdvancedAssignment(
  assignments: WorkspaceSectionProps["data"]["assignments"],
) {
  const order: Record<ProductionStage, number> = {
    ingest: 0,
    understand: 1,
    map: 2,
    judge: 3,
    build: 4,
    draft: 5,
    refine: 6,
  };
  return [...assignments].sort((a, b) => order[b.stage] - order[a.stage])[0];
}
