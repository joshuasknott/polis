"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Lightbulb,
  Wand2,
  RotateCcw,
  X,
  Link2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Assignment,
  Module,
  Argument,
  EvidenceLink,
  Draft,
  SourceFile,
  DraftSegment,
  ProvenanceLabel,
} from "@/lib/types";
import {
  PROVENANCE_LABEL_META,
  PROVENANCE_LABEL_ORDER,
  HARD_TRUTH_RULES,
  computeSegmentWarnings,
  summarizeWarnings,
  studentResponsibilityNote,
  type WarningContext,
} from "@/lib/integrity/draft-provenance";
import {
  ProvenanceBadge,
  ProvenanceWarningList,
  LABEL_ICON,
} from "./provenance-badges";

type SaveStatus = "saved" | "saving" | "unsaved";
type WriteView = "clean" | "annotated";

interface DraftWriteSurfaceProps {
  module: Module;
  assignment: Assignment;
  draft: Draft | undefined;
  initialSegments: DraftSegment[];
  arguments: Argument[];
  sources: SourceFile[];
  assignmentConvexId: string;
  moduleConvexId: string;
  reviewRunId?: string;
}

interface DraftSegmentEditor extends DraftSegment {
  isEditing?: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function inferBlockTypeFromIndex(index: number, total: number): DraftSegment["blockType"] {
  if (index === 0) return "introduction";
  if (index === total - 1) return "conclusion";
  return "body";
}

function buildInitialSegments(
  draft: Draft | undefined,
  existing: DraftSegment[],
  args: Argument[],
  wordLimit: number,
): DraftSegmentEditor[] {
  if (existing.length > 0) {
    return existing
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ ...s }));
  }

  const fallbackContent = draft?.content ?? "";

  if (args.length === 0) {
    return [
      {
        id: `local_intro_${Date.now()}`,
        draftId: draft?.id ?? "",
        blockType: "introduction",
        content: fallbackContent,
        argumentId: null,
        sortOrder: 0,
        label: null,
        sourceId: null,
        sourceChunkId: null,
        evidenceLinkId: null,
        quote: null,
        pageRange: null,
        aiGenerated: false,
      },
      {
        id: `local_body_${Date.now()}`,
        draftId: draft?.id ?? "",
        blockType: "body",
        content: "",
        argumentId: null,
        sortOrder: 1,
        label: null,
        sourceId: null,
        sourceChunkId: null,
        evidenceLinkId: null,
        quote: null,
        pageRange: null,
        aiGenerated: false,
      },
      {
        id: `local_conclusion_${Date.now()}`,
        draftId: draft?.id ?? "",
        blockType: "conclusion",
        content: "",
        argumentId: null,
        sortOrder: 2,
        label: null,
        sourceId: null,
        sourceChunkId: null,
        evidenceLinkId: null,
        quote: null,
        pageRange: null,
        aiGenerated: false,
      },
    ];
  }

  void wordLimit;
  const introTarget = Math.round(wordLimit * 0.12);
  const conclusionTarget = Math.round(wordLimit * 0.12);
  const bodyBudget = Math.max(0, wordLimit - introTarget - conclusionTarget);
  void bodyBudget;

  const paragraphs = fallbackContent ? fallbackContent.split(/\n\n+/) : [];

  const segments: DraftSegmentEditor[] = [
    {
      id: `local_intro_${Date.now()}`,
      draftId: draft?.id ?? "",
      blockType: "introduction",
      content: paragraphs[0] ?? "",
      argumentId: null,
      sortOrder: 0,
      label: null,
      sourceId: null,
      sourceChunkId: null,
      evidenceLinkId: null,
      quote: null,
      pageRange: null,
      aiGenerated: false,
    },
  ];

  args.forEach((arg, i) => {
    segments.push({
      id: `local_arg_${arg.id}_${Date.now()}_${i}`,
      draftId: draft?.id ?? "",
      blockType: "body",
      content: paragraphs[i + 1] ?? "",
      argumentId: arg.id,
      sortOrder: i + 1,
      label: null,
      sourceId: null,
      sourceChunkId: null,
      evidenceLinkId: null,
      quote: null,
      pageRange: null,
      aiGenerated: false,
    });
  });

  segments.push({
    id: `local_conclusion_${Date.now()}`,
    draftId: draft?.id ?? "",
    blockType: "conclusion",
    content: paragraphs[args.length + 1] ?? "",
    argumentId: null,
    sortOrder: args.length + 1,
    label: null,
    sourceId: null,
    sourceChunkId: null,
    evidenceLinkId: null,
    quote: null,
    pageRange: null,
    aiGenerated: false,
  });

  return segments;
}

