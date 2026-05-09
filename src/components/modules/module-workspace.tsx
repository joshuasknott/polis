"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  Upload,
  Loader2,
  ArrowRight,
  Info,
  StickyNote,
  ArrowLeft,
  CheckSquare,
  Plus,
  X,
  AlertTriangle,
  CalendarDays,
  Trash2,
  Edit2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel, getProductionStageLabel, getProductionStageColor, formatDate } from "@/lib/utils";
import type { ProductionStage } from "@/lib/types";

interface ModuleWorkspaceProps {
  module: {
    id: string;
    title: string;
    code: string;
    description: string;
    academicYear: string;
    semester: string;
    colour: string;
    activeTab: string;
  };
  folders: Array<{
    id: string;
    name: string;
    type: string;
    sortOrder: number;
    sourceCount: number;
  }>;
  sources: Array<{
    id: string;
    folderId: string | null;
    title: string;
    author: string;
    year: number | null;
    type: string;
    status: string;
    tags: string[];
    summary: string;
    pageCount: number;
    errorMessage: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    stage: ProductionStage;
    dueDate: string;
    selectedSourceCount: number;
  }>;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold font-serif">
            {submitLabel.includes("Create") ? "New Assignment" : "Edit Assignment"}
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
              placeholder="Paste the assignment question here..."
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
              <label className="block text-sm font-medium text-foreground">
                Marking Rubric
              </label>
              <span className="text-xs text-muted-foreground">
                {form.rubric.reduce((s, c) => s + c.weight, 0)}% allocated
              </span>
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

export function ModuleWorkspace({
  module,
  folders,
  sources,
  assignments,
}: ModuleWorkspaceProps) {
  const { activeTab } = module;

  const renderContent = () => {
    switch (activeTab) {
      case "module-info":
        return <ModuleInfo module={module} />;
      case "readings":
        return <ModuleReadings module={module} folders={folders} sources={sources} />;
      case "lectures":
        return <EmptyState icon={FileText} title="Lectures" description="Your module slides and seminar notes will appear here." />;
      case "source-notes":
        return <EmptyState icon={StickyNote} title="Source Notes" description="Your source annotations and reading notes will appear here." />;
      case "assignments":
        return <ModuleAssignments assignments={assignments} module={module} />;
      case "drafts":
        return <EmptyState icon={FileText} title="Drafts & Reviews" description="Your assignment drafts and feedback will appear here." />;
      case "submissions":
        return <EmptyState icon={CheckSquare} title="Submissions" description="Your final submissions and checklists will appear here." />;
      default:
        return <ModuleInfo module={module} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Workspaces
          </Link>
          <span>/</span>
          <span>{module.code}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">{module.title}</h1>
        {module.description && (
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-3xl leading-relaxed">
            {module.description}
          </p>
        )}
      </div>

      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}

function ModuleInfo({ module }: { module: ModuleWorkspaceProps["module"] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Module Details</h3>
        <dl className="space-y-5">
          <div>
            <dt className="text-xs text-muted-foreground">Module Code</dt>
            <dd className="text-sm font-medium mt-1">{module.code}</dd>
          </div>
          {module.academicYear && (
            <div>
              <dt className="text-xs text-muted-foreground">Academic Year</dt>
              <dd className="text-sm font-medium mt-1">{module.academicYear}</dd>
            </div>
          )}
          {module.semester && (
            <div>
              <dt className="text-xs text-muted-foreground">Semester</dt>
              <dd className="text-sm font-medium mt-1">{module.semester}</dd>
            </div>
          )}
          {module.description && (
            <div>
              <dt className="text-xs text-muted-foreground">Description</dt>
              <dd className="text-sm font-medium mt-1 leading-relaxed">{module.description}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col items-center justify-center text-center">
        <Info className="h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Use the left sidebar to navigate between your readings, notes, assignments, and drafts for this module workspace.
        </p>
      </div>
    </div>
  );
}

function ModuleReadings({ module, folders, sources }: { module: ModuleWorkspaceProps["module"], folders: ModuleWorkspaceProps["folders"], sources: ModuleWorkspaceProps["sources"] }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createForUpload = useMutation(api.sources.createForUpload);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attachStorage = useMutation(api.sources.attachStorage);
  const retry = useMutation(api.sources.retryProcessing);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const sourceId = await createForUpload({
        moduleId: module.id as Id<"modules">,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        folderType: "readings",
      });

      const postUrl = await generateUploadUrl({});

      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error("File upload failed");
      }

      const { storageId } = await uploadResult.json();

      await attachStorage({
        sourceId: sourceId as Id<"sources">,
        storageId: storageId as Id<"_storage">,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  const unassignedSources = sources.filter(
    (s) => !s.folderId || !folders.some((f) => f.id === s.folderId),
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Readings & Sources</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity shadow-sm"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload Source
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      {uploadError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {uploadError}
        </div>
      )}

      <div className="space-y-10">
        {folders.map(folder => {
          const folderSources = sources.filter(s => s.folderId === folder.id);

          if (folderSources.length === 0) {
             return (
               <div key={folder.id} className="space-y-4">
                  <h3 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                    {folder.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">0</span>
                  </h3>
                  <p className="text-sm text-muted-foreground italic py-4">No sources in this folder.</p>
               </div>
             );
          }

          return (
            <div key={folder.id} className="space-y-4">
              <h3 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                {folder.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{folderSources.length}</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {folderSources.map(source => (
                  <ReadingSourceCard key={source.id} source={source} onRetry={retry} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {unassignedSources.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Unassigned <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{unassignedSources.length}</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unassignedSources.map(source => (
              <ReadingSourceCard key={source.id} source={source} onRetry={retry} />
            ))}
          </div>
        </div>
      )}

      {sources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-4 text-sm font-medium">No readings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your first source to start building this module&apos;s library.
          </p>
        </div>
      )}
    </div>
  );
}

function ReadingSourceCard({ source, onRetry }: {
  source: ModuleWorkspaceProps["sources"][0];
  onRetry: (args: { sourceId: Id<"sources"> }) => Promise<unknown>;
}) {
  return (
    <div className="flex flex-col">
      <Link
        href={`/sources/${source.id}`}
        className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-foreground/30 hover:shadow-sm transition-all group flex-1"
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", getStatusColor(source.status))}>
              {getStatusLabel(source.status)}
            </span>
            <span className="text-xs text-muted-foreground">{getSourceTypeLabel(source.type)}</span>
          </div>
          <h4 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-foreground transition-colors">{source.title}</h4>
          <p className="text-xs text-muted-foreground">{source.author} ({source.year})</p>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
          <span>{source.pageCount} pages</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
        </div>
      </Link>
      {source.status === "failed" && source.errorMessage && (
        <div className="px-3 pb-2 pt-1">
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-2 text-xs text-danger">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="flex-1 line-clamp-1">{source.errorMessage}</span>
              <button
                onClick={async () => {
                  await onRetry({ sourceId: source.id as Id<"sources"> });
                }}
                className="shrink-0 rounded px-1 py-0.5 hover:bg-danger/10 transition-colors"
                title="Retry"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleAssignments({ assignments, module }: { assignments: ModuleWorkspaceProps["assignments"], module: ModuleWorkspaceProps["module"] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<ModuleWorkspaceProps["assignments"][number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleWorkspaceProps["assignments"][number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(api.assignments.create);
  const updateMutation = useMutation(api.assignments.update);
  const removeMutation = useMutation(api.assignments.remove);

  const handleCreate = async (data: AssignmentFormData) => {
    setLoading(true);
    setError(null);
    try {
      await createMutation({
        moduleId: module.id as Id<"modules">,
        title: data.title,
        question: data.question || undefined,
        wordLimit: data.wordLimit || undefined,
        dueDate: data.dueDate || undefined,
        rubric: data.rubric.length > 0 ? data.rubric : undefined,
      });
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (data: AssignmentFormData) => {
    if (!editAssignment) return;
    setLoading(true);
    setError(null);
    try {
      await updateMutation({
        assignmentId: editAssignment.id as Id<"assignments">,
        title: data.title,
        question: data.question || undefined,
        wordLimit: data.wordLimit || undefined,
        dueDate: data.dueDate || undefined,
        rubric: data.rubric.length > 0 ? data.rubric : undefined,
      });
      setEditAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    setError(null);
    try {
      await removeMutation({ assignmentId: deleteTarget.id as Id<"assignments"> });
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-semibold">Assignments</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Assignment
        </button>
      </div>

      {assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map(assignment => (
            <div
              key={assignment.id}
              className="group relative flex items-center justify-between rounded-xl border border-border bg-card p-6 hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <Link
                href={`/modules/${module.id}/assignments/${assignment.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate">{assignment.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", getProductionStageColor(assignment.stage))}>
                      {getProductionStageLabel(assignment.stage)}
                    </span>
                    {assignment.dueDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(assignment.dueDate)}
                      </span>
                    )}
                    <span>
                      {assignment.selectedSourceCount} source{assignment.selectedSourceCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                <button
                  onClick={() => setEditAssignment(assignment)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit assignment"
                  aria-label={`Edit ${assignment.title}`}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(assignment)}
                  className="p-1.5 text-muted-foreground hover:text-danger rounded-md hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete assignment"
                  aria-label={`Delete ${assignment.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="No Assignments" description="Add an assignment brief to start mapping arguments and evidence." />
      )}

      <AssignmentFormDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setError(null); }}
        onSubmit={handleCreate}
        submitLabel="Create Assignment"
        loading={loading}
        error={error}
      />

      <AssignmentFormDialog
        open={!!editAssignment}
        onClose={() => { setEditAssignment(null); setError(null); }}
        onSubmit={handleEdit}
        initial={editAssignment ? {
          title: editAssignment.title,
          dueDate: editAssignment.dueDate,
        } : undefined}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold font-serif">Delete Assignment</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Delete <span className="font-medium text-foreground">{deleteTarget.title}</span>? All arguments, evidence links, and drafts will be lost. This cannot be undone.
            </p>
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {error}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setError(null); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
