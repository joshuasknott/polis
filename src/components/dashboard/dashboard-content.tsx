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
  AlertTriangle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Module, User } from "@/lib/types";
import {
  TimelineContent,
  type TimelineAssignment,
} from "@/components/timeline/timeline-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input, Textarea, Field } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardContentProps {
  user?: User;
  modules: Module[];
  timelineAssignments?: TimelineAssignment[];
}

// Logo-derived module palette: Navy, Slate, Gold, Deep-parchment.
const MODULE_COLOURS = ["#162A4A", "#4B6685", "#BA9858", "#8A7B5A"];

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
  semester: "",
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
  const isCreate = submitLabel.includes("Create");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader title={isCreate ? "New Module Workspace" : "Edit Module"} onClose={onClose} />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Field label="Workspace name" htmlFor="module-title">
            <Input
              id="module-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. International Security"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {!isCreate && (
              <Field label="Module Code" htmlFor="module-code">
                <Input
                  id="module-code"
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. PIRR30041"
                />
              </Field>
            )}
            <Field label="Year" htmlFor="module-year">
              <Input
                id="module-year"
                type="text"
                required
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                placeholder="e.g. 2026 or 2025/26"
              />
            </Field>
            <Field label="Semester" htmlFor="module-semester">
              <Input
                id="module-semester"
                type="text"
                required
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                placeholder="e.g. Autumn, Semester 1, Hilary"
              />
            </Field>
          </div>

          {!isCreate && (
            <>
              <Field label="Description" htmlFor="module-description">
                <Textarea
                  id="module-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief module description..."
                  rows={3}
                />
              </Field>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">Colour</span>
                <div className="flex gap-2">
                  {MODULE_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, colour: c }))}
                      className="h-7 w-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: form.colour === c ? "var(--foreground)" : "transparent",
                        transform: form.colour === c ? "scale(1.1)" : "scale(1)",
                      }}
                      aria-label={`Select colour ${c}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!form.title.trim() || !form.academicYear.trim() || !form.semester.trim()}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
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
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <DialogHeader title="Delete Module" onClose={onClose} />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Delete <span className="font-medium text-foreground">{moduleName}</span> and all its sources, assignments, and folders? This cannot be undone.
      </p>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function DashboardContent({
  modules,
  timelineAssignments = [],
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
    <div className="mx-auto mt-4 max-w-6xl space-y-10 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Select a module to continue your coursework.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {timelineAssignments.length > 0 && (
        <TimelineContent assignments={timelineAssignments} embedded />
      )}

      {modules.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No workspaces yet"
          description="Create your first module workspace to start organising readings, notes, and assignments."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-border-strong hover:shadow-[0_16px_45px_rgba(7,17,31,0.06)]"
            >
              <div
                className="absolute left-0 top-6 h-8 w-1 rounded-r-md"
                style={{ backgroundColor: mod.color || "var(--color-border)" }}
              />

              <div className="pl-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-base font-medium text-foreground transition-colors group-hover:text-gold-foreground">
                      <Link href={`/modules/${mod.id}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {mod.title}
                      </Link>
                    </h3>
                    <p className="mt-1 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">{mod.code}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-1 -mt-1 -mr-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditModule(mod); }}
                      className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                      title="Edit workspace"
                      aria-label={`Edit ${mod.title}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteModule(mod); }}
                      className="p-2 text-muted-foreground hover:text-danger rounded-md hover:bg-danger/10 transition-colors"
                      title="Delete workspace"
                      aria-label={`Delete ${mod.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 h-10 text-sm leading-relaxed line-clamp-2 text-muted-foreground">
                  {mod.description}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <Badge tone="neutral">
                    <BookOpen className="h-3.5 w-3.5" />
                    {mod.sourceCount} sources
                  </Badge>
                  <Badge tone="neutral">
                    <FileText className="h-3.5 w-3.5" />
                    {mod.assignmentCount} assignments
                  </Badge>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/50 pl-3 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(mod.lastActivityAt)}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-gold-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      <ModuleFormDialog
        key={createOpen ? "create-open" : "create-closed"}
        open={createOpen}
        onClose={() => { setCreateOpen(false); setError(null); }}
        onSubmit={handleCreate}
        submitLabel="Create Workspace"
        loading={loading}
        error={error}
      />

      <ModuleFormDialog
        key={editModule?.id ?? "edit-closed"}
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
