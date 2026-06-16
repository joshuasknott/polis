"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Upload,
  Loader2,
  RefreshCw,
  Check,
  Edit3,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  cn,
  formatBytes,
  formatBatchLabel,
  getSourceTypeLabel,
  getStatusColor,
  getStatusLabel,
  groupByDateKey,
} from "@/lib/utils";
import type { SourceType } from "@/lib/types";
import type { WorkspaceSectionProps } from "./workspace-sections";
import { SourceUploader } from "./source-uploader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const CLASSIFICATION_OPTIONS: SourceType[] = [
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

interface ImportBatch {
  dateKey: string;
  label: string;
  sources: WorkspaceSectionProps["data"]["sources"];
}

export function WorkspaceImports({ data }: WorkspaceSectionProps) {
  const { module, sources, folders } = data;

  const batches = useMemo<ImportBatch[]>(() => {
    const grouped = new Map<string, WorkspaceSectionProps["data"]["sources"]>();
    for (const source of sources) {
      const key = groupByDateKey(new Date(source.uploadedAtMs).toISOString());
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(source);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([dateKey, list]) => ({
        dateKey,
        label: formatBatchLabel(dateKey),
        sources: list.sort((a, b) => b.uploadedAtMs - a.uploadedAtMs),
      }));
  }, [sources]);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/modules/${module.id}?tab=home`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Imports</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif tracking-tight text-foreground">Imports</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Review uploaded files, confirm or correct classification, and track processing state. Sources are grouped by import batch.
            </p>
          </div>
        </div>
      </header>

      <SourceUploader moduleId={module.id} folders={folders} />

      <ImportSummary sources={sources} />

      {batches.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No imports yet"
          description="Upload readings, lecture slides, the module handbook, or an assignment brief to get started."
        />
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => (
            <ImportBatch key={batch.dateKey} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImportSummary({ sources }: { sources: WorkspaceSectionProps["data"]["sources"] }) {
  const counts = {
    processing: sources.filter((s) => s.isProcessing).length,
    needsReview: sources.filter((s) => s.needsReview).length,
    failed: sources.filter((s) => s.hasError).length,
    processed: sources.filter((s) => s.status === "processed").length,
  };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryTile label="Processing" value={counts.processing} tone="accent" />
      <SummaryTile label="Needs review" value={counts.needsReview} tone="warning" />
      <SummaryTile label="Failed" value={counts.failed} tone="danger" />
      <SummaryTile label="Processed" value={counts.processed} tone="success" />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "warning" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-danger/30 bg-danger/5 text-danger"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning"
        : tone === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-accent/25 bg-accent/5 text-accent";
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ImportBatch({ batch }: { batch: ImportBatch }) {
  const [open, setOpen] = useState(true);
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{batch.label}</p>
            <p className="text-xs text-muted-foreground">
              {batch.sources.length} file{batch.sources.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Import batch
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {batch.sources.map((source) => (
            <ImportRow key={source.id} source={source} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImportRow({
  source,
}: {
  source: WorkspaceSectionProps["data"]["sources"][number];
}) {
  const update = useMutation(api.sources.update);
  const retry = useMutation(api.sources.retryProcessing);
  const [editing, setEditing] = useState(false);
  const [draftType, setDraftType] = useState<SourceType>(source.classificationLabel);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runUpdate(payload: Parameters<typeof update>[0]) {
    setPending(true);
    setError(null);
    try {
      await update(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      throw err;
    } finally {
      setPending(false);
    }
  }

  async function handleAccept() {
    try {
      await runUpdate({
        sourceId: source.id as Id<"sources">,
        status: "processed",
      });
    } catch {
      /* error surfaced via state */
    }
  }

  async function handleSaveClassification() {
    try {
      await runUpdate({
        sourceId: source.id as Id<"sources">,
        type: draftType,
        status: "processed",
      });
      setEditing(false);
    } catch {
      /* error surfaced via state */
    }
  }

  async function handleRetry() {
    setPending(true);
    setError(null);
    try {
      await retry({ sourceId: source.id as Id<"sources"> });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusColor(source.status))}>
              {getStatusLabel(source.status)}
            </span>
            <span className="inline-flex items-center rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-source">
              {getSourceTypeLabel(source.classificationLabel)}
            </span>
            {source.needsReview && (
              <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                <AlertCircle className="h-3 w-3" /> Review classification
              </span>
            )}
          </div>
          <Link
            href={`/sources/${source.id}`}
            className="mt-2 block text-sm font-semibold text-foreground hover:text-accent transition-colors truncate"
          >
            {source.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {source.fileName || "No file name"} · {source.fileType || "unknown type"} · {formatBytes(source.fileSize)}
          </p>
          {source.hasError && source.errorMessage && (
            <p className="mt-2 flex items-start gap-1.5 rounded-md border border-danger/30 bg-danger/5 px-2.5 py-1.5 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="flex-1">{source.errorMessage}</span>
            </p>
          )}
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {source.hasError ? (
            <Button type="button" variant="danger" size="sm" onClick={handleRetry} disabled={pending}>
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Retry
            </Button>
          ) : source.isProcessing ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Processing
            </span>
          ) : editing ? (
            <div className="flex items-center gap-2">
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as SourceType)}
                disabled={pending}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getSourceTypeLabel(option)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveClassification}
                disabled={pending}
              >
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
          ) : (
            <>
              {source.needsReview && (
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
            </>
          )}
        </div>
      </div>
    </li>
  );
}
