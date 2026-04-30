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
} from "lucide-react";
import { mockTools } from "@/lib/data/mock-data";

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

export function ToolsContent() {
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

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Output: {tool.outputType}
                </span>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  Use Tool
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-3 rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tool.academicIntegrityNote}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium">More tools coming in Phase 1</p>
        <p className="mt-1 text-xs text-muted-foreground">
          These tools will use AI to generate outputs grounded in your uploaded sources when a provider is connected.
        </p>
      </div>
    </div>
  );
}
