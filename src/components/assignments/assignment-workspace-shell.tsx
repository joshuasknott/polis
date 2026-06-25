"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileText,
  GitBranch,
  LayoutList,
  Map,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import {
  cn,
  formatDate,
  getDeadlineLabel,
  getDeadlineUrgency,
  getDeadlineUrgencyClasses,
  getProductionStageColor,
  getProductionStageLabel,
} from "@/lib/utils";
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
    id: "plan",
    label: "Plan",
    icon: Map,
    description:
      "Brief, selected sources, evidence map, gap analysis, thesis, and section plan.",
    stage: "build" as ProductionStage,
  },
  {
    id: "write",
    label: "Write",
    icon: PenLine,
    description:
      "Drafting, source provenance, citation labels, and writing help.",
    stage: "draft" as ProductionStage,
  },
  {
    id: "review",
    label: "Review",
    icon: ShieldCheck,
    description:
      "Review findings, citation safety, rubric fit, and readiness.",
    stage: "refine" as ProductionStage,
  },
] satisfies Array<{
  id: AssessmentTab;
  label: string;
  icon: React.ElementType;
  description: string;
  stage: ProductionStage;
}>;

const TAB_STAGE: Record<AssessmentTab, ProductionStage> = {
  plan: "build",
  write: "draft",
  review: "refine",
};

const PLAN_INTERNAL_STAGES = new Set<ProductionStage>([
  "ingest",
  "understand",
  "map",
  "judge",
  "build",
]);

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

function getCoThinkerStage(activeTab: AssessmentTab, assignmentStage: ProductionStage) {
  if (activeTab === "plan") {
    return PLAN_INTERNAL_STAGES.has(assignmentStage) ? assignmentStage : "build";
  }
  return TAB_STAGE[activeTab];
}

function countEvidence(argumentsList: Argument[]) {
  return argumentsList.reduce((sum, argument) => sum + argument.evidenceLinks.length, 0);
}

function getPlanReadiness({
  assignment,
  assignmentSources,
  argumentsList,
  evidenceGaps,
  workingThesis,
  sectionPlans,
}: {
  assignment: Assignment;
  assignmentSources: SourceFile[];
  argumentsList: Argument[];
  evidenceGaps: string[];
  workingThesis?: string;
  sectionPlans: SectionPlan[];
}) {
  const items = [
    { label: "Brief", done: Boolean(assignment.question && assignment.wordLimit && assignment.dueDate) },
    { label: "Sources", done: assignmentSources.length > 0 },
    { label: "Evidence map", done: argumentsList.length > 0 && countEvidence(argumentsList) > 0 },
    { label: "Gap analysis", done: evidenceGaps.length > 0 || argumentsList.length > 0 },
    { label: "Thesis", done: Boolean(workingThesis && workingThesis.trim().length > 0) },
    { label: "Section plan", done: sectionPlans.length > 0 },
  ];

  return {
    items,
    doneCount: items.filter((item) => item.done).length,
  };
}

function PlanMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        tone === "success" && "border-success/30 bg-success/5",
        tone === "warning" && "border-warning/30 bg-warning/5",
        tone === "neutral" && "border-border",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function PlanSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Icon className="h-5 w-5 text-accent" />
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PlanWorkspace({
  assignment,
  allModuleSources,
  assignmentArguments,
  judgements,
  evidenceGaps,
  workingThesis,
  assignmentSources,
  assignmentConvexId,
  sectionPlans,
}: {
  assignment: Assignment;
  allModuleSources: SourceFile[];
  assignmentArguments: Argument[];
  judgements: Judgement[];
  evidenceGaps: string[];
  workingThesis?: string;
  assignmentSources: SourceFile[];
  assignmentConvexId?: string;
  sectionPlans: SectionPlan[];
}) {
  const readiness = getPlanReadiness({
    assignment,
    assignmentSources,
    argumentsList: assignmentArguments,
    evidenceGaps,
    workingThesis,
    sectionPlans,
  });
  const evidenceCount = countEvidence(assignmentArguments);

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PlanMetric
          icon={BookOpen}
          label="Source coverage"
          value={`${assignmentSources.length}/${allModuleSources.length}`}
          detail={
            assignmentSources.length > 0
              ? "Sources selected for this assessment"
              : "Select readings, briefs, and rubric sources"
          }
          tone={assignmentSources.length > 0 ? "success" : "warning"}
        />
        <PlanMetric
          icon={GitBranch}
          label="Evidence map"
          value={`${assignmentArguments.length}`}
          detail={`${evidenceCount} linked evidence item${evidenceCount === 1 ? "" : "s"}`}
          tone={evidenceCount > 0 ? "success" : "warning"}
        />
        <PlanMetric
          icon={CircleAlert}
          label="Gaps"
          value={`${evidenceGaps.length}`}
          detail={evidenceGaps.length > 0 ? "Known gaps to resolve" : "No recorded gap signals yet"}
          tone={evidenceGaps.length > 0 ? "warning" : "neutral"}
        />
        <PlanMetric
          icon={LayoutList}
          label="Plan readiness"
          value={`${readiness.doneCount}/${readiness.items.length}`}
          detail="Brief, sources, evidence, thesis, and sections"
          tone={readiness.doneCount === readiness.items.length ? "success" : "neutral"}
        />
      </div>

      <PlanSection
        icon={FileText}
        title="Brief and requirements"
        description="Keep the question, deadline, word limit, and rubric visible while you plan."
      >
        <AssignmentBriefPanel assignment={assignment} />
      </PlanSection>

      <PlanSection
        icon={BookOpen}
        title="Selected sources"
        description="Choose the sources this assessment should consume from the live Source Base."
      >
        <AssignmentSourceBase
          allModuleSources={allModuleSources}
          initialSelectedIds={assignment.selectedSourceIds}
          assignmentId={assignmentConvexId ?? assignment.id}
        />
      </PlanSection>

      <PlanSection
        icon={Sparkles}
        title="Source understanding"
        description="Generate or review source summaries, concepts, claims, notes, and limitations before mapping evidence."
      >
        <UnderstandStage
          assignment={assignment}
          assignmentSources={assignmentSources}
          assignmentConvexId={assignmentConvexId}
        />
      </PlanSection>

      <PlanSection
        icon={GitBranch}
        title="Evidence map"
        description="Turn claims into a source-backed argument map, with each evidence link traceable to an uploaded source."
      >
        <EvidenceMap
          arguments={assignmentArguments}
          evidenceGaps={evidenceGaps}
          assignmentConvexId={assignmentConvexId ?? assignment.id}
          assignmentSources={assignmentSources}
        />
      </PlanSection>

      <PlanSection
        icon={Target}
        title="Gap analysis and judgement"
        description="Compare possible positions, rubric risks, counterarguments, and missing evidence before committing to a thesis."
      >
        <JudgeStage
          assignment={assignment}
          arguments={assignmentArguments}
          judgements={judgements}
          assignmentConvexId={assignmentConvexId ?? assignment.id}
        />
      </PlanSection>

      <PlanSection
        icon={LayoutList}
        title="Thesis and section plan"
        description="Build the working thesis, word budget, section plan, and argument order that Write will use."
      >
        <ArgumentBuilder
          assignment={assignment}
          arguments={assignmentArguments}
          workingThesis={workingThesis}
          sectionPlans={sectionPlans}
          assignmentConvexId={assignmentConvexId ?? assignment.id}
        />
      </PlanSection>
    </div>
  );
}

