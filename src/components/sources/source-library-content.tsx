"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  FolderOpen,
  ArrowRight,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";

interface SourceItem {
  id: string;
  moduleId: string;
  folderId: string | null;
  title: string;
  author: string;
  year: number | null;
  type: string;
  status: string;
  tags: string[];
  citation: string;
  pageCount: number;
  uploadedAt: string;
  summary: string;
  mainArgument: string;
  keyConcepts: string[];
  moduleName: string;
  errorMessage: string;
}

interface ModuleItem {
  id: string;
  title: string;
  code: string;
}

interface SourceLibraryContentProps {
  sources: SourceItem[];
  modules: ModuleItem[];
}

export function SourceLibraryContent({ sources, modules }: SourceLibraryContentProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const types = ["all", ...new Set(sources.map((s) => s.type))];
  const filtered = sources.filter((s) => {
    const matchesSearch =
      search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author.toLowerCase().includes(search.toLowerCase()) ||
      s.summary.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Source Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All uploaded sources across your modules ({sources.length} total)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sources by title, author, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                selectedType === type
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {type === "all" ? "All Types" : getSourceTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm font-medium">No sources found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sources.length === 0
              ? "Upload your first source to get started"
              : "Try adjusting your search or filter"}
          </p>
        </div>
      )}

      <UploadZone modules={modules} />
    </div>
  );
}

function SourceCard({ source }: { source: SourceItem }) {
  const retry = useMutation(api.sources.retryProcessing);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
      <Link
        href={`/sources/${source.id}`}
        className="flex flex-col flex-1 p-6"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-source/40 to-source/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-source">
              {getSourceTypeLabel(source.type)}
            </span>
            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusColor(source.status))}>
              {getStatusLabel(source.status)}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        <h3 className="text-base font-bold font-serif leading-tight line-clamp-2 text-foreground group-hover:text-source transition-colors">
          {source.title}
        </h3>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          {source.author} ({source.year})
        </p>
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {source.summary}
        </p>
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="truncate">{source.moduleName}</span>
          </div>
        </div>
      </Link>
      {source.status === "failed" && source.errorMessage && (
        <div className="px-6 pb-4">
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-2 text-xs text-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="flex-1 line-clamp-2">{source.errorMessage}</span>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await retry({ sourceId: source.id as Id<"sources"> });
                }}
                className="shrink-0 rounded px-1.5 py-0.5 hover:bg-danger/10 transition-colors"
                title="Retry processing"
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

function UploadZone({ modules }: { modules: ModuleItem[] }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
      <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
      <p className="mt-2 text-sm font-medium">Upload New Sources</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Supports TXT, Markdown, PDF, and DOCX files.
      </p>
      <UploadButton modules={modules} />
    </div>
  );
}

function UploadButton({ modules }: { modules: ModuleItem[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState(modules[0]?.id || "");

  const createForUpload = useMutation(api.sources.createForUpload);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attachStorage = useMutation(api.sources.attachStorage);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedModule) return;

    setUploading(true);
    setError(null);

    try {
      const sourceId = await createForUpload({
        moduleId: selectedModule as Id<"modules">,
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        folderType: "readings",
      });

      const postUrl = await generateUploadUrl({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      });

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
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-center gap-2">
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          disabled={uploading}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs"
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <label className={cn(
          "cursor-pointer rounded-lg border border-border px-4 py-1.5 text-xs font-medium transition-colors",
          uploading ? "opacity-50 cursor-wait" : "hover:bg-muted"
        )}>
          {uploading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading...
            </span>
          ) : (
            "Browse Files"
          )}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
