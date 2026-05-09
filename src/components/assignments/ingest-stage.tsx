"use client";

import { useState } from "react";
import { FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignmentBriefPanel } from "./assignment-brief-panel";
import { AssignmentSourceBase } from "./assignment-source-base";
import type { Assignment, SourceFile, ProductionStage } from "@/lib/types";

const TABS = [
  { id: "brief", label: "Brief & Rubric", icon: FileText },
  { id: "sources", label: "Source Base", icon: BookOpen },
] as const;

type Tab = (typeof TABS)[number]["id"];

interface IngestStageProps {
  assignment: Assignment;
  allModuleSources: SourceFile[];
  activeStage: ProductionStage;
  assignmentId?: string;
}

export function IngestStage({ assignment, allModuleSources, activeStage, assignmentId }: IngestStageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("brief");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`ingest-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={activeTab === tab.id}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "brief" && (
        <AssignmentBriefPanel assignment={assignment} activeStage={activeStage} />
      )}

      {activeTab === "sources" && (
        <AssignmentSourceBase
          allModuleSources={allModuleSources}
          initialSelectedIds={assignment.selectedSourceIds}
          assignmentId={assignmentId ?? assignment.id}
        />
      )}
    </div>
  );
}
