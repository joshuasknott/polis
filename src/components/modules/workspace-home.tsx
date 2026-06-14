"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Upload,
  AlertTriangle,
  CircleAlert,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  FileWarning,
  Layers,
  Scale,
} from "lucide-react";
import { cn, daysUntil, getProductionStageLabel, getProductionStageColor, getDeadlineUrgency, getDeadlineUrgencyClasses, getDeadlineLabel, getSourceCoverageLabel, getSourceCoverageTone } from "@/lib/utils";
import type { WorkspaceSectionProps } from "./workspace-sections";

export function WorkspaceHome({ data }: WorkspaceSectionProps) {
  const { module, assignments, sources } = data;

  const reviewQueue = sources.filter((s) => s.needsReview);
  const processing = sources.filter((s) => s.isProcessing);
  const failed = sources.filter((s) => s.hasError);
  const processedSources = sources.filter((s) => s.status === "processed");

  const sortedDeadlines = [...assignments]
    .filter((a) => a.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextActions = buildNextActions(data, {
    reviewCount: reviewQueue.length,
    processingCount: processing.length,
    failedCount: failed.length,
  });

  const coverageToneByAssignment = assignments.map((a) => ({
    assignment: a,
    tone: getSourceCoverageTone(a.selectedSourceCount, processedSources.length),
  }));

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Workspaces
          </Link>
          <span>/</span>
          <span>{module.code}</span>
          <span>/</span>
          <span className="text-foreground">Home</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">
              {module.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {module.description || "No description set. Add one in Workspace Settings."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <StatBadge label="Sources" value={sources.length} />
            <StatBadge label="Processed" value={processedSources.length} tone="success" />
            <StatBadge label="Needs review" value={reviewQueue.length} tone={reviewQueue.length > 0 ? "warning" : "muted"} />
            <StatBadge label="Assessments" value={assignments.length} />
          </div>
        </div>
      </header>

      {nextActions.length > 0 && (
        <Section title="Suggested next actions" icon={Sparkles}>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {nextActions.map((action) => (
              <li key={action.id}>
                <Link
                  href={action.href}
                  className="group flex items-start gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", action.toneClass)}>
                    <action.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    {action.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{action.detail}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {reviewQueue.length > 0 && (
        <Section
          title="Imports needing review"
          icon={FileWarning}
          action={
            <Link
              href={`/modules/${module.id}?tab=imports`}
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              Open Imports <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {reviewQueue.slice(0, 4).map((source) => (
              <li key={source.id} className="flex items-center gap-3 px-5 py-3">
                <CircleAlert className="h-4 w-4 text-warning shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{source.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Classified as {source.classificationLabel.replace(/_/g, " ")} · review the suggested type
                  </p>
                </div>
                <Link
                  href={`/modules/${module.id}?tab=imports`}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Review
                </Link>
              </li>
            ))}
            {reviewQueue.length > 4 && (
              <li className="px-5 py-2 text-xs text-muted-foreground">
                + {reviewQueue.length - 4} more awaiting review
              </li>
            )}
          </ul>
        </Section>
      )}

      <Section
        title="Assessment deadlines & weights"
        icon={CalendarClock}
        action={
          <Link
            href={`/modules/${module.id}?tab=assessments`}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            Open Assessments <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        {assignments.length === 0 ? (
          <EmptyRow
            icon={ClipboardList}
            title="No assessments yet"
            description="Add an assessment to start tracking deadlines, weights, and source coverage."
            ctaHref={`/modules/${module.id}?tab=assessments`}
            ctaLabel="Open Assessments"
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {assignments.map((a) => {
              const urgency = getDeadlineUrgency(a.dueDate);
              return (
                <li key={a.id}>
                  <Link
                    href={`/modules/${module.id}/assignments/${a.id}`}
                    className="grid grid-cols-1 gap-3 px-5 py-4 hover:bg-muted/40 transition-colors sm:grid-cols-[1.5fr_1fr_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getSourceCoverageLabel(a.selectedSourceCount, processedSources.length)}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground uppercase tracking-wider">Stage</p>
                      <p className={cn("mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getProductionStageColor(a.stage))}>
                        {getProductionStageLabel(a.stage)}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground uppercase tracking-wider">Deadline</p>
                      <p className={cn("mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getDeadlineUrgencyClasses(urgency))}>
                        {getDeadlineLabel(urgency, a.dueDate)}
                      </p>
                    </div>
                    <div className="text-xs sm:text-right">
                      <p className="text-muted-foreground uppercase tracking-wider">Weight</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {a.rubricWeightTotal > 0 ? `${a.rubricWeightTotal}% allocated` : "Not set"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {sortedDeadlines.length > 0 && (
        <Section title="Deadline timeline" icon={CalendarClock}>
          <ol className="space-y-3">
            {sortedDeadlines.slice(0, 4).map((a) => {
              const urgency = getDeadlineUrgency(a.dueDate);
              const remaining = daysUntil(a.dueDate);
              return (
                <li key={a.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                  <div className={cn("flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md border text-center", getDeadlineUrgencyClasses(urgency))}>
                    <span className="text-[10px] uppercase tracking-wider leading-none">
                      {new Date(a.dueDate).toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                    <span className="text-sm font-bold leading-none mt-0.5">
                      {new Date(a.dueDate).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {remaining < 0
                        ? `${Math.abs(remaining)}d overdue`
                        : remaining === 0
                          ? "Due today"
                          : `${remaining}d remaining`}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getProductionStageColor(a.stage))}>
                    {getProductionStageLabel(a.stage)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      <Section title="Source coverage & missing context" icon={Layers}>
        {assignments.length === 0 ? (
          <EmptyRow
            icon={Layers}
            title="No coverage to report"
            description="Add an assessment to start tracking source coverage and context gaps."
          />
        ) : (
          <div className="space-y-3">
            {coverageToneByAssignment.map(({ assignment, tone }) => (
              <CoverageRow key={assignment.id} data={assignment} tone={tone} totalSources={processedSources.length} />
            ))}
          </div>
        )}
      </Section>

      {(processing.length > 0 || failed.length > 0) && (
        <Section title="Processing status" icon={Upload}>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusTile
              tone="accent"
              icon={Upload}
              count={processing.length}
              label="Sources processing"
              description={processing.length === 0 ? "Nothing in the queue." : "Text extraction and chunking in progress."}
            />
            <StatusTile
              tone="danger"
              icon={AlertTriangle}
              count={failed.length}
              label="Sources failed"
              description={failed.length === 0 ? "No failed imports." : "Retry from Imports to re-run extraction."}
            />
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatBadge({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-success/30 bg-success/5 text-success"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-border bg-muted/60 text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium uppercase tracking-wider", toneClass)}>
      <span className="text-foreground font-semibold">{value}</span>
      {label}
    </span>
  );
}

function EmptyRow({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          {ctaLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function StatusTile({
  tone,
  icon: Icon,
  count,
  label,
  description,
}: {
  tone: "accent" | "danger";
  icon: React.ElementType;
  count: number;
  label: string;
  description: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/5"
      : "border-accent/25 bg-accent/5";
  const iconClass = tone === "danger" ? "text-danger" : "text-accent";
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", iconClass)} />
        <p className="text-2xl font-semibold text-foreground tabular-nums">{count}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function CoverageRow({
  data,
  tone,
  totalSources,
}: {
  data: WorkspaceSectionProps["data"]["assignments"][number];
  tone: "low" | "medium" | "good" | "none";
  totalSources: number;
}) {
  const missing = data.missingContext;
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/modules/${data.moduleId}/assignments/${data.id}`}
            className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            {data.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {getSourceCoverageLabel(data.selectedSourceCount, totalSources)}
          </p>
        </div>
        <CoverageBadge tone={tone} />
      </div>
      {missing.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning"
            >
              <CircleAlert className="h-3 w-3" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {missing.length === 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-success">
          <CheckCircle2 className="h-3 w-3" />
          Context complete
        </p>
      )}
    </div>
  );
}

function CoverageBadge({ tone }: { tone: "low" | "medium" | "good" | "none" }) {
  const map = {
    none: { label: "No sources", class: "border-danger/30 bg-danger/10 text-danger", icon: CircleDashed },
    low: { label: "Thin coverage", class: "border-danger/30 bg-danger/10 text-danger", icon: CircleAlert },
    medium: { label: "Partial coverage", class: "border-warning/30 bg-warning/10 text-warning", icon: CircleAlert },
    good: { label: "Strong coverage", class: "border-success/30 bg-success/10 text-success", icon: CheckCircle2 },
  } as const;
  const config = map[tone];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", config.class)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface NextAction {
  id: string;
  label: string;
  detail?: string;
  href: string;
  icon: React.ElementType;
  toneClass: string;
}

function buildNextActions(
  data: WorkspaceSectionProps["data"],
  status: { reviewCount: number; processingCount: number; failedCount: number },
): NextAction[] {
  const actions: NextAction[] = [];
  const { module, assignments, sources } = data;

  if (status.failedCount > 0) {
    actions.push({
      id: "failed-imports",
      label: `${status.failedCount} import${status.failedCount === 1 ? "" : "s"} failed processing`,
      detail: "Retry extraction from the Imports tab.",
      href: `/modules/${module.id}?tab=imports`,
      icon: AlertTriangle,
      toneClass: "border-danger/40 bg-danger/10 text-danger",
    });
  }

  if (status.reviewCount > 0) {
    actions.push({
      id: "review-imports",
      label: `Review ${status.reviewCount} import${status.reviewCount === 1 ? "" : "s"} needing classification`,
      detail: "Confirm or correct the suggested source types.",
      href: `/modules/${module.id}?tab=imports`,
      icon: FileWarning,
      toneClass: "border-warning/40 bg-warning/10 text-warning",
    });
  }

  if (sources.length === 0) {
    actions.push({
      id: "first-import",
      label: "Import your first sources",
      detail: "Upload readings, lecture material, or the module handbook.",
      href: `/modules/${module.id}?tab=imports`,
      icon: Upload,
      toneClass: "border-accent/30 bg-accent/10 text-accent",
    });
  }

  if (assignments.length === 0 && sources.length > 0) {
    actions.push({
      id: "add-assessment",
      label: "Add an assessment",
      detail: "Capture the coursework question, deadline, and rubric.",
      href: `/modules/${module.id}?tab=assessments`,
      icon: ClipboardList,
      toneClass: "border-accent/30 bg-accent/10 text-accent",
    });
  }

  for (const assignment of assignments) {
    if (assignment.missingContext.length > 0) {
      actions.push({
        id: `missing-${assignment.id}`,
        label: `Complete context for ${assignment.title}`,
        detail: assignment.missingContext[0],
        href: `/modules/${module.id}/assignments/${assignment.id}`,
        icon: Scale,
        toneClass: "border-warning/40 bg-warning/10 text-warning",
      });
    }
  }

  return actions.slice(0, 6);
}
