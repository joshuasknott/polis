"use client";

import { useState, useRef } from "react";
import {
  BookOpen,
  FileText,
  Upload,
  Loader2,
  ArrowRight,
  Info,
  StickyNote,
  CheckCircle,
  ArrowLeft
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
    activeTab: string;
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

export function ModuleWorkspace({
  module,
  folders,
  sources,
  essays,
}: ModuleWorkspaceProps) {
  const { activeTab } = module;

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return <ModuleInfo module={module} />;
      case "readings":
        return <ModuleReadings module={module} folders={folders} sources={sources} />;
      case "module-notes":
        return <EmptyState icon={FileText} title="Module Notes" description="Your consolidated module notes will appear here." />;
      case "source-notes":
        return <EmptyState icon={StickyNote} title="Source Notes" description="Annotations and notes from your readings will appear here." />;
      case "essays":
        return <ModuleEssays essays={essays} />;
      case "submission":
        return <EmptyState icon={CheckCircle} title="Final Submission" description="Assemble your final essay submission here." />;
      default:
        return <ModuleInfo module={module} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Module Header Area */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Workspaces
          </Link>
          <span>/</span>
          <span>{module.code}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">{module.title}</h1>
        {module.description && (
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-3xl leading-relaxed">
            {module.description}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-24 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}

function ModuleInfo({ module }: { module: any }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Module Details</h3>
        <dl className="space-y-5">
          <div>
            <dt className="text-xs text-muted-foreground">Module Code</dt>
            <dd className="text-sm font-medium mt-1">{module.code}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Workspace ID</dt>
            <dd className="text-sm font-medium mt-1 font-mono">{module.id}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col items-center justify-center text-center">
        <Info className="h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Use the left sidebar to navigate between your readings, notes, and essay plans for this module workspace.
        </p>
      </div>
    </div>
  );
}

function ModuleReadings({ folders, sources }: { module: any, folders: any[], sources: any[] }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    alert("Uploads are paused while the backend foundation migrates to Convex.");
    e.target.value = "";
    setUploading(false);
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Readings & Sources</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity shadow-sm"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload Source
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      <div className="space-y-10">
        {folders.map(folder => {
          const folderSources = sources.filter(s => s.folderId === folder.id);
          
          if (folderSources.length === 0) {
             return (
               <div key={folder.id} className="space-y-4">
                  <h3 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                    {folder.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">0</span>
                  </h3>
                  <p className="text-sm text-muted-foreground italic py-4">No sources in this folder.</p>
               </div>
             );
          }
          
          return (
            <div key={folder.id} className="space-y-4">
              <h3 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                {folder.name} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{folderSources.length}</span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {folderSources.map(source => (
                  <Link
                    key={source.id}
                    href={`/sources/${source.id}`}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-foreground/30 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", getStatusColor(source.status))}>
                          {getStatusLabel(source.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">{getSourceTypeLabel(source.type)}</span>
                      </div>
                      <h4 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-foreground transition-colors">{source.title}</h4>
                      <p className="text-xs text-muted-foreground">{source.author} ({source.year})</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <span>{source.pageCount} pages</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-4 text-sm font-medium">No readings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your first source to start building this module's library.
          </p>
        </div>
      )}
    </div>
  );
}

function ModuleEssays({ essays }: { essays: any[] }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-semibold">Essay Plans</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity shadow-sm">
          New Essay
        </button>
      </div>

      {essays.length > 0 ? (
        <div className="grid gap-4">
          {essays.map(essay => (
            <Link
              key={essay.id}
              href={`/essays/${essay.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-6 hover:border-foreground/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{essay.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Status: <span className="capitalize font-medium">{essay.status.replace('-', ' ')}</span></p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="No Essay Plans" description="Create an essay plan to start drafting and outlining your arguments." />
      )}
    </div>
  );
}
