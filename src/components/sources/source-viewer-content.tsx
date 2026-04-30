"use client";

import {
  BookOpen,
  ArrowLeft,
  FileText,
  MessageSquare,
  GitCompareArrows,
  Database,
  Lightbulb,
  ExternalLink,
  Copy,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import { useState } from "react";

interface SourceViewerContentProps {
  source: {
    id: string;
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
    extractedText: string;
    errorMessage: string;
    moduleId: string;
    folderId: string;
  };
  moduleTitle: string;
  moduleCode: string;
  chunks: Array<{
    id: string;
    text: string;
    chunkIndex: number;
  }>;
}

const actions = [
  { label: "Summarise", icon: FileText },
  { label: "Extract Concepts", icon: Lightbulb },
  { label: "Add to Evidence Bank", icon: Database },
  { label: "Compare with Source", icon: GitCompareArrows },
  { label: "Use in Essay Plan", icon: FileText },
  { label: "Ask About This Source", icon: MessageSquare },
];

export function SourceViewerContent({
  source,
  moduleTitle,
  moduleCode,
  chunks,
}: SourceViewerContentProps) {
  const [showChunks, setShowChunks] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/sources"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sources
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {getSourceTypeLabel(source.type)}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getStatusColor(source.status))}>
            {getStatusLabel(source.status)}
          </span>
          <span className="text-xs text-muted-foreground">
            {moduleTitle} &middot; {moduleCode}
          </span>
        </div>

        <h1 className="text-xl font-bold leading-tight">{source.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {source.author} ({source.year}) &middot; {source.pageCount} pages
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
            {source.citation}
          </div>
          <button className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted transition-colors" title="Copy citation">
            <Copy className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {source.errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <strong>Error:</strong> {source.errorMessage}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {source.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-accent" />
            Summary
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {source.summary || "No summary available yet. This will be generated when AI processing is complete."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-accent" />
            Main Argument
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {source.mainArgument || "No argument extracted yet."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-accent" />
          Key Concepts
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {source.keyConcepts.map((concept: string) => (
            <span
              key={concept}
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              {concept}
            </span>
          ))}
          {source.keyConcepts.length === 0 && (
            <p className="text-sm text-muted-foreground">No concepts extracted yet.</p>
          )}
        </div>
      </div>

      {chunks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              Extracted Text ({chunks.length} chunks)
            </h2>
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="text-xs text-accent hover:underline"
            >
              {showChunks ? "Hide chunks" : "Show chunks"}
            </button>
          </div>
          {showChunks && (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Chunk {chunk.chunkIndex + 1}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {chunk.text.slice(0, 500)}{chunk.text.length > 500 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href="/assistant"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent-muted/30 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-accent">
          <MessageSquare className="h-4 w-4" />
          Ask About This Source
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the AI assistant to ask questions about this reading, extract arguments, compare with other sources, or plan how to use it in your essay.
        </p>
        <Link
          href="/assistant"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Open Assistant
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
