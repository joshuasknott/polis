"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Target,
  Swords,
  AlignLeft,
  ListChecks,
  ChevronRight,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Play,
  History,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Assignment,
  Module,
  Review,
  Draft,
  RubricCriterion,
} from "@/lib/types";

type ReviewSection =
  | "summary"
  | "unsupported"
  | "missing"
  | "citation"
  | "rubric"
  | "counterargument"
  | "structure"
  | "priorities"
  | "readiness"
  | "history";

interface SectionConfig {
  id: ReviewSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: "success" | "warning" | "danger" | "info";
}

const REVIEW_SECTIONS: SectionConfig[] = [
  {
    id: "summary",
    label: "Review Summary",
    icon: FileText,
    severity: "info",
  },
  {
    id: "unsupported",
    label: "Unsupported Claims",
    icon: XCircle,
    severity: "danger",
  },
  {
    id: "missing",
    label: "Missing Evidence",
    icon: AlertTriangle,
    severity: "warning",
  },
  {
    id: "citation",
    label: "Citation Safety",
    icon: ShieldCheck,
    severity: "warning",
  },
  {
    id: "rubric",
    label: "Rubric Alignment",
    icon: Target,
    severity: "info",
  },
  {
    id: "counterargument",
    label: "Counterargument Strength",
    icon: Swords,
    severity: "warning",
  },
  {
    id: "structure",
    label: "Structure & Clarity",
    icon: AlignLeft,
    severity: "info",
  },
  {
    id: "priorities",
    label: "Revision Priorities",
    icon: ListChecks,
    severity: "warning",
  },
  {
    id: "readiness",
    label: "Readiness Checklist",
    icon: CheckCircle2,
    severity: "success",
  },
  {
    id: "history",
    label: "Review History",
    icon: History,
    severity: "info",
  },
];

function SeverityBadge({
  severity,
  count,
}: {
  severity: string;
  count: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[10px] font-bold tabular-nums",
        severity === "danger" && "bg-danger/15 text-danger",
        severity === "warning" && "bg-warning/15 text-warning",
        severity === "success" && "bg-success/15 text-success",
        severity === "info" && "bg-accent/10 text-accent",
      )}
    >
      {count}
    </span>
  );
}

function ReviewCard({
  title,
  children,
  severity,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  severity: "success" | "warning" | "danger" | "info";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        severity === "danger" && "border-danger/20 bg-danger/[0.02]",
        severity === "warning" && "border-warning/20 bg-warning/[0.02]",
        severity === "success" && "border-success/20 bg-success/[0.02]",
        severity === "info" && "border-border bg-card",
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  );
}

