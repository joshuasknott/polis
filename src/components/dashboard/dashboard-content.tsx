"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  FileText,
  FolderOpen,
  ArrowRight,
  Plus,
  Trash2,
  Edit2
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Module, User } from "@/lib/types";

interface DashboardContentProps {
  user?: User;
  modules: Module[];
}

export function DashboardContent({
  modules,
}: DashboardContentProps) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto mt-4 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-foreground tracking-tight">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Select a module to continue your coursework.
          </p>
        </div>
        <button disabled title="Creating workspaces is not yet supported in this preview" className="inline-flex items-center gap-2 rounded-md bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground/50 shadow-sm cursor-not-allowed transition-colors">
          <Plus className="h-4 w-4" />
          New Workspace
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-32 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-4">
            <FolderOpen className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-lg font-medium text-foreground font-serif">No workspaces yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Create your first module workspace to start organising readings, notes, and assignments.
          </p>
          <button disabled title="Creating workspaces is not yet supported in this preview" className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground/50 shadow-sm cursor-not-allowed transition-colors">
            <Plus className="h-4 w-4" />
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div 
                className="absolute left-0 top-6 h-8 w-1 rounded-r-md" 
                style={{ backgroundColor: mod.color || "var(--color-border)" }}
              />
              
              <div className="pl-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-medium text-foreground font-serif group-hover:text-accent transition-colors">
                      <Link href={`/modules/${mod.id}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {mod.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{mod.code}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-1 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button disabled className="p-1.5 text-muted-foreground/50 cursor-not-allowed rounded-md transition-colors" title="Editing workspaces is not yet supported">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button disabled className="p-1.5 text-muted-foreground/50 cursor-not-allowed rounded-md transition-colors" title="Deleting workspaces is not yet supported">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                  {mod.description}
                </p>
                
                <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <BookOpen className="h-3.5 w-3.5" />
                    {mod.sourceCount} sources
                  </span>
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <FileText className="h-3.5 w-3.5" />
                    {mod.assignmentCount} assignments
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pl-3 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(mod.lastActivityAt)}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