function blockTypeLabel(blockType: DraftSegment["blockType"]): string {
  const labels: Record<DraftSegment["blockType"], string> = {
    introduction: "Introduction",
    body: "Body",
    conclusion: "Conclusion",
    heading: "Heading",
    quote: "Quote",
    note: "Note",
  };
  return labels[blockType] ?? "Section";
}

function findEvidenceLinkForSegment(
  segment: DraftSegmentEditor,
  args: Argument[],
): EvidenceLink | null {
  if (!segment.argumentId) return null;
  const arg = args.find((a) => a.id === segment.argumentId);
  if (!arg) return null;
  if (segment.evidenceLinkId) {
    const link = arg.evidenceLinks.find((e) => e.id === segment.evidenceLinkId);
    if (link) return link;
  }
  return arg.evidenceLinks[0] ?? null;
}

interface SegmentEditorCardProps {
  segment: DraftSegmentEditor;
  view: WriteView;
  isActive: boolean;
  warnings: ReturnType<typeof computeSegmentWarnings>;
  evidenceLink: EvidenceLink | null;
  sourceLabel: string | null;
  sourcePageLabel: string | null;
  canShowAIPanel: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onRemove: () => void;
  onLabelChange: (label: ProvenanceLabel | null) => void;
  onOpenEvidencePicker: () => void;
  onClearEvidence: () => void;
  onPickFromArgument: (link: EvidenceLink) => void;
  onAICritique: () => void;
  onAIParaphrase: () => void;
}

