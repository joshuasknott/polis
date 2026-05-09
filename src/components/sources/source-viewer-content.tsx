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
  RefreshCw,
  StickyNote,
  Plus,
  Trash2,
  AlertCircle,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { cn, getSourceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SourceViewerContentProps {
  source: {
    id: string;
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
    pageStart: number | null;
    pageEnd: number | null;
    citationLabel: string;
    tokenEstimate: number | null;
  }>;
  notes: Array<{
    id: string;
    content: string;
    tags: string[];
    createdAt: string;
  }>;
  backHref: string;
  backLabel: string;
}

const actions = [
  { label: "Summarise", icon: FileText },
  { label: "Extract Concepts", icon: Lightbulb },
  { label: "Add to Evidence Bank", icon: Database },
  { label: "Compare with Source", icon: GitCompareArrows },
  { label: "Link to Assignment Argument", icon: FileText },
  { label: "Ask About This Source", icon: MessageSquare },
];

export function SourceViewerContent({
  source,
  moduleTitle,
  moduleCode,
  chunks,
  notes,
  backHref,
  backLabel,
}: SourceViewerContentProps) {
  function handlePausedAnalysis() {
    alert("Source analysis is paused while the backend foundation migrates to Convex.");
  }

  const bylineParts = [
    source.author,
    source.year ? `(${source.year})` : null,
    source.pageCount ? `${source.pageCount} pages` : null,
  ].filter(Boolean);

  const isActiveStatus = ["queued", "extracting", "chunking", "uploading"].includes(source.status);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 max-w-full">
      <div className="p-6 border-b border-border bg-card shrink-0 z-10 shadow-sm relative">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-source/10 px-2.5 py-0.5 text-xs font-medium text-source">
                {getSourceTypeLabel(source.type)}
              </span>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getStatusColor(source.status))}>
                {getStatusLabel(source.status)}
              </span>
              {(moduleTitle || moduleCode) && (
                <span className="text-xs text-muted-foreground">
                  {[moduleTitle, moduleCode].filter(Boolean).join(" \u00b7 ")}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight font-serif text-foreground">{source.title}</h1>
            {bylineParts.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {bylineParts.join(" \u00b7 ")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground max-w-[300px] truncate">
                {source.citation}
              </div>
              <button className="shrink-0 rounded-lg border border-border p-1.5 hover:bg-muted transition-colors" title="Copy citation">
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {source.errorMessage && (
          <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Processing Error:</strong> {source.errorMessage}
              </div>
              <RetryButton sourceId={source.id} />
            </div>
          </div>
        )}

        {isActiveStatus && (
          <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-accent">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing source: {getStatusLabel(source.status).toLowerCase()}...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border overflow-y-auto scrollbar-thin bg-background p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 font-sans">
            Source Text
          </h2>
          {chunks.length > 0 ? (
            <div className="space-y-6">
              {chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="group relative pl-4 border-l-2 border-transparent hover:border-source transition-colors"
                >
                  <div className="absolute -left-6 top-1 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-muted-foreground">
                      {chunk.chunkIndex + 1}
                    </span>
                  </div>
                  {(chunk.citationLabel || chunk.pageStart != null) && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bookmark className="h-3 w-3 text-source/60" />
                      <span className="text-[10px] font-medium text-source/80 uppercase tracking-wider">
                        {chunk.citationLabel || `p. ${chunk.pageStart}`}
                      </span>
                      {chunk.tokenEstimate != null && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          ~{chunk.tokenEstimate} tokens
                        </span>
                      )}
                    </div>
                  )}
                  <p className="font-serif text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {source.status === "failed"
                  ? "Text extraction failed. See error above for details."
                  : isActiveStatus
                    ? "Text is being extracted and chunked..."
                    : "No extracted text available for this source."}
              </p>
            </div>
          )}
        </div>

        <div className="w-1/2 overflow-y-auto scrollbar-thin bg-muted/20 p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4 text-interpretation" />
                  Source Summary
                </h2>
                <button
                  onClick={handlePausedAnalysis}
                  className="inline-flex items-center gap-1.5 text-xs text-interpretation hover:underline disabled:opacity-50 font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Analysis Paused
                </button>
              </div>
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {source.summary || "No generated summary is available. Runtime AI analysis is paused."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <BookOpen className="h-4 w-4 text-source" />
                Main Argument
              </h2>
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {source.mainArgument || "No main argument has been extracted yet."}
              </p>
            </div>
            
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <Lightbulb className="h-4 w-4 text-interpretation" />
                Key Concepts
              </h2>
              <div className="flex flex-wrap gap-2">
                {source.keyConcepts.map((concept: string) => (
                  <span
                    key={concept}
                    className="inline-flex items-center rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium"
                  >
                    {concept}
                  </span>
                ))}
                {source.keyConcepts.length === 0 && (
                  <p className="text-sm text-muted-foreground font-serif">No concepts extracted yet.</p>
                )}
              </div>
            </div>
          </div>

          <SourceNotesSection sourceId={source.id} notes={notes} />

          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={handlePausedAnalysis}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                {action.label}
                <span className="ml-auto text-[10px] uppercase tracking-wider">Paused</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-source/20 bg-source/5 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-source mb-2">
              <MessageSquare className="h-4 w-4" />
              Ask About This Source
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CoThinker questions about this source are paused until runtime AI is rebuilt on the Convex backend.
            </p>
            <button
              onClick={handlePausedAnalysis}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-source hover:underline"
            >
              Analysis Paused
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RetryButton({ sourceId }: { sourceId: string }) {
  const retry = useMutation(api.sources.retryProcessing);
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          await retry({ sourceId: sourceId as Id<"sources"> });
        } catch {}
        setLoading(false);
      }}
      disabled={loading}
      className="shrink-0 rounded-md border border-danger/30 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
    >
      {loading ? "Retrying..." : "Retry"}
    </button>
  );
}

function SourceNotesSection({
  sourceId,
  notes,
}: {
  sourceId: string;
  notes: SourceViewerContentProps["notes"];
}) {
  const createNote = useMutation(api.notes.create);
  const removeNote = useMutation(api.notes.remove);
  const [newNote, setNewNote] = useState("");
  const [newTags, setNewTags] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addNote() {
    if (!newNote.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createNote({
        sourceId: sourceId as Id<"sources">,
        content: newNote.trim(),
        tags: newTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setNewNote("");
      setNewTags("");
      setShowForm(false);
    } catch {
      setError("Failed to save note.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(noteId: string) {
    setRemovingId(noteId);
    setError(null);
    try {
      await removeNote({ noteId: noteId as Id<"sourceNotes"> });
    } catch {
      setError("Failed to remove note.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <StickyNote className="h-4 w-4 text-accent" />
          Notes ({notes.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <Plus className="h-3 w-3" />
          Add Note
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg border border-border p-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y min-h-[80px]"
            placeholder="Write your note about this source..."
            autoFocus
          />
          <input
            type="text"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Tags (comma-separated, optional)"
          />
          <div className="flex gap-2">
            <button
              onClick={addNote}
              disabled={loading || !newNote.trim()}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Note"}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewNote(""); setNewTags(""); }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No notes yet. Add notes to capture your thoughts about this source.</p>
      )}

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border p-3 group">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground flex-1 whitespace-pre-wrap">{note.content}</p>
              <button
                onClick={() => deleteNote(note.id)}
                disabled={removingId === note.id}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {note.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {note.tags.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
