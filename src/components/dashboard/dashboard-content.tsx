"use client";

import Link from "next/link";
import {
  BookOpen,
  Clock,
  FileText,
  FolderOpen,
  MessageSquare,
  ArrowRight,
  Calendar,
} from "lucide-react";
import {
  formatRelativeTime,
  getSourceTypeLabel,
} from "@/lib/utils";
import type { Module, SourceFile, AIConversation, User } from "@/lib/types";

interface DashboardContentProps {
  user: User;
  modules: Module[];
  sources: SourceFile[];
  conversations: AIConversation[];
  deadlines: Array<{
    id: string;
    moduleId: string;
    title: string;
    question: string;
    wordCount: number;
    thesis: string;
    status: string;
  }>;
}

export function DashboardContent({
  user,
  modules,
  sources,
  conversations,
  deadlines,
}: DashboardContentProps) {
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.course || "Polis Workspace"}{" "}
          {user.yearOfStudy ? `, Year ${user.yearOfStudy}` : ""}{" "}
          {user.university ? `· ${user.university}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Modules</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{modules.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Sources</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{sources.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Essays</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{deadlines.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Active Projects</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{deadlines.filter((d) => d.status !== "submitted").length}</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Modules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={`/modules/${mod.id}`}
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: mod.color }}
                  >
                    {mod.code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{mod.code}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{mod.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {mod.sourceCount} sources
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {mod.essayProjectCount} essays
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(mod.lastActivityAt)}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Sources</h2>
          <div className="space-y-2">
            {sources.slice(0, 5).map((source) => (
              <Link
                key={source.id}
                href={`/sources/${source.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{source.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {source.author} ({source.year}) &middot; {getSourceTypeLabel(source.type)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {formatRelativeTime(source.uploadedAt)}
                </span>
              </Link>
            ))}
            {sources.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">No sources yet. Upload your first reading!</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
          <div className="space-y-2">
            {conversations.slice(0, 3).map((conv) => (
              <Link
                key={conv.id}
                href="/assistant"
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.scope.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {formatRelativeTime(conv.createdAt)}
                </span>
              </Link>
            ))}
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Ask questions about your modules and sources
              </p>
              <Link
                href="/assistant"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Open Assistant
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {deadlines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Essay Projects</h2>
          <div className="space-y-3">
            {deadlines.slice(0, 3).map((essay) => (
              <Link
                key={essay.id}
                href={`/essays/${essay.id}`}
                className="block rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{essay.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {essay.wordCount} words &middot; {essay.status}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
