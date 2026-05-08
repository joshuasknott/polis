"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Target,
  ChevronRight,
  ShieldCheck,
  MessageSquareText,
  Loader2,
  Pencil,
} from "lucide-react";
import { cn, getEssayStatusLabel, getEssayStatusColor, wordCount } from "@/lib/utils";

interface EssayWorkspaceContentProps {
  essay: {
    id: string;
    moduleId: string;
    title: string;
    question: string;
    wordCount: number;
    thesis: string;
    status: string;
    createdAt: string;
    moduleTitle: string;
    moduleCode: string;
    draftContent: string;
    sections: Array<{
      id: string;
      heading: string;
      purpose: string;
      points: string[];
      evidenceIds: string[];
      wordAllocation: number;
      displayOrder: number;
    }>;
    evidence: Array<{
      id: string;
      sourceId: string;
      sourceTitle: string;
      quote: string;
      pageRange: string;
      argumentUse: string;
      claim: string;
    }>;
  };
}



export function EssayWorkspaceContent({ essay }: EssayWorkspaceContentProps) {
  const [activeTab, setActiveTab] = useState<"draft" | "overview" | "structure">("draft");

  const mainTabs = [
    { id: "draft", label: "Draft", icon: <Pencil className="h-4 w-4" /> },
    { id: "overview", label: "Overview", icon: <Target className="h-4 w-4" /> },
    { id: "structure", label: "Structure", icon: <FileText className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 max-w-full">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card shrink-0 z-10 shadow-sm relative">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getEssayStatusColor(essay.status))}>
                {getEssayStatusLabel(essay.status)}
              </span>
              <span className="text-xs text-muted-foreground">{essay.moduleTitle} &middot; {essay.moduleCode}</span>
            </div>
            <h1 className="text-2xl font-bold font-serif">{essay.title}</h1>
            {essay.question && (
              <p className="mt-2 text-sm text-muted-foreground italic font-serif">&ldquo;{essay.question}&rdquo;</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border font-medium">
              <FileText className="h-4 w-4 text-accent" />
              {essay.wordCount} words target
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Main Workspace (Draft/Structure) */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden bg-background">
          <div className="flex gap-1 border-b border-border px-6 pt-2 bg-muted/10 shrink-0">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {activeTab === "draft" && (
              <div className="h-full flex flex-col">
                <DraftEditor essay={essay} />
              </div>
            )}

            {activeTab === "overview" && (
              <div className="p-8 max-w-3xl mx-auto space-y-8">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    Working Thesis
                  </h2>
                  <p className="font-serif text-[15px] leading-relaxed text-foreground">
                    {essay.thesis || "No thesis defined yet. Edit your essay settings to add a thesis statement."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "structure" && (
              <div className="p-8 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Essay Outline</h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total: {essay.sections.reduce((sum, s) => sum + s.wordAllocation, 0)} words
                  </p>
                </div>
                {essay.sections.map((section, index) => (
                  <div key={section.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent mt-0.5">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-bold font-serif">{section.heading}</h3>
                          {section.purpose && (
                            <p className="mt-1 text-sm text-muted-foreground">{section.purpose}</p>
                          )}
                          <ul className="mt-4 space-y-2">
                            {section.points.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {section.wordAllocation} w
                      </span>
                    </div>
                  </div>
                ))}
                {essay.sections.length === 0 && (
                  <div className="rounded-xl border border-border bg-card p-12 text-center border-dashed">
                    <p className="text-sm text-muted-foreground">No structural sections defined yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Evidence & Workbench */}
        <div className="w-[420px] shrink-0 flex flex-col border-l border-border bg-muted/20">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-source" />
              Evidence Bank ({essay.evidence.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {essay.evidence.map((evidence) => (
              <div key={evidence.id} className="rounded-xl border border-source/20 bg-card p-4 shadow-sm group hover:border-source/40 transition-colors cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-md bg-source/10 px-2 py-0.5 text-[10px] font-bold text-source uppercase tracking-wider">
                    Evidence
                  </span>
                  <span className="text-xs font-medium text-muted-foreground truncate flex-1">{evidence.sourceTitle}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{evidence.pageRange}</span>
                </div>
                <p className="text-sm font-semibold mb-2 leading-snug">{evidence.claim}</p>
                {evidence.quote && (
                  <blockquote className="text-[13px] font-serif italic text-muted-foreground border-l-2 border-source/30 pl-3 py-0.5">
                    &ldquo;{evidence.quote}&rdquo;
                  </blockquote>
                )}
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[11px] font-medium text-source hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Insert Citation
                  </button>
                </div>
              </div>
            ))}
            {essay.evidence.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No evidence added yet.</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Browse your sources and save evidence here to use in your draft.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-card">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-interpretation" />
              Review Workbench
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/tools"
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 p-3 text-center hover:bg-muted hover:border-muted-foreground/30 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-[11px] font-semibold text-muted-foreground">Citation Check</span>
              </Link>
              <Link
                href="/tools"
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 p-3 text-center hover:bg-muted hover:border-muted-foreground/30 transition-all"
              >
                <MessageSquareText className="h-4 w-4 text-interpretation" />
                <span className="text-[11px] font-semibold text-muted-foreground">Review Draft</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftEditor({ essay }: { essay: EssayWorkspaceContentProps["essay"] }) {
  const [content, setContent] = useState(essay.draftContent || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const words = wordCount(content);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setLastSaved(`${new Date().toLocaleTimeString()} (local only)`);
    setSaving(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className={cn(words > essay.wordCount ? "text-warning" : "")}>
            {words} / {essay.wordCount} words
          </span>
          {saving ? (
            <span className="text-source flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Saving...</span>
          ) : lastSaved ? (
            <span>Saved at {lastSaved}</span>
          ) : null}
        </div>
        <button
          onClick={saveDraft}
          disabled={saving}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex justify-center py-12 px-6">
        <div className="w-full max-w-3xl">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[600px] text-[17px] font-serif leading-[2] bg-transparent resize-y focus:outline-none placeholder:font-sans placeholder:text-muted-foreground/40 text-foreground/90"
            placeholder="Begin writing your draft here...&#10;&#10;Use the Evidence Bank on the right to insert source-backed claims. Click 'Citation Check' when you want Polis to review your academic integrity."
          />
        </div>
      </div>
    </div>
  );
}
