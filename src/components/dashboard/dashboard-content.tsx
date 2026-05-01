"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Calendar, FileText, Layers3, LibraryBig, Loader2, Plus, X } from "lucide-react";
import { getPolisNextAction } from "@/lib/polis/next-action";
import { normalizeSourceStatus, stageLabel } from "@/lib/polis/status";
import type { ContextPack, Draft, KnowledgePage, Module, Plan, SourceFile, User } from "@/lib/types";

interface WorkspaceCard extends Module {
  sources: SourceFile[];
  knowledgePages: KnowledgePage[];
  contextPack: ContextPack | null;
  plan: Plan | null;
  draft: Draft | null;
}

interface DashboardContentProps {
  user: Pick<User, "name">;
  workspaces: WorkspaceCard[];
}

async function postPolis(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/polis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function DashboardContent({ user, workspaces }: DashboardContentProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const result = await postPolis("createWorkspace", {
        title: title.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        academicYear: academicYear.trim() || undefined,
        semester: semester.trim() || undefined,
      });
      router.push(`/modules/${result.id}?section=overview`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create workspace");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-accent">Workspaces</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your workspaces</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {user.name ? `${user.name.split(" ")[0]}, ` : ""}each workspace is a source-aware knowledge base for one assessment workflow.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create workspace
          </button>
        </div>
      </header>

      {showCreate && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New workspace</h2>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Politics of the Middle East"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Module code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. POLI20421"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Optional description of the module"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Academic year</label>
              <input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. 2025/26"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Semester</label>
              <input
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Semester 1"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create workspace
            </button>
            {createError && <span className="text-xs text-red-600">{createError}</span>}
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => {
          const nextAction = getPolisNextAction({
            sources: workspace.sources,
            knowledgePages: workspace.knowledgePages,
            contextPack: workspace.contextPack,
            plan: workspace.plan,
            draft: workspace.draft,
          });
          const processedSourceCount = workspace.sources.filter((source) => normalizeSourceStatus(source.status) === "processed").length;

          return (
            <Link
              key={workspace.id}
              href={`/modules/${workspace.id}?section=${nextAction.section}`}
              className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                      {workspace.code}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {stageLabel(workspace.currentStage)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-accent">
                    {workspace.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {workspace.assessmentQuestion || workspace.assessmentTitle || workspace.description || "Set an assessment question in the workspace overview."}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {workspace.sources.length} sources
                </span>
                <span className="flex items-center gap-1.5">
                  <LibraryBig className="h-3.5 w-3.5" />
                  {processedSourceCount} processed
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers3 className="h-3.5 w-3.5" />
                  {workspace.knowledgePages.length} pages
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {workspace.draft?.status || (workspace.plan ? "planned" : "not planned")}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">Next action</p>
                <p className="mt-1 text-sm font-medium">{nextAction.label}</p>
              </div>

              {workspace.deadline && (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Deadline: {new Date(workspace.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
            </Link>
          );
        })}
      </section>

      {workspaces.length === 0 && !showCreate && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <LibraryBig className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No workspaces yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your first workspace to start organising module material and building coursework context.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create your first workspace
          </button>
        </div>
      )}
    </div>
  );
}
