"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  BookOpen,
  Clock,
  FileText,
  FolderOpen,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Module, User } from "@/lib/types";

interface DashboardContentProps {
  user?: User;
  modules: Module[];
}

const MODULE_COLOURS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#4f46e5",
  "#9333ea",
  "#ca8a04",
  "#be185d",
];

interface ModuleFormData {
  title: string;
  code: string;
  description: string;
  academicYear: string;
  semester: string;
  colour: string;
}

const emptyForm: ModuleFormData = {
  title: "",
  code: "",
  description: "",
  academicYear: new Date().getFullYear().toString(),
  semester: "Autumn",
  colour: MODULE_COLOURS[0],
};

function ModuleFormDialog({
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
  onSubmit: (data: ModuleFormData) => void;
  initial?: Partial<ModuleFormData>;
  submitLabel: string;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<ModuleFormData>({
    ...emptyForm,
    ...initial,
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold font-serif">{submitLabel.includes("Create") ? "New Module Workspace" : "Edit Module"}</h2>
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
            <label htmlFor="module-title" className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              id="module-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. International Security"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="module-code" className="block text-sm font-medium text-foreground mb-1.5">
                Module Code
              </label>
              <input
                id="module-code"
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. PIRR30041"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="module-year" className="block text-sm font-medium text-foreground mb-1.5">
                Academic Year
              </label>
              <input
                id="module-year"
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                placeholder="e.g. 2025/26"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="module-semester" className="block text-sm font-medium text-foreground mb-1.5">
              Semester
            </label>
            <select
              id="module-semester"
              value={form.semester}
              onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="Autumn">Autumn</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Full Year">Full Year</option>
            </select>
          </div>

          <div>
            <label htmlFor="module-description" className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              id="module-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief module description..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Colour
            </label>
            <div className="flex gap-2">
              {MODULE_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colour: c }))}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${form.colour === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select colour ${c}`}
                />
              ))}
            </div>
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
              disabled={loading || !form.title.trim() || !form.code.trim()}
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

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  moduleName,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  moduleName: string;
  loading: boolean;
  error: string | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold font-serif">Delete Module</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Delete <span className="font-medium text-foreground">{moduleName}</span> and all its sources, assignments, and folders? This cannot be undone.
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
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

export function DashboardContent({
  modules,
}: DashboardContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [deleteModule, setDeleteModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation(api.modules.create);
  const updateMutation = useMutation(api.modules.update);
  const removeMutation = useMutation(api.modules.remove);

  const handleCreate = async (data: ModuleFormData) => {
    setLoading(true);
    setError(null);
    try {
      await createMutation({
        title: data.title,
        code: data.code,
        description: data.description || undefined,
        academicYear: data.academicYear || undefined,
        semester: data.semester || undefined,
        colour: data.colour,
      });
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (data: ModuleFormData) => {
    if (!editModule) return;
    setLoading(true);
    setError(null);
    try {
      await updateMutation({
        moduleId: editModule.id as Id<"modules">,
        title: data.title,
        code: data.code,
        description: data.description || undefined,
        academicYear: data.academicYear || undefined,
        semester: data.semester || undefined,
        colour: data.colour,
      });
      setEditModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModule) return;
    setLoading(true);
    setError(null);
    try {
      await removeMutation({
        moduleId: deleteModule.id as Id<"modules">,
      });
      setDeleteModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto mt-4 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-foreground tracking-tight">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Select a module to continue your coursework.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Workspace
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-32 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-4">
            <FolderOpen className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground font-serif">No workspaces yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Create your first module workspace to start organising readings, notes, and assignments.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div
                className="absolute left-0 top-6 h-8 w-1 rounded-r-md"
                style={{ backgroundColor: mod.color || "var(--color-border)" }}
              />

              <div className="pl-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-foreground font-serif group-hover:text-accent transition-colors">
                      <Link href={`/modules/${mod.id}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {mod.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{mod.code}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-1 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditModule(mod); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                      title="Edit workspace"
                      aria-label={`Edit ${mod.title}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteModule(mod); }}
                      className="p-1.5 text-muted-foreground hover:text-danger rounded-md hover:bg-danger/10 transition-colors"
                      title="Delete workspace"
                      aria-label={`Delete ${mod.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                  {mod.description}
                </p>

                <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <BookOpen className="h-3.5 w-3.5" />
                    {mod.sourceCount} sources
                  </span>
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <FileText className="h-3.5 w-3.5" />
                    {mod.assignmentCount} assignments
                  </span>
                </div>
              </div>

              <div className="mt-6 pl-3 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(mod.lastActivityAt)}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      <ModuleFormDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setError(null); }}
        onSubmit={handleCreate}
        submitLabel="Create Workspace"
        loading={loading}
        error={error}
      />

      <ModuleFormDialog
        open={!!editModule}
        onClose={() => { setEditModule(null); setError(null); }}
        onSubmit={handleEdit}
        initial={editModule ? {
          title: editModule.title,
          code: editModule.code,
          description: editModule.description,
          academicYear: editModule.academicYear,
          semester: editModule.semester,
          colour: editModule.color,
        } : undefined}
        submitLabel="Save Changes"
        loading={loading}
        error={error}
      />

      <DeleteConfirmDialog
        open={!!deleteModule}
        onClose={() => { setDeleteModule(null); setError(null); }}
        onConfirm={handleDelete}
        moduleName={deleteModule?.title ?? ""}
        loading={loading}
        error={error}
      />
    </div>
  );
}
