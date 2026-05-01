"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Copy, FileText, Layers3, Loader2, Plus, RefreshCw, StickyNote, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { relevanceClass, relevanceLabel, sourceStatusClass, sourceStatusLabel, sourceTypeLabel } from "@/lib/polis/status";
import type { ContextPack, SourceRelevance } from "@/lib/types";

interface SourceViewerContentProps {
  source: {
    id: string;
    title: string;
    author: string;
    year: number;
    type: string;
    status: string;
    relevance: SourceRelevance;
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
    folderId?: string;
  };
  moduleTitle: string;
  moduleCode: string;
  chunks: Array<{ id: string; text: string; chunkIndex: number }>;
  linkedKnowledgePages: Array<{ id: string; title: string; type: string }>;
  activeContextPack: ContextPack | null;
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

export function SourceViewerContent({ source, moduleTitle, moduleCode, chunks, linkedKnowledgePages, activeContextPack }: SourceViewerContentProps) {
  const router = useRouter();
  const [showChunks, setShowChunks] = useState(false);
  const [summary, setSummary] = useState(source.summary);
  const [argument, setArgument] = useState(source.mainArgument);
  const [concepts, setConcepts] = useState(source.keyConcepts);
  const [relevance, setRelevance] = useState<SourceRelevance>(source.relevance || "unknown");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const sourceBrief = linkedKnowledgePages.find((page) => page.type === "source_brief");

  async function regenerateSummary() {
    setLoading("summary");
    setMessage("");
    try {
      const res = await fetch(`/api/sources/${source.id}/analyse`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setSummary(data.analysis.summary || "");
      setArgument(data.analysis.keyArguments || "");
      setConcepts(data.analysis.concepts ? data.analysis.concepts.split(",").map((concept: string) => concept.trim()).filter(Boolean) : []);
      setMessage("Source analysis saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(null);
    }
  }

  async function createSourceBrief() {
    setLoading("brief");
    setMessage("");
    try {
      await postPolis("createSourceBrief", { sourceId: source.id });
      router.push(`/modules/${source.moduleId}?section=knowledge`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create source brief");
    } finally {
      setLoading(null);
    }
  }

  async function saveRelevance(value: SourceRelevance) {
    setRelevance(value);
    setLoading("relevance");
    setMessage("");
    try {
      await postPolis("updateSource", { sourceId: source.id, relevance: value });
      setMessage("Relevance saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save relevance");
    } finally {
      setLoading(null);
    }
  }

  async function addToContextPack() {
    if (!activeContextPack) return;
    setLoading("context");
    setMessage("");
    try {
      await postPolis("updateContextPack", {
        contextPackId: activeContextPack.id,
        selectedSourceIds: Array.from(new Set([...activeContextPack.selectedSourceIds, source.id])),
      });
      setMessage("Added to active context pack");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update context pack");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Link href={`/modules/${source.moduleId}?section=sources`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to module sources
      </Link>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">{sourceTypeLabel(source.type)}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sourceStatusClass(source.status))}>{sourceStatusLabel(source.status)}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", relevanceClass(relevance))}>{relevanceLabel(relevance)}</span>
          <span className="text-xs text-muted-foreground">{moduleTitle} · {moduleCode}</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{source.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{source.author} {source.year ? `(${source.year})` : ""} · {source.pageCount} estimated pages</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">{source.citation || "No citation saved yet."}</div>
          {source.citation && (
            <button onClick={() => navigator.clipboard.writeText(source.citation)} className="rounded-lg border border-border p-2 hover:bg-muted" title="Copy citation">
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {source.errorMessage && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{source.errorMessage}</div>}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {source.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-accent" />Summary</h2>
            <button onClick={regenerateSummary} disabled={loading === "summary"} className="inline-flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50">
              {loading === "summary" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {summary ? "Regenerate" : "Generate"}
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{summary || "No summary available yet."}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-accent" />Core argument</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{argument || "No core argument extracted yet."}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Layers3 className="h-4 w-4 text-accent" />Linked knowledge</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {linkedKnowledgePages.map((page) => (
            <Link key={page.id} href={`/modules/${source.moduleId}?section=knowledge`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">{page.title}</Link>
          ))}
          {linkedKnowledgePages.length === 0 && <p className="text-sm text-muted-foreground">No linked knowledge pages yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Source actions</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {sourceBrief ? (
            <Link href={`/modules/${source.moduleId}?section=knowledge`} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Open Source Brief</Link>
          ) : (
            <button onClick={createSourceBrief} disabled={loading === "brief"} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {loading === "brief" && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Source Brief
            </button>
          )}
          {activeContextPack && !activeContextPack.selectedSourceIds.includes(source.id) && (
            <button onClick={addToContextPack} disabled={loading === "context"} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">Add to Context Pack</button>
          )}
          <select value={relevance} onChange={(e) => saveRelevance(e.target.value as SourceRelevance)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {(["unknown", "low", "medium", "high"] as SourceRelevance[]).map((item) => <option key={item} value={item}>{relevanceLabel(item)}</option>)}
          </select>
        </div>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Key concepts</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {concepts.map((concept) => <span key={concept} className="rounded-lg border border-border px-3 py-1.5 text-sm">{concept}</span>)}
          {concepts.length === 0 && <p className="text-sm text-muted-foreground">No concepts extracted yet.</p>}
        </div>
      </section>

      {chunks.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Extracted text ({chunks.length} chunks)</h2>
            <button onClick={() => setShowChunks(!showChunks)} className="text-xs text-accent hover:underline">{showChunks ? "Hide chunks" : "Show chunks"}</button>
          </div>
          {showChunks && (
            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Chunk {chunk.chunkIndex + 1}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{chunk.text.slice(0, 900)}{chunk.text.length > 900 ? "..." : ""}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <SourceNotesSection sourceId={source.id} />
    </div>
  );
}

function SourceNotesSection({ sourceId }: { sourceId: string }) {
  const [notes, setNotes] = useState<Array<{ id: string; content: string; tags: string | null; createdAt: string }>>([]);
  const [newNote, setNewNote] = useState("");
  const [newTags, setNewTags] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/sources/${sourceId}/notes`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setNotes(data); })
      .catch(() => {});
  }, [sourceId]);

  async function addNote() {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sources/${sourceId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote, tags: newTags || null }),
      });
      const note = await res.json();
      if (res.ok) {
        setNotes([note, ...notes]);
        setNewNote("");
        setNewTags("");
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    setNotes(notes.filter((note) => note.id !== noteId));
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="h-4 w-4 text-accent" />Notes ({notes.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1 text-xs text-accent hover:underline"><Plus className="h-3 w-3" />Add note</button>
      </div>
      {showForm && (
        <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
          <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Write a note about this source." />
          <input value={newTags} onChange={(e) => setNewTags(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Tags, comma-separated" />
          <div className="flex gap-2">
            <button onClick={addNote} disabled={loading || !newNote.trim()} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">{loading ? "Saving..." : "Save note"}</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="group rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
              <button onClick={() => deleteNote(note.id)} className="opacity-0 text-muted-foreground transition-opacity hover:text-red-600 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            {note.tags && <p className="mt-2 text-xs text-muted-foreground">{note.tags}</p>}
          </div>
        ))}
        {notes.length === 0 && !showForm && <p className="text-sm text-muted-foreground">No notes yet. Add source-specific notes here; broader concepts belong in Knowledge.</p>}
      </div>
    </section>
  );
}
