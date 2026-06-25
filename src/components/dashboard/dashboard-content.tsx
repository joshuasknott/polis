"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock,
  Edit2,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Module, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input, Field } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardContentProps {
  user?: User;
  modules: Module[];
}

interface ModuleFormData {
  title: string;
}

const emptyForm: ModuleFormData = {
  title: "",
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
    onSubmit({ title: form.title.trim() });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          title={submitLabel.includes("Create") ? "New Workspace" : "Rename Workspace"}
          onClose={onClose}
        />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Workspace name" htmlFor="workspace-name">
          <Input
            id="workspace-name"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ title: e.target.value })}
            placeholder="e.g. International Security"
            autoFocus
          />
        </Field>

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
      <DialogHeader title="Delete Workspace" onClose={onClose} />
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

export function DashboardContent({ modules }: DashboardContentProps) {
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
      });
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
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
      });
      setEditModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename workspace");
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
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-6xl space-y-8 sm:mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create a workspace, then open it to import sources and work on assessments.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No workspaces yet"
          description="Create your first module workspace with a name, then add sources from inside it."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="group relative flex min-h-48 flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-border-strong hover:shadow-[0_16px_45px_rgba(7,17,31,0.06)]"
            >
              <div
                className="absolute left-0 top-6 h-8 w-1 rounded-r-md"
                style={{ backgroundColor: mod.color || "var(--color-border)" }}
              />

              <div className="pl-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-gold-foreground">
                    <Link href={`/modules/${mod.id}`} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {mod.title}
                    </Link>
                  </h3>
                  <div className="relative z-10 -mr-2 -mt-1 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModule(mod);
                      }}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Rename workspace"
                      aria-label={`Rename ${mod.title}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModule(mod);
                      }}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                      title="Delete workspace"
                      aria-label={`Delete ${mod.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">
                    <BookOpen className="h-3.5 w-3.5" />
                    {mod.sourceCount} sources
                  </Badge>
                  <Badge tone="neutral">
                    <FileText className="h-3.5 w-3.5" />
                    {mod.assignmentCount} assessments
                  </Badge>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border/50 pl-3 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(mod.lastActivityAt)}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-gold-foreground">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModuleFormDialog
        key={createOpen ? "create-open" : "create-closed"}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setError(null);
        }}
        onSubmit={handleCreate}
        submitLabel="Create Workspace"
        loading={loading}
        error={error}
      />

      <ModuleFormDialog
        key={editModule?.id ?? "edit-closed"}
        open={!!editModule}
        onClose={() => {
          setEditModule(null);
          setError(null);
        }}
        onSubmit={handleEdit}
        initial={editModule ? { title: editModule.title } : undefined}
        submitLabel="Save Name"
        loading={loading}
        error={error}
      />

      <DeleteConfirmDialog
        open={!!deleteModule}
        onClose={() => {
          setDeleteModule(null);
          setError(null);
        }}
        onConfirm={handleDelete}
        moduleName={deleteModule?.title ?? ""}
        loading={loading}
        error={error}
      />
    </div>
  );
}