function SegmentEditorCard({
  segment,
  view,
  isActive,
  warnings,
  evidenceLink,
  sourceLabel,
  sourcePageLabel,
  canShowAIPanel,
  onFocus,
  onChange,
  onRemove,
  onLabelChange,
  onOpenEvidencePicker,
  onClearEvidence,
  onPickFromArgument,
  onAICritique,
  onAIParaphrase,
}: SegmentEditorCardProps) {
  const meta = segment.label ? PROVENANCE_LABEL_META[segment.label] : null;
  const hasContent = segment.content.trim().length > 0;
  const wordCount = countWords(segment.content);
  const argEvidence: EvidenceLink[] = [];

  const showLabelBar = view === "annotated";
  const showAnnotatedBody = view === "annotated";
  const borderClass = meta
    ? `${meta.borderClass} ${meta.bgClass}`
    : isActive
      ? "border-accent/40 bg-card ring-1 ring-accent/10"
      : "border-border bg-card hover:bg-card-hover";

  return (
    <div
      id={`segment-${segment.id}`}
      className={cn(
        "group rounded-xl border transition-all duration-200",
        borderClass,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {blockTypeLabel(segment.blockType)}
        </span>
        {hasContent && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {wordCount} word{wordCount !== 1 ? "s" : ""}
          </span>
        )}
        {meta && showLabelBar && (
          <ProvenanceBadge label={segment.label!} size="sm" />
        )}
        {segment.aiGenerated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-warning">
            <Sparkles className="h-2.5 w-2.5" />
            AI
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onRemove}
            title="Remove segment"
            className="rounded-md p-1 text-muted-foreground/50 hover:text-danger transition-colors"
            aria-label="Remove segment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {view === "clean" ? (
          <textarea
            className="w-full min-h-[100px] resize-none bg-transparent text-sm leading-relaxed font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="Write in your own voice. Use the Annotated view to label provenance."
            value={segment.content}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            rows={5}
          />
        ) : (
          <textarea
            className="w-full min-h-[100px] resize-none bg-transparent text-sm leading-relaxed font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="Write in your own voice. Label this segment with its provenance below."
            value={segment.content}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            rows={5}
          />
        )}

        {showAnnotatedBody && (
          <div className="mt-3 space-y-3 border-t border-dashed border-border pt-3">
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Info className="h-3 w-3" />
                Provenance label
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onLabelChange(null)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                    segment.label === null
                      ? "border-foreground/60 bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  Unlabelled
                </button>
                {PROVENANCE_LABEL_ORDER.map((label) => {
                  const m = PROVENANCE_LABEL_META[label];
                  const Icon = LABEL_ICON[label];
                  const disabled =
                    m.requiresSource && !segment.sourceId && segment.label !== label;
                  return (
                    <button
                      key={label}
                      onClick={() => onLabelChange(label)}
                      title={
                        disabled
                          ? `${m.display} requires a source. Attach evidence first.`
                          : m.description
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                        segment.label === label
                          ? m.badgeClass
                          : "border-border text-muted-foreground hover:text-foreground",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {m.shortDisplay}
                    </button>
                  );
                })}
              </div>
              {meta && (
                <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
                  {meta.description}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  Source reference
                </p>
                {segment.sourceId && (
                  <button
                    onClick={onClearEvidence}
                    className="text-[10px] text-muted-foreground hover:text-danger transition-colors"
                  >
                    Clear reference
                  </button>
                )}
              </div>
              {segment.sourceId && sourceLabel ? (
                <div className="rounded-md border border-border bg-card px-2.5 py-1.5">
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-source" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-foreground">
                        {sourceLabel}
                      </p>
                      {sourcePageLabel && (
                        <p className="text-[10px] text-muted-foreground">
                          {sourcePageLabel}
                        </p>
                      )}
                      {evidenceLink?.quote && (
                        <p className="mt-1 line-clamp-2 text-[10px] italic text-muted-foreground">
                          &ldquo;{evidenceLink.quote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : argEvidence.length === 0 && !segment.argumentId ? (
                <p className="text-[10px] text-muted-foreground italic">
                  No source attached. Label as &ldquo;Interpretation&rdquo;,
                  &ldquo;Unsupported&rdquo;, or attach evidence below.
                </p>
              ) : (
                <button
                  onClick={onOpenEvidencePicker}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Attach source reference
                </button>
              )}
            </div>

            {warnings.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Warnings ({warnings.length})
                </p>
                <ProvenanceWarningList warnings={warnings} max={3} />
              </div>
            )}

            {canShowAIPanel && hasContent && (
              <div className="rounded-md border border-accent/20 bg-accent/5 px-2.5 py-2">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Wand2 className="h-3 w-3" />
                  AI help
                </p>
                <p className="mb-2 text-[10px] text-muted-foreground leading-relaxed">
                  Suggestions appear here. You decide whether to accept them.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={onAICritique}
                    className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-card px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/10 transition-colors"
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Critique
                  </button>
                  <button
                    onClick={onAIParaphrase}
                    className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-card px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/10 transition-colors"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Paraphrase
                  </button>
                </div>
                {evidenceLink && (
                  <button
                    onClick={() => onPickFromArgument(evidenceLink)}
                    className="mt-1.5 block text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Use evidence from &ldquo;{evidenceLink.sourceTitle}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface EvidencePickerModalProps {
  argumentId: string | null;
  evidenceLinks: EvidenceLink[];
  sources: SourceFile[];
  onClose: () => void;
  onPick: (link: EvidenceLink) => void;
}

function EvidencePickerModal({
  argumentId,
  evidenceLinks,
  sources,
  onClose,
  onPick,
}: EvidencePickerModalProps) {
  const [filter, setFilter] = useState("");
  const filteredSources = sources.filter(
    (s) =>
      filter === "" ||
      s.title.toLowerCase().includes(filter.toLowerCase()) ||
      s.author.toLowerCase().includes(filter.toLowerCase()),
  );
  const filteredLinks = evidenceLinks.filter(
    (l) =>
      filter === "" ||
      l.sourceTitle.toLowerCase().includes(filter.toLowerCase()) ||
      l.quote.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Attach source reference
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            From this argument&apos;s evidence
          </p>
          {evidenceLinks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              No evidence is linked to this argument yet. Add evidence from the
              Evidence Map tab.
            </p>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-thin">
              {filteredLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onPick(link)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-xs hover:border-accent/40 hover:bg-accent/5 transition-colors"
                >
                  <p className="font-medium text-foreground">{link.sourceTitle}</p>
                  {link.quote && (
                    <p className="mt-0.5 line-clamp-2 italic text-muted-foreground">
                      &ldquo;{link.quote}&rdquo;
                    </p>
                  )}
                  {link.pageRange && (
                    <p className="mt-0.5 text-[10px] text-source">{link.pageRange}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            From any source in this assignment
          </p>
          <input
            type="text"
            placeholder="Search sources…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <div className="max-h-48 space-y-1 overflow-y-auto scrollbar-thin">
            {filteredSources.map((source) => (
              <button
                key={source.id}
                onClick={() =>
                  onPick({
                    id: `adhare_${source.id}`,
                    argumentId: argumentId ?? "",
                    sourceId: source.id,
                    sourceTitle: source.title,
                    quote: "",
                    pageRange: "",
                    usage: "",
                    strength: "moderate",
                  })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-left text-xs hover:border-accent/40 hover:bg-accent/5 transition-colors"
              >
                <p className="font-medium text-foreground">{source.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {source.author}
                  {source.year ? ` · ${source.year}` : ""}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-b-2xl border-t border-border bg-muted/20 px-5 py-2.5">
          <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
            Only sources you have uploaded and selected for this assignment may
            back a citation. Catalog recommendations do not count as evidence.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DraftWriteSurface({
  module,
  assignment,
  draft,
  initialSegments,
  arguments: args,
  sources,
  assignmentConvexId,
  reviewRunId,
}: DraftWriteSurfaceProps) {
  const router = useRouter();
  const createDraft = useMutation(api.drafts.create);
  const saveDraftMutation = useMutation(api.drafts.saveDraft);
  const updateStage = useMutation(api.assignments.updateStage);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [view, setView] = useState<WriteView>("annotated");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [pickerSegmentId, setPickerSegmentId] = useState<string | null>(null);
  const [showHardTruth, setShowHardTruth] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialEditorSegments = useMemo(
    () => buildInitialSegments(draft, initialSegments, args, assignment.wordLimit ?? 2000),
    [draft, initialSegments, args, assignment.wordLimit],
  );
  const [segments, setSegments] = useState<DraftSegmentEditor[]>(initialEditorSegments);

  const reviewFindings = useQuery(
    api.reviews.listFindings,
    reviewRunId ? { reviewRunId: reviewRunId as Id<"reviewRuns"> } : "skip",
  );

  const evidenceByArgument = useMemo(() => {
    const map = new Map<string, EvidenceLink[]>();
    args.forEach((arg) => map.set(arg.id, arg.evidenceLinks));
    return map;
  }, [args]);

  const sourceMap = useMemo(() => {
    const map = new Map<string, SourceFile>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const warningContext: WarningContext = useMemo(
    () => ({
      selectedSourceIds: assignment.selectedSourceIds,
      sourceIdsInModule: sources.map((s) => s.id),
      chunksBySourceId: new Map(),
    }),
    [assignment.selectedSourceIds, sources],
  );

  const segmentsWithWarnings = useMemo(
    () =>
      segments.map((s) => ({
        segment: s,
        warnings: computeSegmentWarnings(s, warningContext),
      })),
    [segments, warningContext],
  );

  const summary = useMemo(
    () =>
      summarizeWarnings(
        segments,
        warningContext,
      ),
    [segments, warningContext],
  );

  const totalWords = useMemo(
    () => segments.reduce((sum, s) => sum + countWords(s.content), 0),
    [segments],
  );
  const wordLimit = assignment.wordLimit ?? 2000;
  const totalRatio = wordLimit > 0 ? totalWords / wordLimit : 0;

  const performSave = useCallback(
    async (segmentsToSave: DraftSegmentEditor[]) => {
      if (!draft) return;
      setSaveStatus("saving");

      const content = segmentsToSave
        .map((s) => s.content)
        .join("\n\n");
      const wordCount = segmentsToSave.reduce(
        (sum, s) => sum + countWords(s.content),
        0,
      );

      try {
        await saveDraftMutation({
          draftId: draft.id as Id<"drafts">,
          content,
          wordCount,
          sections: segmentsToSave.map((s, i) => ({
            blockType: s.blockType,
            content: s.content,
            argumentId: s.argumentId ? (s.argumentId as Id<"arguments">) : undefined,
            sortOrder: i,
            label: s.label ?? undefined,
            sourceId: s.sourceId ? (s.sourceId as Id<"sources">) : undefined,
            sourceChunkId: s.sourceChunkId
              ? (s.sourceChunkId as Id<"sourceChunks">)
              : undefined,
            evidenceLinkId: s.evidenceLinkId
              ? (s.evidenceLinkId as Id<"evidenceLinks">)
              : undefined,
            quote: s.quote ?? undefined,
            pageRange: s.pageRange ?? undefined,
            aiGenerated: s.aiGenerated || undefined,
          })),
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [draft, saveDraftMutation],
  );

  const debouncedSave = useCallback(
    (next: DraftSegmentEditor[]) => {
      setSaveStatus("unsaved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        performSave(next);
      }, 2500);
    },
    [performSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const updateSegment = useCallback(
    (id: string, patch: Partial<DraftSegmentEditor>) => {
      setSegments((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave],
  );

  const handleContentChange = useCallback(
    (id: string, content: string) => updateSegment(id, { content }),
    [updateSegment],
  );

  const handleLabelChange = useCallback(
    (id: string, label: ProvenanceLabel | null) => {
      const segment = segments.find((s) => s.id === id);
      if (!segment) return;
      const meta = label ? PROVENANCE_LABEL_META[label] : null;
      if (meta?.requiresSource && !segment.sourceId) return;
      updateSegment(id, { label });
    },
    [segments, updateSegment],
  );

  const handleAttachEvidence = useCallback(
    (id: string, link: EvidenceLink) => {
      updateSegment(id, {
        sourceId: link.sourceId,
        evidenceLinkId: link.id.startsWith("adhare_") ? null : link.id,
        sourceChunkId: null,
        quote: link.quote || null,
        pageRange: link.pageRange || null,
        label:
          segments.find((s) => s.id === id)?.label ??
          (link.quote && link.quote.trim().length > 0 ? "quoted" : "source_supported"),
      });
    },
    [segments, updateSegment],
  );

  const handleClearEvidence = useCallback(
    (id: string) => {
      const segment = segments.find((s) => s.id === id);
      if (!segment) return;
      const meta = segment.label ? PROVENANCE_LABEL_META[segment.label] : null;
      const nextLabel =
        meta?.requiresSource || segment.label === "quoted"
          ? (null as ProvenanceLabel | null)
          : segment.label;
      updateSegment(id, {
        sourceId: null,
        sourceChunkId: null,
        evidenceLinkId: null,
        quote: null,
        pageRange: null,
        label: nextLabel,
      });
    },
    [segments, updateSegment],
  );

  const handleAddSegment = useCallback(() => {
    setSegments((prev) => {
      const newIndex = prev.length;
      const segment: DraftSegmentEditor = {
        id: `local_new_${Date.now()}`,
        draftId: draft?.id ?? "",
        blockType: inferBlockTypeFromIndex(newIndex, prev.length + 1),
        content: "",
        argumentId: null,
        sortOrder: newIndex,
        label: null,
        sourceId: null,
        sourceChunkId: null,
        evidenceLinkId: null,
        quote: null,
        pageRange: null,
        aiGenerated: false,
      };
      const next = [...prev, segment];
      debouncedSave(next);
      return next;
    });
  }, [draft, debouncedSave]);

  const handleRemoveSegment = useCallback(
    (id: string) => {
      setSegments((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((s) => s.id !== id);
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave],
  );

  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    performSave(segments);
  }, [performSave, segments]);

  const handleNavigateToReview = useCallback(async () => {
    if (!draft) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await performSave(segments);
    await updateStage({
      assignmentId: assignmentConvexId as Id<"assignments">,
      stage: "refine",
    });
    router.push(
      `/modules/${module.id}/assignments/${assignment.id}?tab=review`,
    );
  }, [
    draft,
    performSave,
    segments,
    updateStage,
    assignmentConvexId,
    router,
    module.id,
    assignment.id,
  ]);

  const handleCreateDraft = useCallback(async () => {
    setCreatingDraft(true);
    try {
      await createDraft({
        assignmentId: assignmentConvexId as Id<"assignments">,
      });
    } finally {
      setCreatingDraft(false);
    }
  }, [createDraft, assignmentConvexId]);

  const openEvidencePicker = useCallback((segmentId: string) => {
    setPickerSegmentId(segmentId);
  }, []);

  const closePicker = useCallback(() => setPickerSegmentId(null), []);

  const handlePickFromArgument = useCallback(
    (segmentId: string, link: EvidenceLink) => {
      handleAttachEvidence(segmentId, link);
      setPickerSegmentId(null);
    },
    [handleAttachEvidence],
  );

  const triggerAICritique = useCallback(() => {
    router.push(
      `/modules/${module.id}/assignments/${assignment.id}?tab=write&cothinker=critique`,
    );
  }, [router, module.id, assignment.id]);

  const triggerAIParaphrase = useCallback(() => {
    router.push(
      `/modules/${module.id}/assignments/${assignment.id}?tab=write&cothinker=paraphrase`,
    );
  }, [router, module.id, assignment.id]);

  if (!draft && !creatingDraft) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <FileText className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          Start your living draft
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Create a single, evolving draft for this assessment. Compose in your own
          voice, label each passage with its provenance, and let Polis surface
          warnings without writing the submission for you.
        </p>
        <button
          onClick={handleCreateDraft}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Create draft
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-muted-foreground">Creating draft…</p>
        </div>
      </div>
    );
  }

  const pickerSegment = pickerSegmentId
    ? segments.find((s) => s.id === pickerSegmentId) ?? null
    : null;
  const pickerArgumentId = pickerSegment?.argumentId ?? null;
  const pickerEvidenceLinks = pickerArgumentId
    ? evidenceByArgument.get(pickerArgumentId) ?? []
    : [];

  const citationSafetyFindings = (reviewFindings ?? []).filter(
    (f) => f.category === "unsupported_claim" || f.category === "missing_evidence",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{module.code}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{assignment.title}</span>
            <ChevronRight className="h-3 w-3" />
            <span>Draft v{draft.version}</span>
          </div>
          <p className="font-serif text-sm italic leading-relaxed text-foreground/80">
            &ldquo;{assignment.question}&rdquo;
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                saveStatus === "saving"
                  ? "border-accent/30 bg-accent/5 text-accent"
                  : saveStatus === "unsaved"
                    ? "border-warning/30 bg-warning/5 text-warning"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saveStatus === "unsaved" ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "unsaved"
                  ? "Unsaved"
                  : "Saved"}
            </button>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              v{draft.version}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  totalRatio > 1.1
                    ? "text-danger"
                    : totalRatio > 0.9
                      ? "text-success"
                      : "text-foreground",
                )}
              >
                {totalWords.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                / {wordLimit.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  totalRatio > 1.1
                    ? "bg-danger"
                    : totalRatio > 0.9
                      ? "bg-success"
                      : "bg-accent/60",
                )}
                style={{ width: `${Math.min(totalRatio * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          <button
            onClick={() => setView("clean")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "clean"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={view === "clean"}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Clean
          </button>
          <button
            onClick={() => setView("annotated")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "annotated"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={view === "annotated"}
          >
            <Eye className="h-3.5 w-3.5" />
            Annotated
          </button>
        </div>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="uppercase tracking-wider">Labels:</span>
          {PROVENANCE_LABEL_ORDER.map((label) => {
            const count = summary.labelCounts[label];
            const m = PROVENANCE_LABEL_META[label];
            const Icon = LABEL_ICON[label];
            return (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"
                title={m.description}
              >
                <Icon className={cn("h-2.5 w-2.5", m.textClass)} />
                <span className="font-medium">{m.shortDisplay}</span>
                <span className="tabular-nums text-muted-foreground">{count}</span>
              </span>
            );
          })}
        </div>

        <button
          onClick={() => setShowHardTruth((s) => !s)}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ShieldCheck className="h-3 w-3" />
          {showHardTruth ? "Hide" : "Show"} hard truths
        </button>
      </div>

      {showHardTruth && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-warning" />
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">
              Hard-truth rules
            </p>
          </div>
          <ul className="space-y-1.5">
            {HARD_TRUTH_RULES.map((rule, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[11px] text-foreground/80"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {rule}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-warning/20 pt-2 text-[10px] italic text-muted-foreground">
            {studentResponsibilityNote()}
          </p>
        </div>
      )}

      {summary.topWarnings.length > 0 && view === "annotated" && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
              <AlertTriangle className="h-4 w-4" />
              Citation validator
              <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-medium text-warning">
                {summary.bySeverity.warning + summary.bySeverity.critical} flagged
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Warnings are advisory — your text is preserved.
            </p>
          </div>
          <ProvenanceWarningList warnings={summary.topWarnings} max={5} />
        </div>
      )}

      {citationSafetyFindings.length > 0 && view === "annotated" && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
            <ShieldCheck className="h-4 w-4" />
            Citation safety findings ({citationSafetyFindings.length})
          </p>
          <ul className="space-y-1.5">
            {citationSafetyFindings.slice(0, 5).map((f) => (
              <li
                key={f._id}
                className="flex items-start gap-2 text-[11px] text-foreground/80"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                {f.content}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] italic text-muted-foreground">
            Open the Review tab to resolve findings and re-run the citation
            safety check.
          </p>
        </div>
      )}

      {view === "annotated" && (
        <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Compose in your voice. Label each passage.
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              The Clean view hides labels for reading. The Annotated view shows
              provenance, source references, and warnings. Polis surfaces risks
              — it does not write the submission.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {segmentsWithWarnings.map(({ segment, warnings }) => {
          const evidenceLink = findEvidenceLinkForSegment(segment, args);
          const sourceLabel = segment.sourceId
            ? sourceMap.get(segment.sourceId)?.title ??
              sourceMap.get(segment.sourceId)?.author ??
              "Unknown source"
            : null;
          const sourcePageLabel = segment.pageRange ?? evidenceLink?.pageRange ?? null;
          return (
            <SegmentEditorCard
              key={segment.id}
              segment={segment}
              view={view}
              isActive={segment.id === activeSegmentId}
              warnings={warnings}
              evidenceLink={evidenceLink}
              sourceLabel={sourceLabel}
              sourcePageLabel={sourcePageLabel}
              canShowAIPanel
              onFocus={() => setActiveSegmentId(segment.id)}
              onChange={(content) => handleContentChange(segment.id, content)}
              onRemove={() => handleRemoveSegment(segment.id)}
              onLabelChange={(label) => handleLabelChange(segment.id, label)}
              onOpenEvidencePicker={() => openEvidencePicker(segment.id)}
              onClearEvidence={() => handleClearEvidence(segment.id)}
              onPickFromArgument={(link) => handleAttachEvidence(segment.id, link)}
              onAICritique={triggerAICritique}
              onAIParaphrase={triggerAIParaphrase}
            />
          );
        })}

        <button
          onClick={handleAddSegment}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/50 py-2.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add segment
        </button>
      </div>

      {args.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Source coverage
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources
              .filter((s) => assignment.selectedSourceIds.includes(s.id))
              .map((source) => {
                const used = segments.some((seg) => seg.sourceId === source.id);
                return (
                  <span
                    key={source.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      used
                        ? "border-source/30 bg-source/5 text-source"
                        : "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {used ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {source.author}
                    {source.year ? ` (${source.year})` : ""}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-5 py-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Lightbulb className="h-4 w-4 text-accent" />
            Ready for review?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Run the citation validator and rubric alignment check in the Review tab.
          </p>
        </div>
        <button
          onClick={handleNavigateToReview}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Review
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {pickerSegment && (
        <EvidencePickerModal
          argumentId={pickerArgumentId}
          evidenceLinks={pickerEvidenceLinks}
          sources={sources.filter((s) =>
            assignment.selectedSourceIds.includes(s.id),
          )}
          onClose={closePicker}
          onPick={(link) => handlePickFromArgument(pickerSegment.id, link)}
        />
      )}
    </div>
  );
}
