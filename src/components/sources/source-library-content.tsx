"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  FolderOpen,
  ArrowRight,
  Upload,
} from "lucide-react";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";

interface SourceItem {
  id: string;
  moduleId: string;
  folderId: string;
  title: string;
  author: string;
  year: number;
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
          <Link
            key={source.id}
            href={`/sources/${source.id}`}
            className="group relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
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
              <div className="flex flex-wrap gap-1.5">
                {source.tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
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

      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="mt-2 text-sm font-medium">Upload New Sources</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop PDF, DOCX, TXT, or Markdown files. They will be extracted and chunked automatically.
        </p>
        <UploadButton modules={modules} />
      </div>
    </div>
  );
}

function UploadButton({ modules }: { modules: ModuleItem[] }) {
  const [uploading, setUploading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(modules[0]?.id || "");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedModule) return;

    setUploading(true);
    alert("Uploads are paused while the backend foundation migrates to Convex.");
    e.target.value = "";
    setUploading(false);
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <select
        value={selectedModule}
        onChange={(e) => setSelectedModule(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs"
      >
        {modules.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
      <label className="cursor-pointer rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
        {uploading ? "Uploading..." : "Browse Files"}
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
