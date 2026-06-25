"use client";

import { useState } from "react";
import {
  BookOpen,
  FileText,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  SkipForward,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { SourceFile, Assignment } from "@/lib/types";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface UnderstandStageProps {
  assignment: Assignment;
  assignmentSources: SourceFile[];
  assignmentConvexId?: string;
}

type AnalysisType = "summary" | "main_argument" | "limitations";

function SourceAnalysisCard({
  source,
  assignmentConvexId,
}: {
  source: SourceFile;
  assignmentConvexId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState<string | null>(null);

  const data = useQuery(
    api.sourceAnalyses.getForSource,
    assignmentConvexId
      ? {
          sourceId: source.id as Id<"sources">,
          assignmentId: assignmentConvexId as Id<"assignments">,
        }
      : {
          sourceId: source.id as Id<"sources">,
        },
  );

  const createAnalysis = useMutation(api.sourceAnalyses.createAnalysis);
  const markSkipped = useMutation(api.sourceAnalyses.markSourceAnalysed);
  const analyseSource = useAction(api.sourceAnalysisAI.analyseSource);
  const [generating, setGenerating] = useState<string | null>(null);

  const isProcessed = source.status === "processed" || source.status === "needs_review";
  const isProcessing = source.status === "processing";

  const summaryAnalysis = data?.analyses.find((a) => a.analysisType === "summary");
  const argumentAnalysis = data?.analyses.find((a) => a.analysisType === "main_argument");
  const limitationsAnalysis = data?.analyses.find((a) => a.analysisType === "limitations");
  const skipAnalysis = data?.analyses.find((a) => a.analysisType === "skip");
  const isSkipped = Boolean(skipAnalysis);
  const hasAnyAnalysis = Boolean(
    summaryAnalysis || argumentAnalysis || limitationsAnalysis,
  );

  async function generateAnalysis(type: AnalysisType) {
    if (!assignmentConvexId) return;
    setGenerating(type);
    try {
      const result = await analyseSource({
        sourceId: source.id as Id<"sources">,
        analysisTypes: [type],
      });
      if (!result?.success) {
        const content = buildFallbackContent(type, source);
        await createAnalysis({
          sourceId: source.id as Id<"sources">,
          assignmentId: assignmentConvexId as Id<"assignments">,
          analysisType: type,
          content,
        });
      }
    } catch {
      const content = buildFallbackContent(type, source);
      await createAnalysis({
        sourceId: source.id as Id<"sources">,
        assignmentId: assignmentConvexId as Id<"assignments">,
        analysisType: type,
        content,
      });
    } finally {
      setGenerating(null);
    }
  }

  async function handleRegenerate(type: AnalysisType) {
    if (confirmRegenerate === type) {
      setConfirmRegenerate(null);
      await generateAnalysis(type);
    } else {
      setConfirmRegenerate(type);
    }
  }

  async function handleSkip() {
    if (!assignmentConvexId) return;
    await markSkipped({
      sourceId: source.id as Id<"sources">,
      assignmentId: assignmentConvexId as Id<"assignments">,
      skipped: true,
    });
  }

  function buildFallbackContent(type: AnalysisType, src: SourceFile): string {
    switch (type) {
      case "summary":
        return src.summary || `Summary not available for "${src.title}". Connect an AI provider in Settings for automatic analysis.`;
      case "main_argument":
        return `Main argument extraction unavailable for "${src.title}". Connect an AI provider for automatic analysis.`;
      case "limitations":
        return `Limitations analysis unavailable for "${src.title}". Connect an AI provider for automatic analysis.`;
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm transition-all",
        isSkipped && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
            isProcessed
              ? "bg-source/10"
              : isProcessing
                ? "bg-warning/10"
                : "bg-danger/10",
          )}
        >
          {isProcessed ? (
            <CheckCircle2 className="h-4 w-4 text-source" />
          ) : isProcessing ? (
            <Loader2 className="h-4 w-4 text-warning animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 text-danger" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">
              {source.title}
            </h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                getStatusColor(source.status),
              )}
            >
              {getStatusLabel(source.status)}
            </span>
            {isSkipped && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Skipped
              </span>
            )}
            {hasAnyAnalysis && !isSkipped && (
              <span className="inline-flex items-center rounded-full bg-source/10 px-2 py-0.5 text-[10px] font-medium text-source">
                Analysed
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {source.author}
            {source.year ? ` (${source.year})` : ""}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {!isProcessed && !isSkipped && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <div className="flex items-center gap-2 text-xs text-warning font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                This source has not been processed yet. Analysis will be available after processing completes.
              </div>
            </div>
          )}

          {!hasAnyAnalysis && isProcessed && !isSkipped && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateAnalysis("summary")}
                disabled={generating !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {generating === "summary" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Generate Analysis
              </button>
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          )}

          {summaryAnalysis && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-interpretation" />
                  Summary
                  <span className="inline-flex items-center rounded-full border border-source/20 bg-source/10 px-1.5 py-0.5 text-[9px] font-medium text-source normal-case tracking-normal">
                    Source-supported
                  </span>
                </h4>
                <button
                  onClick={() => handleRegenerate("summary")}
                  disabled={generating !== null}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  {confirmRegenerate === "summary" ? "Confirm" : "Regenerate"}
                </button>
              </div>
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {summaryAnalysis.content}
              </p>
            </div>
          )}

          {argumentAnalysis && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-source" />
                  Main Argument
                  <span className="inline-flex items-center rounded-full border border-interpretation/20 bg-interpretation/10 px-1.5 py-0.5 text-[9px] font-medium text-interpretation normal-case tracking-normal">
                    Interpretation
                  </span>
                </h4>
                <button
                  onClick={() => handleRegenerate("main_argument")}
                  disabled={generating !== null}
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  {confirmRegenerate === "main_argument" ? "Confirm" : "Regenerate"}
                </button>
              </div>
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {argumentAnalysis.content}
              </p>
            </div>
          )}

          {data?.concepts && data.concepts.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-interpretation" />
                Key Concepts
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.concepts.map((concept) => (
                  <div
                    key={concept._id}
                    className="rounded-lg border border-border bg-muted/50 px-3 py-1.5"
                  >
                    <span className="text-xs font-medium">{concept.concept}</span>
                    {concept.definition && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {concept.definition}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.claims && data.claims.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <BookOpen className="h-3.5 w-3.5 text-source" />
                Source Claims
              </h4>
              <div className="space-y-2">
                {data.claims.map((claim) => (
                  <div
                    key={claim._id}
                    className="rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground">{claim.claim}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                          claim.strength === "strong" &&
                            "bg-source/10 text-source",
                          claim.strength === "moderate" &&
                            "bg-interpretation/10 text-interpretation",
                          claim.strength === "weak" && "bg-warning/10 text-warning",
                        )}
                      >
                        {claim.strength ?? "moderate"}
                      </span>
                    </div>
                    {claim.pageRange && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Pages: {claim.pageRange}
                      </p>
                    )}
                    {!claim.pageRange && (
                      <p className="mt-1 text-[10px] text-warning flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Page reference unavailable
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {limitationsAnalysis && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                Limitations
              </h4>
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {limitationsAnalysis.content}
              </p>
            </div>
          )}

          {data?.notes && data.notes.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <StickyNote className="h-3.5 w-3.5 text-accent" />
                Your Notes ({data.notes.length})
              </h4>
              <div className="space-y-1.5">
                {data.notes.slice(0, 5).map((note) => (
                  <div
                    key={note._id}
                    className="rounded-lg border border-border bg-muted/30 p-2.5"
                  >
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {note.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReadinessPanel({
  assignmentConvexId,
  onAdvance,
}: {
  assignmentConvexId?: string;
  onAdvance: () => void;
}) {
  const readiness = useQuery(
    api.sourceAnalyses.getReadiness,
    assignmentConvexId
      ? { assignmentId: assignmentConvexId as Id<"assignments"> }
      : "skip",
  );

  if (!readiness || !assignmentConvexId) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Stage Readiness
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {readiness.allProcessed ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-source" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            Sources processed ({readiness.processedCount}/{readiness.totalSources})
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {readiness.hasBrief || readiness.hasRubric ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-source" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {readiness.hasBrief ? "Brief present" : ""}
            {readiness.hasBrief && readiness.hasRubric ? " · " : ""}
            {readiness.hasRubric ? "Rubric present" : ""}
            {!readiness.hasBrief && !readiness.hasRubric
              ? "Brief or rubric needed"
              : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {readiness.analysedCount >= readiness.totalSources ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-source" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            Sources analysed ({readiness.analysedCount}/{readiness.totalSources})
          </span>
        </div>
      </div>

      {readiness.readyToAdvance && (
        <button
          onClick={onAdvance}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Continue to Evidence Map
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function UnderstandStage({
  assignmentSources,
  assignmentConvexId,
}: UnderstandStageProps) {
  const updateStage = useMutation(api.assignments.updateStage);

  async function advanceToMap() {
    if (!assignmentConvexId) return;
    await updateStage({
      assignmentId: assignmentConvexId as Id<"assignments">,
      stage: "map",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Analyse each source individually. Generate summaries, identify arguments, extract key concepts, and note limitations before connecting sources.
              </p>
            </div>
          </div>

          {assignmentSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
              <BookOpen className="mb-4 h-10 w-10 text-muted-foreground opacity-50" />
              <h3 className="text-sm font-medium">No sources selected</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Select sources above so Polis can summarize and connect them for this assessment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignmentSources.map((source) => (
                <SourceAnalysisCard
                  key={source.id}
                  source={source}
                  assignmentConvexId={assignmentConvexId}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 hidden lg:block space-y-4">
          <ReadinessPanel
            assignmentConvexId={assignmentConvexId}
            onAdvance={advanceToMap}
          />
        </div>
      </div>
    </div>
  );
}
