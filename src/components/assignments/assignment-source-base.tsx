"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Presentation,
  ScrollText,
  ClipboardList,
  Search,
  CheckCircle2,
  Circle,
  AlertCircle,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceFile, SourceType } from "@/lib/types";

const SOURCE_TYPE_META: Record<
  SourceType,
  { label: string; icon: React.ElementType; group: "reading" | "brief" | "lecture" | "other" }
> = {
  journal_article: { label: "Journal Article", icon: FileText, group: "reading" },
  book_chapter: { label: "Book Chapter", icon: BookOpen, group: "reading" },
  book: { label: "Book", icon: BookOpen, group: "reading" },
  report: { label: "Report", icon: ScrollText, group: "reading" },
  news_article: { label: "News Article", icon: FileText, group: "reading" },
  lecture_slides: { label: "Lecture Slides", icon: Presentation, group: "lecture" },
  seminar_notes: { label: "Seminar Notes", icon: Presentation, group: "lecture" },
  module_handbook: { label: "Module Handbook", icon: GraduationCap, group: "brief" },
  assignment_brief: { label: "Assignment Brief", icon: ClipboardList, group: "brief" },
  marking_rubric: { label: "Marking Rubric", icon: ClipboardList, group: "brief" },
  draft: { label: "Draft", icon: FileText, group: "other" },
};

const GROUP_LABELS: Record<string, string> = {
  reading: "Readings",
  brief: "Brief & Rubric",
  lecture: "Lecture Material",
  other: "Other",
};

type RelevanceLevel = "high" | "medium" | "low";

const RELEVANCE_META: Record<RelevanceLevel, { label: string; colour: string }> = {
  high: { label: "High relevance", colour: "text-success" },
  medium: { label: "Medium relevance", colour: "text-warning" },
  low: { label: "Low relevance", colour: "text-muted-foreground" },
};

function inferRelevance(source: SourceFile, selectedIds: string[]): RelevanceLevel {
  if (!selectedIds.includes(source.id)) return "low";
  if (source.type === "assignment_brief" || source.type === "marking_rubric") return "high";
  if (source.type === "journal_article" || source.type === "book_chapter" || source.type === "book") return "high";
  if (source.type === "lecture_slides" || source.type === "seminar_notes") return "medium";
  return "medium";
}

interface SourceCardProps {
  source: SourceFile;
  isSelected: boolean;
  relevance: RelevanceLevel;
  onToggle: (id: string) => void;
}

function SourceCard({ source, isSelected, relevance, onToggle }: SourceCardProps) {
  const meta = SOURCE_TYPE_META[source.type] ?? SOURCE_TYPE_META["journal_article"];
  const Icon = meta.icon;
  const rel = RELEVANCE_META[relevance];

  return (
    <button
      id={`source-card-${source.id}`}
      onClick={() => onToggle(source.id)}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-150 group",
        isSelected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border bg-card hover:border-foreground/30 hover:bg-card-hover"
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{source.title}</p>
            {isSelected ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 flex-shrink-0 text-border mt-0.5 group-hover:text-muted-foreground" />
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {source.author} · {source.year}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Tag className="h-2.5 w-2.5" />
              {meta.label}
            </span>
            {isSelected && (
              <span className={cn("text-xs font-medium", rel.colour)}>{rel.label}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyGroup({ groupLabel }: { groupLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center">
      <p className="text-sm text-muted-foreground">No {groupLabel.toLowerCase()} added yet.</p>
    </div>
  );
}

interface AssignmentSourceBaseProps {
  allModuleSources: SourceFile[];
  initialSelectedIds: string[];
  readOnly?: boolean;
  assignmentId?: string;
}

export function AssignmentSourceBase({
  allModuleSources,
  initialSelectedIds,
  readOnly = false,
  assignmentId,
}: AssignmentSourceBaseProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [filter, setFilter] = useState("");

  const addSource = useMutation(api.assignments.addSource);
  const removeSource = useMutation(api.assignments.removeSource);

  const toggle = (id: string) => {
    if (readOnly) return;
    const isSelected = selectedIds.includes(id);
    setSelectedIds((prev) =>
      isSelected ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (assignmentId) {
      if (isSelected) {
        removeSource({
          assignmentId: assignmentId as Id<"assignments">,
          sourceId: id as Id<"sources">,
        }).catch(() => {
          setSelectedIds((prev) => [...prev, id]);
        });
      } else {
        addSource({
          assignmentId: assignmentId as Id<"assignments">,
          sourceId: id as Id<"sources">,
        }).catch(() => {
          setSelectedIds((prev) => prev.filter((x) => x !== id));
        });
      }
    }
  };

  const filtered = allModuleSources.filter(
    (s) =>
      s.title.toLowerCase().includes(filter.toLowerCase()) ||
      s.author.toLowerCase().includes(filter.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  );

  const groups = ["brief", "reading", "lecture", "other"] as const;

  const groupedSources = groups.reduce<Record<string, SourceFile[]>>(
    (acc, g) => {
      acc[g] = filtered.filter((s) => (SOURCE_TYPE_META[s.type]?.group ?? "other") === g);
      return acc;
    },
    { brief: [], reading: [], lecture: [], other: [] }
  );

  const selectedCount = selectedIds.length;
  const selectedSources = allModuleSources.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {selectedCount} source{selectedCount !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedSources.filter((s) => s.type === "assignment_brief" || s.type === "marking_rubric").length > 0
              ? "Brief and rubric included"
              : "⚠ No brief or rubric selected — add them for the best guidance"}
          </p>
        </div>

        {selectedCount === 0 && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Select at least one source to proceed</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id="source-search"
          type="text"
          placeholder="Search sources by title, author, or tag…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>

      {/* Grouped source lists */}
      {groups.map((group) => {
        const sources = groupedSources[group];
        if (sources.length === 0 && filter) return null;
        return (
          <div key={group}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {GROUP_LABELS[group]}
            </h3>
            {sources.length === 0 ? (
              <EmptyGroup groupLabel={GROUP_LABELS[group]} />
            ) : (
              <div className="space-y-2">
                {sources.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    isSelected={selectedIds.includes(source.id)}
                    relevance={inferRelevance(source, selectedIds)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
