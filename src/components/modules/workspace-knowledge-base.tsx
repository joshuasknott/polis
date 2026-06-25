"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Edit3,
  FileStack,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  cn,
  formatBytes,
  getSourceTypeLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import type { SourceType } from "@/lib/types";
import type { WorkspaceSectionProps } from "./workspace-sections";
import { SourceUploader } from "./source-uploader";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const SOURCE_TYPE_OPTIONS: SourceType[] = [
  "journal_article",
  "book_chapter",
  "book",
  "lecture_slides",
  "module_handbook",
  "assignment_brief",
  "marking_rubric",
  "seminar_notes",
  "report",
  "news_article",
];

const IMPORT_LABEL_OPTIONS = [
  "handbook",
  "syllabus",
  "assignment_brief",
  "rubric",
  "slides",
  "reading",
  "draft",
  "notes",
  "integrity_guidance",
  "reading_list",
  "other",
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "processed", label: "Processed" },
  { value: "needs_review", label: "Needs review" },
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]["value"];

type GroupFilter =
  | "all"
  | "needs_review"
  | "readings"
  | "lecture_material"
  | "module_info"
  | "briefs_rubrics"
  | `folder:${string}`;

export function WorkspaceSources({ data }: WorkspaceSectionProps) {
  const {
    module,
    sources,
    folders,
    importBatches,
    importedFiles,
    aiActions,
    relevanceSignals,
    gapSignals,
  } = data;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  const retry = useMutation(api.sources.retryProcessing);

  const sourceKinds = useMemo(() => {
    const set = new Set<string>();
    for (const source of sources) set.add(source.classificationLabel);
    return Array.from(set).sort();
  }, [sources]);

  const groups = useMemo(() => {
    const base: Array<{ value: GroupFilter; label: string; count: number }> = [
      { value: "all", label: "All Sources", count: sources.length },
      {
        value: "needs_review",
        label: "Needs Review",
        count: sources.filter((source) => source.needsReview).length,
      },
      {
        value: "readings",
        label: "Readings",
        count: sources.filter((source) => isInBaselineGroup(source, "readings")).length,
      },
      {
        value: "lecture_material",
        label: "Lecture Material",
        count: sources.filter((source) => isInBaselineGroup(source, "lecture_material")).length,
      },
      {
        value: "module_info",
        label: "Module Info",
        count: sources.filter((source) => isInBaselineGroup(source, "module_info")).length,
      },
      {
        value: "briefs_rubrics",
        label: "Briefs/Rubrics",
        count: sources.filter((source) => isInBaselineGroup(source, "briefs_rubrics")).length,
      },
    ];

    const custom = folders
      .filter((folder) => folder.type === "custom")
      .map((folder) => ({
        value: `folder:${folder.id}` as GroupFilter,
        label: folder.name,
        count: sources.filter((source) => source.folderId === folder.id).length,
      }));

    return [...base, ...custom];
  }, [folders, sources]);

  const filtered = sources.filter((source) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      source.title.toLowerCase().includes(searchLower) ||
      (source.author && source.author.toLowerCase().includes(searchLower)) ||
      (source.fileName && source.fileName.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "processed" && source.status === "processed") ||
      (statusFilter === "needs_review" && source.needsReview) ||
      (statusFilter === "failed" && source.hasError) ||
      (statusFilter === "processing" && source.isProcessing);

    const matchesKind =
      kindFilter === "all" || source.classificationLabel === kindFilter;
    const matchesGroup = isInGroup(source, groupFilter);

    return matchesSearch && matchesStatus && matchesKind && matchesGroup;
  });

  const stats = {
    total: sources.length,
    processed: sources.filter((s) => s.status === "processed").length,
    needsReview: sources.filter((s) => s.needsReview).length,
    failed: sources.filter((s) => s.hasError).length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/modules/${module.id}`}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Module Info
          </Link>
          <span>/</span>
          <span className="text-foreground">Sources</span>
        </div>
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Sources</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Workspace source base, import review, and source-context signals.
          </p>
        </div>
      </header>

      <SourceUploader moduleId={module.id} folders={folders} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total sources" value={stats.total} tone="muted" />
        <StatTile label="Processed" value={stats.processed} tone="success" />
        <StatTile label="Needs review" value={stats.needsReview} tone="warning" />
        <StatTile label="Failed" value={stats.failed} tone="danger" />
      </div>

      <SourceGroupBar
        groups={groups}
        selected={groupFilter}
        onSelect={setGroupFilter}
      />

      <ImportBatches
        batches={importBatches}
        files={importedFiles}
      />

      <SignalsPanel
        relevanceSignals={relevanceSignals}
        gapSignals={gapSignals}
      />

      <AiActivity actions={aiActions} />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, author, or file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-card py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  "min-h-8 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === option.value
                    ? "bg-gold-soft/50 text-gold-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {sourceKinds.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={cn(
                "min-h-7 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase transition-colors",
                kindFilter === "all"
                  ? "border-source/40 bg-source/10 text-source"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              All types
            </button>
            {sourceKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setKindFilter(kind)}
                className={cn(
                  "min-h-7 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase transition-colors",
                  kindFilter === kind
                    ? "border-source/40 bg-source/10 text-source"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {getSourceTypeLabel(kind)}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={sources.length === 0 ? "No sources yet" : "No sources match"}
            description={
              sources.length === 0
                ? "Import coursework files to build the Source Base."
                : "Try clearing filters or adjusting your search."
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((source) => (
              <SourceCard key={source.id} source={source} onRetry={retry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SourceGroupBar({
  groups,
  selected,
  onSelect,
}: {
  groups: Array<{ value: GroupFilter; label: string; count: number }>;
  selected: GroupFilter;
  onSelect: (value: GroupFilter) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <FileStack className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Source groups</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {groups.map((group) => (
          <button
            key={group.value}
            type="button"
            onClick={() => onSelect(group.value)}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-left text-xs font-medium transition-colors",
              selected === group.value
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <span>{group.label}</span>
            <span className="rounded bg-background/70 px-1.5 py-0.5 tabular-nums">
              {group.count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ImportBatches({
  batches,
  files,
}: {
  batches: WorkspaceSectionProps["data"]["importBatches"];
  files: WorkspaceSectionProps["data"]["importedFiles"];
}) {
  if (batches.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Import batches</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {batches.slice(0, 4).map((batch) => {
          const batchFiles = files.filter((file) => file.batchId === batch.id);
          return (
            <section key={batch.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {batch.totalFiles} file{batch.totalFiles === 1 ? "" : "s"} - {formatStatus(batch.status)}
                  </p>
                </div>
                <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {batch.processedFiles}/{batch.totalFiles}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {batchFiles.slice(0, 5).map((file) => (
                  <ImportedFileRow key={file.id} file={file} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ImportedFileRow({
  file,
}: {
  file: WorkspaceSectionProps["data"]["importedFiles"][number];
}) {
  const confirm = useMutation(api.imports.confirmClassification);
  const edit = useMutation(api.imports.editClassification);
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(file.primaryLabel || "other");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setError(null);
    try {
      await confirm({ importedFileId: file.id as Id<"importedFiles"> });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      await edit({
        importedFileId: file.id as Id<"importedFiles">,
        primaryLabel: draftLabel as (typeof IMPORT_LABEL_OPTIONS)[number],
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  const needsReview =
    file.classificationStatus === "needs_review" ||
    file.classificationStatus === "failed";

  return (
    <li className="px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", statusClass(file.classificationStatus))}>
              {formatStatus(file.classificationStatus)}
            </span>
            {file.primaryLabel && (
              <span className="rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold uppercase text-source">
                {formatLabel(file.primaryLabel)}
              </span>
            )}
            {file.rawRetainedAt && (
              <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                Raw kept
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{file.fileName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {file.fileType || "unknown type"} - {formatBytes(file.fileSize)}
          </p>
          {(file.rationale || file.classificationError || error) && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {error ?? file.classificationError ?? file.rationale}
            </p>
          )}
        </div>
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              disabled={pending}
              className="min-h-8 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {IMPORT_LABEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {needsReview && (
              <Button type="button" size="sm" onClick={accept} disabled={pending || !file.primaryLabel}>
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Accept
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={pending}
            >
              <Edit3 className="h-3 w-3" />
              Correct
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

function SignalsPanel({
  relevanceSignals,
  gapSignals,
}: {
  relevanceSignals: WorkspaceSectionProps["data"]["relevanceSignals"];
  gapSignals: WorkspaceSectionProps["data"]["gapSignals"];
}) {
  const signals = [
    ...relevanceSignals.map((signal) => ({ ...signal, kind: "relevance" })),
    ...gapSignals.map((signal) => ({ ...signal, kind: "gap" })),
  ]
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 6);

  if (signals.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Source-context signals</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {signals.map((signal) => (
          <article key={`${signal.kind}:${signal.id}`} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", signal.kind === "gap" ? statusClass(signal.severity) : "bg-source/10 text-source")}>
                {signal.kind === "gap" ? formatStatus(signal.severity) : formatLabel(signal.signalType)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {Math.round(signal.confidence * 100)}%
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-foreground">{signal.title}</h3>
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
              {signal.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AiActivity({
  actions,
}: {
  actions: WorkspaceSectionProps["data"]["aiActions"];
}) {
  const revert = useMutation(api.aiActions.revertAction);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const visible = actions.slice(0, 8);
  if (visible.length === 0) return null;

  async function undo(actionId: string) {
    setPendingId(actionId);
    try {
      await revert({ actionId: actionId as Id<"aiActions"> });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Polis activity</h2>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <ul className="divide-y divide-border">
          {visible.map((action) => (
            <li key={action.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", statusClass(action.status))}>
                    {formatStatus(action.status)}
                  </span>
                  {action.autoApplied && (
                    <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                      Auto-applied
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{action.title}</p>
                {action.summary && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {action.summary}
                  </p>
                )}
              </div>
              {action.reversible && !action.revertedAt && action.status !== "reverted" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => undo(action.id)}
                  disabled={pendingId === action.id}
                >
                  {pendingId === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  Undo
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/5 text-danger"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning"
        : tone === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("rounded-lg border p-4", toneClass)}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase">{label}</p>
    </div>
  );
}

function SourceCard({
  source,
  onRetry,
}: {
  source: WorkspaceSectionProps["data"]["sources"][number];
  onRetry: (args: { sourceId: Id<"sources"> }) => Promise<unknown>;
}) {
  const update = useMutation(api.sources.update);
  const [editing, setEditing] = useState(false);
  const [draftType, setDraftType] = useState<SourceType>(source.classificationLabel);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setPending(true);
    setError(null);
    try {
      await update({
        sourceId: source.id as Id<"sources">,
        status: "processed",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function handleSaveClassification() {
    setPending(true);
    setError(null);
    try {
      await update({
        sourceId: source.id as Id<"sources">,
        type: draftType,
        status: "processed",
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="group flex flex-col rounded-lg border border-border bg-card">
      <Link
        href={`/sources/${source.id}`}
        className="flex flex-1 flex-col p-5 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", getStatusColor(source.status))}>
            {getStatusLabel(source.status)}
          </span>
          <span className="rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold uppercase text-source">
            {getSourceTypeLabel(source.classificationLabel)}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {source.title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {source.author}
          {source.year ? ` (${source.year})` : ""}
        </p>
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {source.fileName || "No file"} - {formatBytes(source.fileSize)}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
          <span>Open source</span>
          <ArrowRight className="h-3.5 w-3.5 transition-colors group-hover:text-foreground" />
        </div>
      </Link>
      {(source.needsReview || editing || error) && (
        <div className="border-t border-warning/20 bg-warning/5 px-4 py-3">
          {error && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          )}
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as SourceType)}
                disabled={pending}
                className="min-h-8 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {SOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getSourceTypeLabel(option)}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" onClick={handleSaveClassification} disabled={pending}>
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setDraftType(source.classificationLabel);
                  setError(null);
                }}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          ) : source.needsReview ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                disabled={pending}
                className="bg-success text-white hover:bg-success/90"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Accept
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
                disabled={pending}
              >
                <Edit3 className="h-3 w-3" />
                Correct
              </Button>
            </div>
          ) : null}
        </div>
      )}
      {source.hasError && source.errorMessage && (
        <div className="border-t border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2 flex-1">{source.errorMessage}</span>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await onRetry({ sourceId: source.id as Id<"sources"> });
              }}
              className="shrink-0 rounded px-1 py-0.5 transition-colors hover:bg-danger/10"
              title="Retry processing"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function isInGroup(
  source: WorkspaceSectionProps["data"]["sources"][number],
  group: GroupFilter,
) {
  if (group === "all") return true;
  if (group === "needs_review") return source.needsReview;
  if (group.startsWith("folder:")) return source.folderId === group.slice(7);
  if (
    group === "readings" ||
    group === "lecture_material" ||
    group === "module_info" ||
    group === "briefs_rubrics"
  ) {
    return isInBaselineGroup(source, group);
  }
  return false;
}

function isInBaselineGroup(
  source: WorkspaceSectionProps["data"]["sources"][number],
  group: Exclude<GroupFilter, "all" | "needs_review" | `folder:${string}`>,
) {
  if (group === "readings") {
    return (
      source.classificationLabel === "journal_article" ||
      source.classificationLabel === "book_chapter" ||
      source.classificationLabel === "book"
    );
  }
  if (group === "lecture_material") {
    return (
      source.classificationLabel === "lecture_slides" ||
      source.classificationLabel === "seminar_notes"
    );
  }
  if (group === "module_info") {
    return source.classificationLabel === "module_handbook";
  }
  if (group === "briefs_rubrics") {
    return (
      source.classificationLabel === "assignment_brief" ||
      source.classificationLabel === "marking_rubric"
    );
  }
  return false;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function statusClass(value: string) {
  if (value === "failed" || value === "critical") {
    return "bg-danger/10 text-danger";
  }
  if (
    value === "needs_review" ||
    value === "warning" ||
    value === "pending" ||
    value === "classifying"
  ) {
    return "bg-warning/10 text-warning";
  }
  if (
    value === "auto_accepted" ||
    value === "accepted" ||
    value === "completed" ||
    value === "processed" ||
    value === "applied"
  ) {
    return "bg-success/10 text-success";
  }
  return "bg-muted text-muted-foreground";
}
