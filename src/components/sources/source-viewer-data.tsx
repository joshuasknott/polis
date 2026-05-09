"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { mapSource } from "@/lib/convex-ui-mappers";
import { SourceViewerContent } from "./source-viewer-content";

interface SourceViewerDataProps {
  sourceId: string;
}

export function SourceViewerData({ sourceId }: SourceViewerDataProps) {
  const source = useQuery(api.sources.get, {
    sourceId: sourceId as Id<"sources">,
  });
  const chunks = useQuery(api.sources.listChunks, {
    sourceId: sourceId as Id<"sources">,
  });
  const notes = useQuery(api.notes.listForSource, {
    sourceId: sourceId as Id<"sources">,
  });
  const moduleInfo = useQuery(
    api.modules.get,
    source ? { moduleId: source.moduleId } : "skip",
  );

  if (
    source === undefined ||
    chunks === undefined ||
    notes === undefined ||
    (source !== null && moduleInfo === undefined)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading source…</p>
      </div>
    );
  }

  if (source === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm font-medium">Source not found.</p>
        <p className="text-xs">It may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const mappedSource = mapSource(source);

  return (
    <SourceViewerContent
      source={{
        ...mappedSource,
        extractedText: "",
        errorMessage: "",
      }}
      moduleTitle={moduleInfo?.title ?? ""}
      moduleCode={moduleInfo?.code ?? ""}
      backHref={moduleInfo ? `/modules/${moduleInfo._id}?tab=readings` : "/sources"}
      backLabel={moduleInfo ? "Back to Module Readings" : "Back to Sources"}
      chunks={chunks.map((chunk) => ({
        id: chunk._id,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
      }))}
      notes={notes.map((note) => ({
        id: note._id,
        content: note.content,
        tags: note.tags ?? [],
        createdAt: new Date(note.createdAt).toISOString(),
      }))}
    />
  );
}
