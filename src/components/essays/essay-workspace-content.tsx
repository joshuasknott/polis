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

type Tab = "overview" | "structure" | "evidence" | "draft" | "tools";

export function EssayWorkspaceContent({ essay }: EssayWorkspaceContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Target className="h-4 w-4" /> },
    { id: "structure", label: "Structure", icon: <FileText className="h-4 w-4" /> },
    { id: "evidence", label: "Evidence", icon: <BookOpen className="h-4 w-4" /> },
    { id: "draft", label: "Draft", icon: <Pencil className="h-4 w-4" /> },
    { id: "tools", label: "AI Tools", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getEssayStatusColor(essay.status))}>
                {getEssayStatusLabel(essay.status)}
              </span>
              <span className="text-xs text-muted-foreground">{essay.moduleTitle}</span>
            </div>
            <h1 className="text-xl font-bold">{essay.title}</h1>
            {essay.question && (
              <p className="mt-2 text-sm text-muted-foreground italic">&ldquo;{essay.question}&rdquo;</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {essay.wordCount} words target
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {essay.evidence.length} evidence items
          </span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Thesis
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {essay.thesis || "No thesis defined yet. Edit your essay to add a thesis statement."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Essay Sections ({essay.sections.length})</h2>
            <div className="space-y-2">
              {essay.sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{section.heading}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.purpose}</p>
                  </div>
                  <span className="text-sm font-semibold text-accent shrink-0 ml-4">{section.wordAllocation}w</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "structure" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Proposed essay structure. Total: {essay.sections.reduce((sum, s) => sum + s.wordAllocation, 0)} words.
          </p>
          {essay.sections.map((section, index) => (
            <div key={section.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold">{section.heading}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{section.wordAllocation} words</span>
              </div>
              {section.purpose && (
                <p className="mt-2 text-xs text-muted-foreground">{section.purpose}</p>
              )}
              <ul className="mt-3 space-y-1.5">
                {section.points.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {essay.sections.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No sections defined yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "evidence" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {essay.evidence.length} evidence items from your sources
          </p>
          {essay.evidence.map((evidence) => (
            <div key={evidence.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">{evidence.sourceTitle}</span>
                    <span className="text-xs text-muted-foreground">{evidence.pageRange}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{evidence.claim}</p>
                  {evidence.quote && (
                    <blockquote className="text-sm italic text-muted-foreground border-l-2 border-blue-200 pl-3">
                      &ldquo;{evidence.quote}&rdquo;
                    </blockquote>
                  )}
                  {evidence.argumentUse && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Use:</span> {evidence.argumentUse}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {essay.evidence.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No evidence items yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add evidence from your sources to build your argument.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "draft" && (
        <DraftEditor essay={essay} />
      )}

      {activeTab === "tools" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI-powered tools to help strengthen your essay. These tools analyse and suggest — they do not write for you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold">Citation Safety Check</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Check your draft for claims that lack proper citation support. Identifies supported, weakly supported, and unsupported claims.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Run Citation Check
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-semibold">Draft Review</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Get structured feedback on your draft including strengths, weaknesses, missing evidence, and revision priorities.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                Review Draft
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DraftEditor({ essay }: { essay: EssayWorkspaceContentProps["essay"] }) {
  const [content, setContent] = useState(essay.draftContent || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [citationResult, setCitationResult] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);

  const words = wordCount(content);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setLastSaved(`${new Date().toLocaleTimeString()} (local only)`);
    setSaving(false);
  }, []);

  async function runCitationCheck() {
    if (!content.trim()) return;
    setToolLoading("citation");
    setCitationResult(null);
    setCitationResult("Citation checking is paused while the backend foundation migrates to Convex.");
    setToolLoading(null);
  }

  async function runDraftReview() {
    if (!content.trim()) return;
    setToolLoading("review");
    setReviewResult(null);
    setReviewResult("Draft review is paused while the backend foundation migrates to Convex.");
    setToolLoading(null);
  }

  return (
    <div className="space-y-4">
      {(essay.question || essay.thesis) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          {essay.question && (
            <p><span className="font-medium text-blue-800">Question:</span> <span className="text-blue-700 italic">&ldquo;{essay.question}&rdquo;</span></p>
          )}
          {essay.thesis && (
            <p className="mt-1"><span className="font-medium text-blue-800">Thesis:</span> <span className="text-blue-700">{essay.thesis}</span></p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{words} words</span>
            <span>Target: {essay.wordCount}</span>
            {saving && <span className="text-blue-600">Saving...</span>}
            {lastSaved && !saving && <span>Saved at {lastSaved}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[400px] p-4 text-sm leading-relaxed bg-transparent resize-y focus:outline-none"
          placeholder="Start writing your draft here...&#10;&#10;This editor is for YOUR writing only. AI tools can analyse and provide feedback, but will never generate text for you."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={runCitationCheck}
          disabled={toolLoading !== null || !content.trim()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {toolLoading === "citation" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Run Citation Check
        </button>
        <button
          onClick={runDraftReview}
          disabled={toolLoading !== null || !content.trim()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {toolLoading === "review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}
          Run Draft Review
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Academic integrity: This is your own writing space. AI tools only analyse and provide feedback — they never generate text.
      </p>

      {citationResult && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Citation Check Results</h3>
          <div className="text-sm text-green-900 whitespace-pre-wrap">{citationResult}</div>
        </div>
      )}

      {reviewResult && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">Draft Review Results</h3>
          <div className="text-sm text-purple-900 whitespace-pre-wrap">{reviewResult}</div>
        </div>
      )}
    </div>
  );
}
