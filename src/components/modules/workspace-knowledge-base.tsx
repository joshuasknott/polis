"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  cn,
  getSourceTypeLabel,
  getStatusColor,
  getStatusLabel,
  formatBytes,
} from "@/lib/utils";
import type { WorkspaceSectionProps } from "./workspace-sections";
import { SourceUploader } from "./source-uploader";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "processed", label: "Processed" },
  { value: "needs_review", label: "Needs review" },
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
] as const;

type TypeFilterValue = (typeof TYPE_FILTERS)[number]["value"];

export function WorkspaceKnowledgeBase({ data }: WorkspaceSectionProps) {
  const { module, sources, folders } = data;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TypeFilterValue>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");

  const retry = useMutation(api.sources.retryProcessing);

  const sourceKinds = useMemo(() => {
    const set = new Set<string>();
    for (const source of sources) set.add(source.classificationLabel);
    return Array.from(set).sort();
  }, [sources]);

  const filtered = sources.filter((source) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      source.title.toLowerCase().includes(searchLower) ||
      (source.author && source.author.toLowerCase().includes(searchLower)) ||
      (source.fileName && source.fileName.toLowerCase().includes(searchLower));

    const matchesFilter =
      filter === "all" ||
      (filter === "processed" && source.status === "processed") ||
      (filter === "needs_review" && source.needsReview) ||
      (filter === "failed" && source.hasError) ||
      (filter === "processing" && source.isProcessing);

    const matchesKind = kindFilter === "all" || source.classificationLabel === kindFilter;

    return matchesSearch && matchesFilter && matchesKind;
  });

  const stats = {
    total: sources.length,
    processed: sources.filter((s) => s.status === "processed").length,
    needsReview: sources.filter((s) => s.needsReview).length,
    failed: sources.filter((s) => s.hasError).length,
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/modules/${module.id}?tab=home`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Knowledge Base</span>
        </div>
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Knowledge Base</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            The full source base for this workspace. Search, filter by status or type, and open any source to view extracted content and notes.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total sources" value={stats.total} tone="muted" />
        <StatTile label="Processed" value={stats.processed} tone="success" />
        <StatTile label="Needs review" value={stats.needsReview} tone="warning" />
        <StatTile label="Failed" value={stats.failed} tone="danger" />
      </div>

      <SourceUploader moduleId={module.id} folders={folders} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author, or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === option.value
                  ? "bg-accent text-accent-foreground"
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
              "rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
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
                "rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors",
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            {sources.length === 0 ? "No sources yet" : "No sources match"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {sources.length === 0
              ? "Import your first files to start building the knowledge base."
              : "Try clearing filters or adjusting your search."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((source) => (
            <SourceCard key={source.id} source={source} onRetry={retry} />
          ))}
        </ul>
      )}
    </div>
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
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider">{label}</p>
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
  return (
    <li className="group flex flex-col rounded-xl border border-border bg-card">
      <Link
        href={`/sources/${source.id}`}
        className="flex flex-1 flex-col p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusColor(source.status))}>
            {getStatusLabel(source.status)}
          </span>
          <span className="inline-flex items-center rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-source">
            {getSourceTypeLabel(source.classificationLabel)}
          </span>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {source.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {source.author}
          {source.year ? ` (${source.year})` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground truncate">
          {source.fileName || "No file"} · {formatBytes(source.fileSize)}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
          <span>Open source</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
        </div>
      </Link>
      {source.hasError && source.errorMessage && (
        <div className="border-t border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="flex-1 line-clamp-2">{source.errorMessage}</span>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await onRetry({ sourceId: source.id as Id<"sources"> });
              }}
              className="shrink-0 rounded px-1 py-0.5 hover:bg-danger/10 transition-colors"
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
