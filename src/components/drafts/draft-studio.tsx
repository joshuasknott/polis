"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FileText,
  BookOpen,
  AlignLeft,
  ChevronRight,
  Quote,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Assignment,
  Module,
  Argument,
  EvidenceLink,
  Draft,
  SourceFile,
} from "@/lib/types";

interface DraftSection {
  id: string;
  heading: string;
  content: string;
  argumentId: string | null;
  wordTarget: number;
}

interface DraftStudioProps {
  module: Module;
  assignment: Assignment;
  draft: Draft;
  arguments: Argument[];
  sources: SourceFile[];
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function buildInitialSections(
  draft: Draft,
  args: Argument[],
  wordLimit: number
): DraftSection[] {
  if (args.length === 0) {
    return [
      {
        id: "sec_intro",
        heading: "Introduction",
        content: "",
        argumentId: null,
        wordTarget: Math.round(wordLimit * 0.15),
      },
      {
        id: "sec_body",
        heading: "Main Argument",
        content: draft.content || "",
        argumentId: null,
        wordTarget: Math.round(wordLimit * 0.7),
      },
      {
        id: "sec_conclusion",
        heading: "Conclusion",
        content: "",
        argumentId: null,
        wordTarget: Math.round(wordLimit * 0.15),
      },
    ];
  }

  const introTarget = Math.round(wordLimit * 0.12);
  const conclusionTarget = Math.round(wordLimit * 0.12);
  const bodyBudget = wordLimit - introTarget - conclusionTarget;
  const perArg = Math.round(bodyBudget / args.length);

  const draftParagraphs = draft.content
    ? draft.content.split(/\n\n+/)
    : [];

  const sections: DraftSection[] = [
    {
      id: "sec_intro",
      heading: "Introduction",
      content: draftParagraphs[0] || "",
      argumentId: null,
      wordTarget: introTarget,
    },
  ];

  args.forEach((arg, i) => {
    sections.push({
      id: `sec_arg_${arg.id}`,
      heading: arg.claim.length > 80 ? arg.claim.slice(0, 77) + "…" : arg.claim,
      content: draftParagraphs[i + 1] || "",
      argumentId: arg.id,
      wordTarget: perArg,
    });
  });

  sections.push({
    id: "sec_conclusion",
    heading: "Conclusion",
    content: draftParagraphs[args.length + 1] || "",
    argumentId: null,
    wordTarget: conclusionTarget,
  });

  return sections;
}

function EvidenceCard({ evidence }: { evidence: EvidenceLink }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-source/50">
      <div className="flex items-start gap-2 mb-2">
        <Quote className="h-3.5 w-3.5 text-source mt-0.5 shrink-0" />
        <p className="text-foreground/90 italic leading-relaxed line-clamp-3">
          &ldquo;{evidence.quote}&rdquo;
        </p>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {evidence.sourceTitle}
        </span>
        <span className="text-xs font-medium text-source">
          {evidence.pageRange}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            evidence.strength === "strong"
              ? "bg-success/10 text-success"
              : evidence.strength === "moderate"
                ? "bg-warning/10 text-warning"
                : "bg-danger/10 text-danger"
          )}
        >
          {evidence.strength}
        </span>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  isActive,
  onFocus,
  onChange,
  evidence,
}: {
  section: DraftSection;
  isActive: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  evidence: EvidenceLink[];
}) {
  const words = countWords(section.content);
  const ratio = section.wordTarget > 0 ? words / section.wordTarget : 0;
  const overBudget = ratio > 1.15;
  const nearTarget = ratio >= 0.85 && ratio <= 1.15;

  return (
    <div
      className={cn(
        "group rounded-xl border transition-all duration-200",
        isActive
          ? "border-accent/40 bg-card shadow-sm ring-1 ring-accent/10"
          : "border-border bg-card/60 hover:border-border hover:bg-card"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
        <h3 className="text-sm font-semibold text-foreground flex-1 truncate">
          {section.heading}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              overBudget
                ? "text-danger"
                : nearTarget
                  ? "text-success"
                  : "text-muted-foreground"
            )}
          >
            {words} / {section.wordTarget}
          </span>
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                overBudget
                  ? "bg-danger"
                  : nearTarget
                    ? "bg-success"
                    : "bg-accent/50"
              )}
              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <textarea
          className="w-full min-h-[120px] resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-serif"
          placeholder={`Write your ${section.heading.toLowerCase()} here. Build from your argument map and evidence…`}
          value={section.content}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          rows={6}
        />

        {evidence.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3 w-3 text-source" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-source">
                Linked evidence
              </span>
            </div>
            <div className="grid gap-2">
              {evidence.map((ev) => (
                <EvidenceCard key={ev.id} evidence={ev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DraftStudio({
  module,
  assignment,
  draft,
  arguments: args,
  sources,
}: DraftStudioProps) {
  const initialSections = useMemo(
    () => buildInitialSections(draft, args, assignment.wordLimit ?? 2000),
    [draft, args, assignment.wordLimit]
  );

  const [sections, setSections] = useState<DraftSection[]>(initialSections);
  const [activeSection, setActiveSection] = useState<string>(
    initialSections[0]?.id || ""
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const totalWords = useMemo(
    () => sections.reduce((sum, s) => sum + countWords(s.content), 0),
    [sections]
  );

  const wordLimit = assignment.wordLimit ?? 2000;
  const totalRatio = wordLimit > 0 ? totalWords / wordLimit : 0;

  const handleSectionChange = useCallback(
    (sectionId: string, content: string) => {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, content } : s))
      );
    },
    []
  );

  const evidenceByArgument = useMemo(() => {
    const map = new Map<string, EvidenceLink[]>();
    args.forEach((arg) => {
      map.set(arg.id, arg.evidenceLinks);
    });
    return map;
  }, [args]);



  return (
    <div className="flex flex-col gap-6">
      {/* Assignment context header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{module.code}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{assignment.title}</span>
          </div>
          <p className="text-sm text-foreground/80 font-serif italic leading-relaxed">
            &ldquo;{assignment.question}&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  totalRatio > 1.1
                    ? "text-danger"
                    : totalRatio > 0.9
                      ? "text-success"
                      : "text-foreground"
                )}
              >
                {totalWords.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                / {wordLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-32 h-2 rounded-full bg-muted mt-1.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  totalRatio > 1.1
                    ? "bg-danger"
                    : totalRatio > 0.9
                      ? "bg-success"
                      : "bg-accent/60"
                )}
                style={{ width: `${Math.min(totalRatio * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drafting integrity notice */}
      <div className="flex items-start gap-3 rounded-lg bg-muted/60 border border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">Staged drafting</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Build your submission section by section using your argument map and
            evidence links. Polis helps you compose — it does not generate text
            for submission.
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Section navigation sidebar */}
        <div
          className={cn(
            "shrink-0 transition-all duration-200",
            sidebarOpen ? "w-56" : "w-0 overflow-hidden"
          )}
        >
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sections
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {sections.map((section) => {
                const words = countWords(section.content);
                const isActive = section.id === activeSection;
                const hasContent = words > 0;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {hasContent ? (
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-border shrink-0" />
                    )}
                    <span className="truncate flex-1">{section.heading}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground/60">
                      {words}
                    </span>
                  </button>
                );
              })}
            </nav>

            <button className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              <Plus className="h-3 w-3" />
              Add section
            </button>
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex-1 min-w-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Show sections
            </button>
          )}

          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                isActive={section.id === activeSection}
                onFocus={() => setActiveSection(section.id)}
                onChange={(content) =>
                  handleSectionChange(section.id, content)
                }
                evidence={
                  section.argumentId
                    ? evidenceByArgument.get(section.argumentId) || []
                    : []
                }
              />
            ))}
          </div>

          {/* Citation anchors summary */}
          {args.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Source references used
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources
                  .filter((s) =>
                    assignment.selectedSourceIds.includes(s.id)
                  )
                  .map((source) => {
                    const linked = args.some((a) =>
                      a.evidenceLinks.some(
                        (ev) => ev.sourceId === source.id
                      )
                    );
                    return (
                      <span
                        key={source.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                          linked
                            ? "border-source/30 bg-source/5 text-source"
                            : "border-border bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {linked ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {source.author} ({source.year})
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Next stage prompt */}
          <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-accent/30 bg-accent/5 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Ready to review?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Move to Refine to check rubric alignment, citation safety, and
                unsupported claims.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90">
              Refine
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
