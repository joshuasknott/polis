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
        <h1 className="text-2xl font-bold tracking-tight">Academic Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source-grounded tools to support your reading, planning, and writing workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTools.map((tool) => {
          const Icon = iconMap[tool.icon] || FileText;
          const isActive = activeTool === tool.id;

          return (
            <div
              key={tool.id}
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{tool.title}</h3>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>In: {tool.inputType}</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                {tool.description}
              </p>

              {(tool.id === "reading_summary" ||
                tool.id === "concept_extractor" ||
                tool.id === "essay_plan_builder" ||
                tool.id === "counterargument_finder" ||
                tool.id === "draft_review" ||
                tool.id === "citation_safety_check" ||
                tool.id === "research_gap_finder") && (
                <div className="mt-4 space-y-2">
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
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs resize-none h-20 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    onClick={() => runTool(tool.id)}
                    disabled={loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {loading && isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3 w-3" />
                    )}
                    Run Tool
                  </button>
                </div>
              )}

              {!(tool.id === "reading_summary" ||
                tool.id === "concept_extractor" ||
                tool.id === "essay_plan_builder" ||
                tool.id === "counterargument_finder" ||
                tool.id === "draft_review" ||
                tool.id === "citation_safety_check" ||
                tool.id === "research_gap_finder") && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Output: {tool.outputType}
                  </span>
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Open in Assistant
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <div className="mt-3 rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {toolResult.error}
            </div>
          ) : toolResult.result ? (
            <div className="text-sm whitespace-pre-line leading-relaxed">
              {(toolResult.result as Record<string, unknown>).content
                ? String((toolResult.result as Record<string, unknown>).content)
                : JSON.stringify(toolResult.result, null, 2)}
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              Check completed successfully. See results above.
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">AI-Powered Tools</p>
        <p className="mt-1 text-xs text-muted-foreground">
          These tools use AI to generate outputs grounded in your uploaded sources when an API key is configured.
          Without an API key, the assistant uses template-based keyword retrieval.
        </p>
      </div>
    </div>
  );
}
