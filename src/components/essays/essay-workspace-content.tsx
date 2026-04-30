"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Target,
  ChevronRight,
} from "lucide-react";
import { cn, getEssayStatusLabel, getEssayStatusColor } from "@/lib/utils";

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

type Tab = "overview" | "structure" | "evidence";

export function EssayWorkspaceContent({ essay }: EssayWorkspaceContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "structure", label: "Structure" },
    { id: "evidence", label: "Evidence Bank" },
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

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
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
    </div>
  );
}