function PhaseSummary({
  assignment,
  assignmentSources,
  assignmentArguments,
  evidenceGaps,
  draft,
  review,
}: {
  assignment: Assignment;
  assignmentSources: SourceFile[];
  assignmentArguments: Argument[];
  evidenceGaps: string[];
  draft?: Draft;
  review?: Review;
}) {
  const urgency = getDeadlineUrgency(assignment.dueDate);
  const evidenceCount = countEvidence(assignmentArguments);
  const sourceLabel =
    assignmentSources.length === 1
      ? "1 selected source"
      : `${assignmentSources.length} selected sources`;

  return (
    <div className="flex flex-wrap gap-2">
      <span className={cn("inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium", getDeadlineUrgencyClasses(urgency))}>
        <CalendarClock className="h-3.5 w-3.5" />
        {getDeadlineLabel(urgency, assignment.dueDate)}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        {sourceLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" />
        {assignmentArguments.length} claims / {evidenceCount} evidence
      </span>
      {evidenceGaps.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
          <CircleAlert className="h-3.5 w-3.5" />
          {evidenceGaps.length} gap{evidenceGaps.length === 1 ? "" : "s"}
        </span>
      )}
      {draft && (
        <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <PenLine className="h-3.5 w-3.5" />
          Draft v{draft.version}
        </span>
      )}
      {review && (
        <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Review findings ready
        </span>
      )}
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
  const coThinkerStage = getCoThinkerStage(activeTab, assignment.stage);

  const evidenceGaps = judgements
    .filter(
      (judgement) =>
        judgement.type === "evidence_sufficiency" ||
        judgement.type === "gap_analysis",
    )
    .flatMap((judgement) => judgement.findings);

  const renderTabContent = () => {
    switch (activeTab) {
      case "plan":
        return (
          <PlanWorkspace
            assignment={assignment}
            allModuleSources={allModuleSources}
            assignmentArguments={assignmentArguments}
            judgements={judgements}
            evidenceGaps={evidenceGaps}
            workingThesis={workingThesis}
            assignmentSources={assignmentSources}
            assignmentConvexId={assignmentConvexId}
            sectionPlans={sectionPlans}
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
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 border-b border-border pb-6">
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
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getProductionStageColor(assignment.stage))}>
                    {getProductionStageLabel(assignment.stage)}
                  </span>
                  {assignment.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(assignment.dueDate)}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
                  {assignment.title}
                </h1>
                {assignment.question ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {assignment.question}
                  </p>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                    <CircleAlert className="h-4 w-4" />
                    Add the assessment question in Plan.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCoThinkerOpen((open) => !open)}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

            <div className="mt-5">
              <PhaseSummary
                assignment={assignment}
                assignmentSources={assignmentSources}
                assignmentArguments={assignmentArguments}
                evidenceGaps={evidenceGaps}
                draft={draft}
                review={review}
              />
            </div>
          </div>

          <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
            <nav
              aria-label="Assessment tabs"
              className="flex min-w-[24rem] gap-1 rounded-xl border border-border bg-card p-1.5"
            >
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={`/modules/${module.id}/assignments/${assignment.id}?tab=${tab.id}`}
                    className={cn(
                      "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold-soft/50 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      isActive &&
                        "before:absolute before:left-1/2 before:-translate-x-1/2 before:bottom-1 before:h-0.5 before:w-5 before:rounded-full before:bg-gold",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    title={tab.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <ActiveIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {activeTabConfig.label}
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                {activeTabConfig.description}
              </p>
            </div>
          </div>

          {renderTabContent()}
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
                stage={coThinkerStage}
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