function FindingItem({
  text,
  icon: Icon,
  severity,
  resolved,
  onResolve,
}: {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: "success" | "warning" | "danger" | "info";
  resolved?: boolean;
  onResolve?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon
        className={cn(
          "h-4 w-4 mt-0.5 shrink-0",
          resolved && "opacity-40",
          severity === "danger" && "text-danger",
          severity === "warning" && "text-warning",
          severity === "success" && "text-success",
          severity === "info" && "text-accent",
        )}
      />
      <p
        className={cn(
          "text-sm text-foreground/90 leading-relaxed flex-1",
          resolved && "line-through text-muted-foreground",
        )}
      >
        {text}
      </p>
      {onResolve && (
        <button
          onClick={onResolve}
          className={cn(
            "shrink-0 text-xs font-medium px-2 py-1 rounded-md transition-colors",
            resolved
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {resolved ? "Resolved" : "Resolve"}
        </button>
      )}
    </div>
  );
}

function RubricRow({
  criterion,
  alignment,
}: {
  criterion: RubricCriterion;
  alignment: "strong" | "adequate" | "weak" | "missing";
}) {
  const colors: Record<string, string> = {
    strong: "bg-success text-success",
    adequate: "bg-warning text-warning",
    weak: "bg-danger text-danger",
    missing: "bg-muted-foreground text-muted-foreground",
  };

  const labels: Record<string, string> = {
    strong: "Strong",
    adequate: "Adequate",
    weak: "Weak",
    missing: "Not addressed",
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{criterion.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {criterion.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">
          {criterion.weight}%
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              colors[alignment].split(" ")[0],
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              colors[alignment].split(" ")[1],
            )}
          >
            {labels[alignment]}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReadinessItem({
  label,
  passed,
  detail,
}: {
  label: string;
  passed: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      {passed ? (
        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function computeRubricAlignments(
  rubric: RubricCriterion[],
  review: Review,
): Array<{
  criterion: RubricCriterion;
  alignment: "strong" | "adequate" | "weak" | "missing";
}> {
  return rubric.map((criterion, i) => {
    const hasStrength = review.strengths.some(
      (s) =>
        s.toLowerCase().includes(criterion.name.toLowerCase()) ||
        s
          .toLowerCase()
          .includes(criterion.description.toLowerCase().split(" ")[0]),
    );
    const hasWeakness = review.weaknesses.some(
      (w) =>
        w.toLowerCase().includes(criterion.name.toLowerCase()) ||
        w
          .toLowerCase()
          .includes(criterion.description.toLowerCase().split(" ")[0]),
    );

    if (hasStrength && !hasWeakness)
      return { criterion, alignment: "strong" as const };
    if (hasWeakness && !hasStrength)
      return { criterion, alignment: "weak" as const };
    if (hasStrength && hasWeakness)
      return { criterion, alignment: "adequate" as const };
    return {
      criterion,
      alignment: i < 2 ? ("adequate" as const) : ("missing" as const),
    };
  });
}

function buildReadinessChecklist(
  review: Review,
  draft: Draft,
  assignment: Assignment,
) {
  const wordRatio = draft.wordCount / assignment.wordLimit;
  const withinLimit = wordRatio >= 0.9 && wordRatio <= 1.1;

  return [
    {
      label: "Word count within range",
      passed: withinLimit,
      detail: withinLimit
        ? `${draft.wordCount} words (${Math.round(wordRatio * 100)}% of ${assignment.wordLimit})`
        : `${draft.wordCount} words \u2014 ${wordRatio < 0.9 ? "under" : "over"} the ${assignment.wordLimit}-word limit`,
    },
    {
      label: "No unsupported claims",
      passed: review.unsupportedClaims.length === 0,
      detail:
        review.unsupportedClaims.length === 0
          ? "All claims are supported by evidence"
          : `${review.unsupportedClaims.length} claim${review.unsupportedClaims.length > 1 ? "s" : ""} lack source support`,
    },
    {
      label: "Evidence gaps addressed",
      passed: review.missingEvidence.length === 0,
      detail:
        review.missingEvidence.length === 0
          ? "Evidence base covers all argument sections"
          : `${review.missingEvidence.length} evidence gap${review.missingEvidence.length > 1 ? "s" : ""} remain`,
    },
    {
      label: "Revision priorities addressed",
      passed: false,
      detail: "Review revision priorities before submitting",
    },
    {
      label: "Citation formatting verified",
      passed: false,
      detail:
        "Manually check all citations match your reference style",
    },
    {
      label: "University AI policy compliance",
      passed: false,
      detail:
        "Confirm this submission follows your university\u2019s AI use policy",
    },
  ];
}

interface RefineWorkspaceProps {
  module: Module;
  assignment: Assignment;
  draft: Draft | undefined;
  review: Review | undefined;
  assignmentConvexId: string;
}

export function RefineWorkspace({
  module,
  assignment,
  draft,
  review,
  assignmentConvexId,
}: RefineWorkspaceProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<ReviewSection>("summary");
  const [runningReview, setRunningReview] = useState(false);
  const [runningCitation, setRunningCitation] = useState(false);

  const runReviewAction = useAction(api.reviews.runReview);
  const runCitationAction = useAction(api.citationSafety.runCitationSafetyCheck);
  const updateStage = useMutation(api.assignments.updateStage);
  const resolveFinding = useMutation(api.reviews.updateFinding);

  const reviewHistory = useQuery(
    api.reviews.listRunsForAssignment,
    assignmentConvexId
      ? {
          assignmentId: assignmentConvexId as Id<"assignments">,
        }
      : "skip",
  );

  const currentRunFindings = useQuery(
    api.reviews.listFindings,
    review?.id
      ? { reviewRunId: review.id as Id<"reviewRuns"> }
      : "skip",
  );

  const handleRunReview = useCallback(async () => {
    if (!draft || !assignmentConvexId) return;
    setRunningReview(true);
    try {
      await runReviewAction({
        assignmentId: assignmentConvexId as Id<"assignments">,
        draftId: draft.id as Id<"drafts">,
      });
    } finally {
      setRunningReview(false);
    }
  }, [draft, assignmentConvexId, runReviewAction]);

  const handleRunCitationCheck = useCallback(async () => {
    if (!draft || !assignmentConvexId) return;
    setRunningCitation(true);
    try {
      await runCitationAction({
        assignmentId: assignmentConvexId as Id<"assignments">,
        draftId: draft.id as Id<"drafts">,
      });
    } finally {
      setRunningCitation(false);
    }
  }, [draft, assignmentConvexId, runCitationAction]);

  const handleResolveFinding = useCallback(
    async (findingId: string) => {
      await resolveFinding({
        findingId: findingId as Id<"reviewFindings">,
        resolved: true,
      });
    },
    [resolveFinding],
  );

  const handleNavigateToDraft = useCallback(async () => {
    if (!assignmentConvexId) return;
    await updateStage({
      assignmentId: assignmentConvexId as Id<"assignments">,
      stage: "draft",
    });
    router.push(
      `/modules/${module.id}/assignments/${assignment.id}?stage=draft`,
    );
  }, [assignmentConvexId, updateStage, router, module.id, assignment.id]);

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No draft to review</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Create and save a draft in the Draft stage before running a review.
        </p>
        <button
          onClick={handleNavigateToDraft}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Draft
        </button>
      </div>
    );
  }

  const rubricAlignments =
    review && assignment.rubric.length > 0
      ? computeRubricAlignments(assignment.rubric, review)
      : [];

  const readinessChecklist = review
    ? buildReadinessChecklist(review, draft, assignment)
    : [];

  const readinessScore = readinessChecklist.filter((c) => c.passed).length;

  const getCounts = (sectionId: ReviewSection): number => {
    if (!review) return 0;
    switch (sectionId) {
      case "unsupported":
        return review.unsupportedClaims.length;
      case "missing":
        return review.missingEvidence.length;
      case "priorities":
        return review.revisionPriorities.length;
      case "readiness":
        return readinessChecklist.length - readinessScore;
      case "history":
        return reviewHistory?.length ?? 0;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{module.code}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate">{assignment.title}</span>
          <ChevronRight className="h-3 w-3" />
          <span>Draft v{draft.version}</span>
        </div>
        <p className="text-sm text-foreground/80 font-serif italic leading-relaxed">
          &ldquo;{assignment.question}&rdquo;
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-muted/60 border border-border px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">
            Pre-submission review
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            This review identifies weaknesses and risks in your draft. It does
            not rewrite your work or generate content for submission. You remain
            responsible for all final edits.
          </p>
        </div>
      </div>

      {!review && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Play className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Run a review
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Analyse your draft for strengths, weaknesses, unsupported claims,
            missing evidence, and rubric alignment.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleRunReview}
              disabled={runningReview}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {runningReview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {runningReview ? "Running\u2026" : "Run Review"}
            </button>
          </div>
        </div>
      )}

      {review && (
        <div className="flex gap-6">
          <div className="w-56 shrink-0">
            <div className="sticky top-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Review sections
              </h3>
              <nav className="flex flex-col gap-0.5">
                {REVIEW_SECTIONS.map((section) => {
                  const isActive = section.id === activeSection;
                  const count = getCounts(section.id);
                  const SIcon = section.icon;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <SIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{section.label}</span>
                      {count > 0 && (
                        <SeverityBadge
                          severity={section.severity}
                          count={count}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    Readiness
                  </span>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {readinessScore}/{readinessChecklist.length}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      readinessScore === readinessChecklist.length
                        ? "bg-success"
                        : readinessScore > readinessChecklist.length / 2
                          ? "bg-warning"
                          : "bg-danger",
                    )}
                    style={{
                      width: `${(readinessScore / readinessChecklist.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {activeSection === "summary" && (
              <>
                <ReviewCard title="Strengths" severity="success" defaultOpen>
                  {review.strengths.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No specific strengths identified yet.
                    </p>
                  ) : (
                    review.strengths.map((s, i) => (
                      <FindingItem
                        key={i}
                        text={s}
                        icon={CheckCircle2}
                        severity="success"
                      />
                    ))
                  )}
                </ReviewCard>
                <ReviewCard title="Weaknesses" severity="warning" defaultOpen>
                  {review.weaknesses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No specific weaknesses identified.
                    </p>
                  ) : (
                    review.weaknesses.map((w, i) => (
                      <FindingItem
                        key={i}
                        text={w}
                        icon={AlertTriangle}
                        severity="warning"
                      />
                    ))
                  )}
                </ReviewCard>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Overall assessment
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {review.overallFeedback}
                  </p>
                </div>
              </>
            )}

            {activeSection === "unsupported" && (
              <ReviewCard
                title="Unsupported Claims"
                severity="danger"
                defaultOpen
              >
                {review.unsupportedClaims.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No unsupported claims detected in this draft.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      These claims lack sufficient evidence in your current
                      source base. Add supporting sources or rephrase as
                      acknowledged interpretation.
                    </p>
                    {(currentRunFindings ?? [])
                      .filter((f) => f.category === "unsupported_claim")
                      .map((finding) => (
                        <FindingItem
                          key={finding._id}
                          text={finding.content}
                          icon={XCircle}
                          severity="danger"
                          resolved={finding.resolved ?? false}
                          onResolve={() =>
                            handleResolveFinding(finding._id)
                          }
                        />
                      ))}
                    {review.unsupportedClaims
                      .filter(
                        (claim) =>
                          !(currentRunFindings ?? []).some(
                            (f) =>
                              f.category === "unsupported_claim" &&
                              f.content === claim,
                          ),
                      )
                      .map((claim, i) => (
                        <FindingItem
                          key={`legacy-${i}`}
                          text={claim}
                          icon={XCircle}
                          severity="danger"
                        />
                      ))}
                  </>
                )}
              </ReviewCard>
            )}

            {activeSection === "missing" && (
              <ReviewCard
                title="Missing Evidence"
                severity="warning"
                defaultOpen
              >
                {review.missingEvidence.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No evidence gaps identified.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your argument would benefit from additional source support
                      in these areas. Consider uploading relevant sources.
                    </p>
                    {(currentRunFindings ?? [])
                      .filter((f) => f.category === "missing_evidence")
                      .map((finding) => (
                        <FindingItem
                          key={finding._id}
                          text={finding.content}
                          icon={BookOpen}
                          severity="warning"
                          resolved={finding.resolved ?? false}
                          onResolve={() =>
                            handleResolveFinding(finding._id)
                          }
                        />
                      ))}
                  </>
                )}
              </ReviewCard>
            )}

            {activeSection === "citation" && (
              <ReviewCard
                title="Citation Safety"
                severity="warning"
                defaultOpen
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Citation safety checks help identify claims that may lack
                  proper source attribution. This is not a plagiarism checker
                  \u2014 always verify your references manually.
                </p>
                {review.unsupportedClaims.length > 0 && (
                  <FindingItem
                    text={`${review.unsupportedClaims.length} claim${review.unsupportedClaims.length > 1 ? "s" : ""} may need citation support`}
                    icon={AlertTriangle}
                    severity="warning"
                  />
                )}
                <FindingItem
                  text="Check all paraphrased material includes proper citations"
                  icon={ShieldCheck}
                  severity="info"
                />
                <FindingItem
                  text="Verify page numbers and direct quotes match original sources"
                  icon={ShieldCheck}
                  severity="info"
                />
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={handleRunCitationCheck}
                    disabled={runningCitation}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
                  >
                    {runningCitation ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    {runningCitation
                      ? "Checking\u2026"
                      : "Run citation safety check"}
                  </button>
                </div>
              </ReviewCard>
            )}

            {activeSection === "rubric" && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Rubric Alignment
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {review.rubricAlignment}
                </p>
                {rubricAlignments.length > 0 ? (
                  <div>
                    {rubricAlignments.map(({ criterion, alignment }) => (
                      <RubricRow
                        key={criterion.name}
                        criterion={criterion}
                        alignment={alignment}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No rubric criteria defined for this assignment.
                  </p>
                )}
              </div>
            )}

            {activeSection === "counterargument" && (
              <ReviewCard
                title="Counterargument Strength"
                severity="warning"
                defaultOpen
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Strong submissions address plausible objections. Review whether
                  your draft acknowledges and engages with counterarguments.
                </p>
                <FindingItem
                  text="Ensure each major claim has at least one acknowledged counterargument"
                  icon={Swords}
                  severity="warning"
                />
                <FindingItem
                  text="Address counterarguments with evidence rather than dismissal"
                  icon={Swords}
                  severity="info"
                />
              </ReviewCard>
            )}

            {activeSection === "structure" && (
              <ReviewCard
                title="Structure & Clarity"
                severity="info"
                defaultOpen
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Check that your submission follows a clear, signposted
                  structure aligned with the assessment question.
                </p>
                {review.weaknesses
                  .filter(
                    (w) =>
                      w.toLowerCase().includes("structure") ||
                      w.toLowerCase().includes("organisation") ||
                      w.toLowerCase().includes("signpost"),
                  )
                  .map((w, i) => (
                    <FindingItem
                      key={i}
                      text={w}
                      icon={AlertTriangle}
                      severity="warning"
                    />
                  ))}
                <FindingItem
                  text="Each section should begin with a clear topic sentence"
                  icon={AlignLeft}
                  severity="info"
                />
                <FindingItem
                  text="Transition between sections to maintain argument flow"
                  icon={AlignLeft}
                  severity="info"
                />
              </ReviewCard>
            )}

            {activeSection === "priorities" && (
              <ReviewCard
                title="Revision Priorities"
                severity="warning"
                defaultOpen
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Address these in order of priority to maximise improvement
                  before submission.
                </p>
                {review.revisionPriorities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No specific revision priorities identified.
                  </p>
                ) : (
                  review.revisionPriorities.map((priority, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {priority}
                      </p>
                    </div>
                  ))
                )}
              </ReviewCard>
            )}

            {activeSection === "readiness" && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Final Readiness Checklist
                  </h3>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums px-2 py-1 rounded-full",
                      readinessScore === readinessChecklist.length
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {readinessScore}/{readinessChecklist.length} passed
                  </span>
                </div>
                {readinessChecklist.map((item, i) => (
                  <ReadinessItem key={i} {...item} />
                ))}

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 rounded-lg bg-warning/5 border border-warning/20 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Student responsibility
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        You remain fully responsible for your final submitted
                        work. This checklist helps you prepare \u2014 it does
                        not guarantee a grade or replace your own judgement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "history" && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Review History
                  </h3>
                  <button
                    onClick={handleRunReview}
                    disabled={runningReview}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
                  >
                    {runningReview ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Re-run
                  </button>
                </div>
                {!reviewHistory || reviewHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No previous reviews.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviewHistory.map((run) => (
                      <div
                        key={run._id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3",
                          run._id === review?.id
                            ? "border-accent/30 bg-accent/5"
                            : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {run.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : (
                            <Loader2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {run.status === "completed"
                                ? "Completed"
                                : run.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(run.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {run._id === review?.id && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                            Current
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Return to Draft
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go back to the Draft stage to apply revision priorities.
                </p>
              </div>
              <button
                onClick={handleNavigateToDraft}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Edit Draft
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
