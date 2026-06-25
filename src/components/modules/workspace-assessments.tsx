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
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
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
          <Link href={`/modules/${module.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Module Info
          </Link>
          <span>/</span>
          <span className="text-foreground">Assessments</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-foreground">Assessments</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Assessment tracks show the deadline, missing context, source coverage, and next action for each piece of coursework.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPrefillFromSource(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
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
            Assessment tracks
          </h2>
          {assignments.length > 0 && (
            <span className="text-xs text-muted-foreground">{assignments.length} total</span>
          )}
        </div>

        {assignments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No assessment tracks"
            description="Add an assessment or confirm an extracted brief to create a focused Plan / Write / Review track."
          />
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onConfirm(source)}
              className="shrink-0"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm
            </Button>
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
      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
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
            href={`/modules/${moduleId}/assignments/${assignment.id}?tab=${nextAction.tab}`}
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MissingContextBlock items={assignment.missingContext} />
            <SourceCoverageBlock
              selected={assignment.selectedSourceCount}
              total={totalProcessedSources}
              tone={coverageTone}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end gap-1">
            <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
              <Edit2 className="h-3 w-3" />
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onDelete}
              className="hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card-elevated p-4 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Next action
            </p>
            <p className="mt-2 font-medium leading-6 text-foreground">{nextAction.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{nextAction.detail}</p>
          </div>
          <Link
            href={`/modules/${moduleId}/assignments/${assignment.id}?tab=${nextAction.tab}`}
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-md bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Open {nextAction.phase} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function MissingContextBlock({ items }: { items: string[] }) {
  const hasMissing = items.length > 0;
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {hasMissing ? (
          <CircleAlert className="h-3.5 w-3.5 text-warning" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        )}
        Missing context
      </p>
      {hasMissing ? (
        <ul className="mt-2 space-y-1">
          {items.slice(0, 3).map((item) => (
            <li key={item} className="text-xs leading-5 text-foreground">
              {item}
            </li>
          ))}
          {items.length > 3 && (
            <li className="text-xs text-muted-foreground">+{items.length - 3} more</li>
          )}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Brief, deadline, rubric, word limit, and sources are present.
        </p>
      )}
    </div>
  );
}

function SourceCoverageBlock({
  selected,
  total,
  tone,
}: {
  selected: number;
  total: number;
  tone: "low" | "medium" | "good" | "none";
}) {
  const pct = total > 0 ? Math.min(100, Math.round((selected / total) * 100)) : 0;
  const barClass =
    tone === "good"
      ? "bg-success"
      : tone === "medium"
        ? "bg-warning"
        : tone === "low"
          ? "bg-danger"
          : "bg-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          Source coverage
        </p>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {selected}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {total === 0
          ? "Import and process sources first."
          : selected === 0
            ? "No sources selected yet."
            : `${pct}% of processed sources selected.`}
      </p>
    </div>
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

function getNextAction(assignment: WorkspaceSectionProps["data"]["assignments"][number]): {
  label: string;
  detail: string;
  phase: "Plan" | "Write" | "Review";
  tab: "plan" | "write" | "review";
} {
  if (assignment.missingContext.length > 0) {
    return {
      label: assignment.missingContext[0],
      detail: "Complete the missing context in Plan before drafting.",
      phase: "Plan",
      tab: "plan",
    };
  }
  switch (assignment.stage) {
    case "ingest":
    case "understand":
    case "map":
    case "judge":
    case "build":
      return {
        label: "Continue planning the evidence map and section plan",
        detail: "Brief, sources, gap analysis, thesis, and outline live together.",
        phase: "Plan",
        tab: "plan",
      };
    case "draft":
      return {
        label: "Continue drafting with source provenance visible",
        detail: "Use Write for drafting, labels, citations, and writing help.",
        phase: "Write",
        tab: "write",
      };
    case "refine":
      return {
        label: "Resolve review findings and citation risks",
        detail: "Use Review for findings, rubric fit, citation safety, and readiness.",
        phase: "Review",
        tab: "review",
      };
    default:
      return {
        label: "Open the assessment track",
        detail: "Start with Plan, then move to Write and Review.",
        phase: "Plan",
        tab: "plan",
      };
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
    <Dialog open={open} onClose={onClose} className="max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          title={submitLabel.includes("Create") ? "New Assessment" : "Edit Assessment"}
          onClose={onClose}
        />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="assignment-title" className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="assignment-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Essay 1: Security Dilemma"
            />
          </div>

          <div>
            <label htmlFor="assignment-question" className="mb-1.5 block text-sm font-medium text-foreground">
              Question
            </label>
            <Textarea
              id="assignment-question"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Paste the assessment question here..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignment-word-limit" className="mb-1.5 block text-sm font-medium text-foreground">
                Word Limit
              </label>
              <Input
                id="assignment-word-limit"
                type="number"
                min={100}
                value={form.wordLimit}
                onChange={(e) => setForm((f) => ({ ...f, wordLimit: parseInt(e.target.value) || 2000 }))}
              />
            </div>
            <div>
              <label htmlFor="assignment-due-date" className="mb-1.5 block text-sm font-medium text-foreground">
                Due Date
              </label>
              <Input
                id="assignment-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Marking Rubric</label>
              <span className="text-xs text-muted-foreground">{rubricTotal}% allocated</span>
            </div>

            {form.rubric.length > 0 && (
              <div className="mb-3 space-y-2">
                {form.rubric.map((criterion, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{criterion.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({criterion.weight}%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRubricCriterion(i)}
                      className="p-1 text-muted-foreground transition-colors hover:text-danger"
                      aria-label={`Remove ${criterion.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Criterion name"
                value={rubricDraft.name}
                onChange={(e) => setRubricDraft((r) => ({ ...r, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={100}
                value={rubricDraft.weight}
                onChange={(e) => setRubricDraft((r) => ({ ...r, weight: parseInt(e.target.value) || 25 }))}
                className="w-16"
                title="Weight %"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRubricCriterion}
                disabled={!rubricDraft.name.trim()}
              >
                Add
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Description (optional)"
              value={rubricDraft.description}
              onChange={(e) => setRubricDraft((r) => ({ ...r, description: e.target.value }))}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!form.title.trim()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
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
    <Dialog open onClose={onCancel} className="max-w-sm">
      <DialogHeader title="Delete Assessment" onClose={onCancel} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Delete <span className="font-medium text-foreground">{assignmentTitle}</span>? All arguments, evidence links, and drafts will be lost. This cannot be undone.
      </p>
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
