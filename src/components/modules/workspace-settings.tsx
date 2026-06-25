"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AlertTriangle,
  ArrowLeft,
  Save,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import type { WorkspaceSectionProps } from "./workspace-sections";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";

export function WorkspaceSettings({ data }: WorkspaceSectionProps) {
  const { module } = data;
  const router = useRouter();

  const [title, setTitle] = useState(module.title);
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
        title: title.trim(),
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
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/modules/${module.id}`} className="flex items-center gap-1 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Module Info
          </Link>
          <span>/</span>
          <span className="text-foreground">Settings</span>
        </div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Rename or delete this workspace. Everything else is built from imported module material.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <SettingsIcon className="h-4 w-4" />
          Workspace name
        </div>

        {saveError && (
          <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        <Field label="Workspace name" htmlFor="workspace-name">
          <Input
            id="workspace-name"
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSavedAt(null);
            }}
            placeholder="e.g. International Security"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          {savedAt ? (
            <p className="text-xs text-success">Saved</p>
          ) : (
            <span />
          )}
          <Button type="submit" loading={saving} disabled={!title.trim()}>
            {saving ? null : <Save className="h-4 w-4" />}
            Save name
          </Button>
        </div>
      </form>

      <section className="space-y-4 rounded-xl border border-danger/30 bg-danger/5 p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-danger">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this workspace permanently removes its sources, assessments, arguments, and drafts.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete workspace
        </Button>
      </section>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} className="max-w-sm">
        <DialogHeader title="Delete Workspace" onClose={() => setDeleteOpen(false)} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Delete <span className="font-medium text-foreground">{module.title}</span> and all its sources, assessments, and folders? This cannot be undone.
        </p>
        {deleteError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {deleteError}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDeleteOpen(false);
              setDeleteError(null);
            }}
          >
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
            {deleting ? null : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
