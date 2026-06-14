"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Save,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceSectionProps } from "./workspace-sections";

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

export function WorkspaceSettings({ data }: WorkspaceSectionProps) {
  const { module } = data;
  const router = useRouter();

  const [form, setForm] = useState<ModuleFormData>({
    title: module.title,
    code: module.code,
    description: module.description,
    academicYear: module.academicYear,
    semester: module.semester || "Autumn",
    colour: module.colour,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateMutation = useMutation(api.modules.update);
  const removeMutation = useMutation(api.modules.remove);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await updateMutation({
        moduleId: module.id as Id<"modules">,
        title: form.title,
        code: form.code,
        description: form.description || undefined,
        academicYear: form.academicYear || undefined,
        semester: form.semester || undefined,
        colour: form.colour,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save workspace");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeMutation({ moduleId: module.id as Id<"modules"> });
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/modules/${module.id}?tab=home`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Workspace Settings</span>
        </div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update module metadata or remove this workspace. Changes apply across all assessments.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <SettingsIcon className="h-4 w-4" />
          Module details
        </div>

        {saveError && (
          <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="module-code" className="block text-sm font-medium text-foreground mb-1.5">
              Module code
            </label>
            <input
              id="module-code"
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="module-year" className="block text-sm font-medium text-foreground mb-1.5">
              Academic year
            </label>
            <input
              id="module-year"
              type="text"
              value={form.academicYear}
              onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
              placeholder="e.g. 2025/26"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
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
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Accent colour</label>
          <div className="flex flex-wrap gap-2">
            {MODULE_COLOURS.map((colour) => (
              <button
                key={colour}
                type="button"
                onClick={() => setForm((f) => ({ ...f, colour }))}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-all",
                  form.colour === colour ? "border-foreground scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: colour }}
                aria-label={`Select colour ${colour}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {savedAt ? (
            <p className="text-xs text-success">Saved</p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.code.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      </form>

      <section className="space-y-4 rounded-xl border border-danger/30 bg-danger/5 p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-danger">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this workspace permanently removes its sources, assessments, arguments, and drafts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-danger/40 bg-card px-3.5 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete workspace
        </button>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-serif">Delete Workspace</h2>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteError(null);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Delete <span className="font-medium text-foreground">{module.title}</span> and all its sources, assessments, and folders? This cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteError(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
