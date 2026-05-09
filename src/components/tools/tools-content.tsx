"use client";

import {
  BookOpen,
  Lightbulb,
  GitCompareArrows,
  Table,
  Database,
  Network,
  FileText,
  Swords,
  MessageSquareText,
  ShieldCheck,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { mockTools } from "@/lib/data/mock-data";
import { useState } from "react";
import Link from "next/link";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Lightbulb,
  GitCompareArrows,
  Table,
  Database,
  Network,
  FileText,
  Swords,
  MessageSquareText,
  ShieldCheck,
  Search,
};

interface ToolResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export function ToolsContent() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTool(toolId: string) {
    if (!toolInput.trim()) return;
    setLoading(true);
    setActiveTool(toolId);
    setToolResult(null);

    setToolResult({
      success: false,
      error: "Academic tools are paused while the backend foundation migrates to Convex.",
    });
    setLoading(false);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workbench</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source-grounded tools to support your reading, planning, and writing workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTools.map((tool) => {
          const Icon = iconMap[tool.icon] || FileText;
          const isActive = activeTool === tool.id;

          return (
            <div
              key={tool.id}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/40 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-foreground leading-tight">{tool.title}</h3>
                  <div className="flex gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase mt-1">
                    <span>Input: {tool.inputType}</span>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-muted-foreground leading-relaxed flex-1">
                {tool.description}
              </p>

              {(tool.id === "reading_summary" ||
                tool.id === "concept_extractor" ||
                tool.id === "argument_builder" ||
                tool.id === "counterargument_finder" ||
                tool.id === "draft_review" ||
                tool.id === "citation_safety_check" ||
                tool.id === "research_gap_finder") && (
                <div className="mt-5 space-y-3">
                  <textarea
                    placeholder={
                      tool.id === "citation_safety_check"
                        ? "Paste your draft text to check citations..."
                        : tool.id === "draft_review"
                        ? "Paste your draft text for review..."
                        : "Describe what you need..."
                    }
                    value={isActive ? toolInput : ""}
                    onChange={(e) => {
                      setActiveTool(tool.id);
                      setToolInput(e.target.value);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/20 font-serif placeholder:font-sans"
                  />
                  <button
                    onClick={() => runTool(tool.id)}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading && isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Run Tool
                  </button>
                </div>
              )}

              {!(tool.id === "reading_summary" ||
                tool.id === "concept_extractor" ||
                tool.id === "argument_builder" ||
                tool.id === "counterargument_finder" ||
                tool.id === "draft_review" ||
                tool.id === "citation_safety_check" ||
                tool.id === "research_gap_finder") && (
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Output: {tool.outputType}
                  </span>
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
                  >
                    Open CoThinker
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <div className="mt-5 rounded-lg bg-muted/30 border border-border/50 p-3">
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed flex items-start gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  {tool.academicIntegrityNote}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {toolResult && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-3">Tool Result</h2>
          {toolResult.error ? (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
              {toolResult.error}
            </div>
          ) : toolResult.result ? (
            <div className="text-sm whitespace-pre-line leading-relaxed">
              {(toolResult.result as Record<string, unknown>).content
                ? String((toolResult.result as Record<string, unknown>).content)
                : JSON.stringify(toolResult.result, null, 2)}
            </div>
          ) : (
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-xs text-success">
              Check completed successfully. See results above.
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">Workbench Tools</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Standalone workbench actions are paused during the Convex migration. Use assignment stages for contextual source, argument, draft, and refine work.
        </p>
      </div>
    </div>
  );
}
