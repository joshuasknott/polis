"use client";

import { useState, useRef } from "react";
import {
  FolderOpen,
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  Wrench,
  ArrowRight,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";

interface ModuleWorkspaceProps {
  module: {
    id: string;
    title: string;
    code: string;
    description: string;
    colour: string;
  };
  folders: Array<{
    id: string;
    name: string;
    type: string;
    sortOrder: number;
    sourceCount: number;
  }>;
  sources: Array<{
    id: string;
    folderId: string;
    title: string;
    author: string;
    year: number;
    type: string;
    status: string;
    tags: string[];
    summary: string;
    pageCount: number;
  }>;
  essays: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

const moduleTools = [
  { name: "Reading Summary", icon: BookOpen, href: "/tools" },
  { name: "Concept Extractor", icon: GraduationCap, href: "/tools" },
  { name: "Theory Comparison", icon: Wrench, href: "/tools" },
  { name: "Plan", icon: FileText, href: "?section=plan" },
];

export function ModuleWorkspace({
  module,
  folders,
  sources,
  essays,
}: ModuleWorkspaceProps) {
  const [selectedFolder, setSelectedFolder] = useState(folders[1]?.id || folders[0]?.id || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFolderData = folders.find((f) => f.id === selectedFolder);
  const folderSources = sources.filter((s) => s.folderId === selectedFolder);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("moduleId", module.id);
      formData.append("folderId", selectedFolder);

      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-full -m-6">
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: module.colour }}
              >
                {module.code.slice(0, 3)}
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-tight">{module.title}</h2>
                <p className="text-xs text-muted-foreground">{module.code}</p>
              </div>
            </div>
          </div>

          <div className="p-3">
            <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Folders
            </p>
            <div className="space-y-0.5">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    selectedFolder === folder.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-left">{folder.name}</span>
                  <span className="ml-auto text-xs opacity-70">{folder.sourceCount}</span>
                </button>
              ))}
            </div>

            <p className="px-2 mt-5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Academic Tools
            </p>
            <div className="space-y-0.5">
              {moduleTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <tool.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tool.name}</span>
                </Link>
              ))}
            </div>

            {essays.length > 0 && (
              <>
                <p className="px-2 mt-5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Essay Projects
                </p>
                {essays.map((essay) => (
                  <Link
                    key={essay.id}
                    href={`/essays/${essay.id}`}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{essay.title}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{module.title}</span>
                <ChevronRight className="h-3 w-3" />
                <span>{selectedFolderData?.name}</span>
              </div>
              <h1 className="text-xl font-bold">{selectedFolderData?.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {folderSources.length} source{folderSources.length !== 1 ? "s" : ""} in this folder
              </p>
            </div>

            <div className="rounded-xl border-2 border-dashed border-border p-8 mb-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleUpload}
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    <p className="text-sm font-medium">Uploading and processing...</p>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Upload Sources</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Drop PDF, DOCX, TXT, or Markdown files. They will be extracted and chunked automatically.
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {folderSources.map((source) => (
                <Link
                  key={source.id}
                  href={`/sources/${source.id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-tight">{source.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {source.author} ({source.year}) &middot; {source.pageCount} pages
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{source.summary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {getSourceTypeLabel(source.type)}
                          </span>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", getStatusColor(source.status))}>
                            {getStatusLabel(source.status)}
                          </span>
                          {source.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {folderSources.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm font-medium">No sources yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload files to this folder to get started
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask about this module and its sources
            </p>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Try asking: &ldquo;What are the main differences between consensus and majoritarian democracy?&rdquo;
              </p>
            </div>

            <Link
              href="/assistant"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="h-4 w-4" />
              Open Full Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
