"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Loader2,
  CalendarClock,
  Scale,
  BookOpen,
  CircleAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  cn,
  getProductionStageLabel,
  getProductionStageColor,
  getDeadlineUrgency,
  getDeadlineUrgencyClasses,
  getDeadlineLabel,
  getSourceCoverageLabel,
  getSourceCoverageTone,
  getRubricWeightTotal,
} from "@/lib/utils";
import type { WorkspaceSectionProps } from "./workspace-sections";

interface AssignmentFormData {
  title: string;
  question: string;
  wordLimit: number;
  dueDate: string;
  rubric: Array<{ name: string; description: string; weight: number }>;
}

const emptyAssignmentForm: AssignmentFormData = {
  title: "",
  question: "",
  wordLimit: 2000,
  dueDate: "",
  rubric: [],
};

export function WorkspaceAssessments({ data }: WorkspaceSectionProps) {
  const { module, assignments, sources } = data;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(typeof assignments)[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof assignments)[number] | null>(null);
  const [prefillFromSource, setPrefillFromSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(api.assignments.create);
  const updateMutation = useMutation(api.assignments.update);
  const removeMutation = useMutation(api.assignments.remove);

  const processedSources = sources.filter((s) => s.status === "processed");

  const extractedSpecs = sources.filter(
    (s) => s.classificationLabel === "assignment_brief" || s.classificationLabel === "marking_rubric",
  );

  async function handleCreate(formData: AssignmentFormData) {
    setLoading(true);
    setError(null);
    try {
      await createMutation({
        moduleId: module.id as Id<"modules">,
        title: formData.title,
        question: formData.question || undefined,
        wordLimit: formData.wordLimit || undefined,
        dueDate: formData.dueDate || undefined,
        rubric: formData.rubric.length > 0 ? formData.rubric : undefined,
      });
      setCreateOpen(false);
      setPrefillFromSource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(target: (typeof assignments)[number], formData: AssignmentFormData) {
    setLoading(true);
    setError(null);
    try {
      await updateMutation({
        assignmentId: target.id as Id<"assignments">,
        title: formData.title,
        question: formData.question || undefined,
        wordLimit: formData.wordLimit || undefined,
        dueDate: formData.dueDate || undefined,
        rubric: formData.rubric.length > 0 ? formData.rubric : undefined,
      });
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assessment");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    setError(null);
    try {
      await removeMutation({ assignmentId: deleteTarget.id as Id<"assignments"> });
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assessment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/modules/${module.id}?tab=home`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Assessments</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-foreground">Assessments</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Track coursework specs, deadlines, weights, word limits, and source coverage for each assessment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPrefillFromSource(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </button>
        </div>
      </header>

      <ExtractedSpecsSection
        sources={extractedSpecs}
        onConfirm={(source) => {
          setPrefillFromSource(source.id);
          setCreateOpen(true);
        }}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Confirmed assessments
          </h2>
          {assignments.length > 0 && (
            <span className="text-xs text-muted-foreground">{assignments.length} total</span>
          )}
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No confirmed assessments</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Add an assessment to capture the question, deadline, word limit, and rubric.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {assignments.map((assignment) => (
              <AssessmentRow
                key={assignment.id}
                assignment={assignment}
                totalProcessedSources={processedSources.length}
                moduleId={module.id}
                onEdit={() => setEditTarget(assignment)}
                onDelete={() => setDeleteTarget(assignment)}
              />
            ))}
          </ul>
        )}
      </section>

      <AssignmentFormDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setPrefillFromSource(null);
          setError(null);
        }}
        onSubmit={handleCreate}
        submitLabel="Create Assessment"
        loading={loading}
        error={error}
        initial={
          prefillFromSource
            ? {
                title: extractedSpecs.find((s) => s.id === prefillFromSource)?.title ?? "",
              }
            : undefined
        }
      />

      <AssignmentFormDialog
        open={!!editTarget}
        onClose={() => {
          setEditTarget(null);
          setError(null);
        }}
        onSubmit={(formData) => {
          if (editTarget) void handleEdit(editTarget, formData);
        }}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
        initial={
          editTarget
            ? {
                title: editTarget.title,
                question: editTarget.question,
                wordLimit: editTarget.wordLimit,
                dueDate: editTarget.dueDate,
                rubric: editTarget.rubric,
              }
            : undefined
        }
      />

      {deleteTarget && (
        <DeleteAssessmentDialog
          assignmentTitle={deleteTarget.title}
          loading={loading}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function ExtractedSpecsSection({
  sources,
  onConfirm,
}: {
  sources: WorkspaceSectionProps["data"]["sources"];
  onConfirm: (source: WorkspaceSectionProps["data"]["sources"][number]) => void;
}) {
  if (sources.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Extracted assessment specs
        </h2>
        <span className="text-xs text-muted-foreground">{sources.length} pending review</span>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {sources.map((source) => (
          <li key={source.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-interpretation/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-interpretation">
                  {source.classificationLabel === "marking_rubric" ? "Rubric" : "Brief"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                  <CircleAlert className="h-3 w-3" /> Confirm to create assessment
                </span>
              </div>
              <Link
                href={`/sources/${source.id}`}
                className="mt-2 block text-sm font-semibold text-foreground hover:text-accent transition-colors truncate"
              >
                {source.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {source.fileName || "No file name"} · review contents before creating an assessment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onConfirm(source)}
              className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors shrink-0"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AssessmentRow({
  assignment,
  totalProcessedSources,
  moduleId,
  onEdit,
  onDelete,
}: {
  assignment: WorkspaceSectionProps["data"]["assignments"][number];
  totalProcessedSources: number;
  moduleId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const urgency = getDeadlineUrgency(assignment.dueDate);
  const coverageTone = getSourceCoverageTone(assignment.selectedSourceCount, totalProcessedSources);
  const nextAction = getNextAction(assignment);

  return (
    <li className="group rounded-xl border border-border bg-card">
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getProductionStageColor(assignment.stage))}>
              {getProductionStageLabel(assignment.stage)}
            </span>
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getDeadlineUrgencyClasses(urgency))}>
              <CalendarClock className="h-3 w-3 mr-1" />
              {getDeadlineLabel(urgency, assignment.dueDate)}
            </span>
            {assignment.wordLimit > 0 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {assignment.wordLimit.toLocaleString()} words
              </span>
            )}
          </div>
          <Link
            href={`/modules/${moduleId}/assignments/${assignment.id}`}
            className="mt-3 block text-base font-semibold text-foreground hover:text-accent transition-colors"
          >
            {assignment.title}
          </Link>
          {assignment.question ? (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {assignment.question}
            </p>
          ) : (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-warning">
              <CircleAlert className="h-3 w-3" /> No question set
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {getSourceCoverageLabel(assignment.selectedSourceCount, totalProcessedSources)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              {assignment.rubricWeightTotal > 0
                ? `${assignment.rubricWeightTotal}% weighted`
                : "No rubric weights"}
            </span>
            {coverageTone !== "good" && coverageTone !== "none" && (
              <CoverageBadge tone={coverageTone} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs md:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next action</p>
            <p className="mt-1 text-foreground font-medium">{nextAction.label}</p>
          </div>
          <Link
            href={`/modules/${moduleId}/assignments/${assignment.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline md:self-end"
          >
            Open workspace <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function CoverageBadge({ tone }: { tone: "low" | "medium" | "good" | "none" }) {
  const map = {
    low: { label: "Thin coverage", class: "border-danger/30 bg-danger/10 text-danger" },
    medium: { label: "Partial coverage", class: "border-warning/30 bg-warning/10 text-warning" },
    good: { label: "Strong coverage", class: "border-success/30 bg-success/10 text-success" },
    none: { label: "No sources", class: "border-danger/30 bg-danger/10 text-danger" },
  } as const;
  const config = map[tone];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", config.class)}>
      {config.label}
    </span>
  );
}

function getNextAction(assignment: WorkspaceSectionProps["data"]["assignments"][number]): { label: string } {
  if (assignment.missingContext.length > 0) {
    return { label: assignment.missingContext[0] };
  }
  switch (assignment.stage) {
    case "ingest":
      return { label: "Open Ingest to confirm selected sources" };
    case "understand":
      return { label: "Generate source summaries" };
    case "map":
      return { label: "Build the evidence map" };
    case "judge":
      return { label: "Run gap & counterargument checks" };
    case "build":
      return { label: "Structure arguments and sections" };
    case "draft":
      return { label: "Continue drafting with evidence" };
    case "refine":
      return { label: "Resolve review findings" };
    default:
      return { label: "Open assessment workspace" };
  }
}

function AssignmentFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  submitLabel,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignmentFormData) => void;
  initial?: Partial<AssignmentFormData>;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<AssignmentFormData>({
    ...emptyAssignmentForm,
    ...initial,
  });
  const [rubricDraft, setRubricDraft] = useState({ name: "", description: "", weight: 25 });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addRubricCriterion = () => {
    if (!rubricDraft.name.trim()) return;
    setForm((f) => ({
      ...f,
      rubric: [...f.rubric, { ...rubricDraft }],
    }));
    setRubricDraft({ name: "", description: "", weight: 25 });
  };

  const removeRubricCriterion = (index: number) => {
    setForm((f) => ({
      ...f,
      rubric: f.rubric.filter((_, i) => i !== index),
    }));
  };

  const rubricTotal = getRubricWeightTotal(form.rubric);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold font-serif">
            {submitLabel.includes("Create") ? "New Assessment" : "Edit Assessment"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="assignment-title" className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              id="assignment-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Essay 1: Security Dilemma"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="assignment-question" className="block text-sm font-medium text-foreground mb-1.5">
              Question
            </label>
            <textarea
              id="assignment-question"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Paste the assessment question here..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignment-word-limit" className="block text-sm font-medium text-foreground mb-1.5">
                Word Limit
              </label>
              <input
                id="assignment-word-limit"
                type="number"
                min={100}
                value={form.wordLimit}
                onChange={(e) => setForm((f) => ({ ...f, wordLimit: parseInt(e.target.value) || 2000 }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="assignment-due-date" className="block text-sm font-medium text-foreground mb-1.5">
                Due Date
              </label>
              <input
                id="assignment-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">Marking Rubric</label>
              <span className="text-xs text-muted-foreground">{rubricTotal}% allocated</span>
            </div>

            {form.rubric.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.rubric.map((criterion, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{criterion.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({criterion.weight}%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRubricCriterion(i)}
                      className="p-1 text-muted-foreground hover:text-danger transition-colors"
                      aria-label={`Remove ${criterion.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Criterion name"
                value={rubricDraft.name}
                onChange={(e) => setRubricDraft((r) => ({ ...r, name: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={rubricDraft.weight}
                onChange={(e) => setRubricDraft((r) => ({ ...r, weight: parseInt(e.target.value) || 25 }))}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                title="Weight %"
              />
              <button
                type="button"
                onClick={addRubricCriterion}
                disabled={!rubricDraft.name.trim()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={rubricDraft.description}
              onChange={(e) => setRubricDraft((r) => ({ ...r, description: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAssessmentDialog({
  assignmentTitle,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  assignmentTitle: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold font-serif">Delete Assessment</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Delete <span className="font-medium text-foreground">{assignmentTitle}</span>? All arguments, evidence links, and drafts will be lost. This cannot be undone.
        </p>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
