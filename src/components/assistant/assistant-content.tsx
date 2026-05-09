"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ProductionStage } from "@/lib/types";
import {
  Send,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Shield,
  Loader2,
  Zap,
  FileText,
  FolderOpen,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  id: string;
  title: string;
  mode: string;
  messageCount: number;
  createdAt: string;
  moduleId?: string;
  assignmentId?: string;
  scope: string;
  stage?: string;
}

interface AssistantContentProps {
  modules: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; title: string; moduleId: string }>;
  conversations: ConversationSummary[];
  aiConfigured: boolean;
  providerName: string;
}

export function AssistantContent({
  modules,
  sources,
  conversations,
  aiConfigured,
  providerName,
}: AssistantContentProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModule, selectedModuleRaw] = useState(modules[0]?.id || "");
  const [selectedMode, setSelectedMode] = useState<ProductionStage>("understand");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createSession = useMutation(api.cothinker.createSession);
  const removeSession = useMutation(api.cothinker.removeSession);
  const askAction = useAction(api.cothinker_ask.ask);

  const messages = useQuery(
    api.cothinker.listMessages,
    activeSessionId ? { sessionId: activeSessionId as Id<"coThinkerSessions"> } : "skip",
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredSources = selectedModule
    ? sources.filter((s) => s.moduleId === selectedModule)
    : sources;

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sessionArgs: {
      title: string;
      scope: "whole_module";
      stage: ProductionStage;
      moduleId?: Id<"modules">;
    } = {
      title: newTitle.trim(),
      scope: "whole_module",
      stage: selectedMode,
    };
    if (selectedModule) sessionArgs.moduleId = selectedModule as Id<"modules">;

    const id = await createSession(sessionArgs);
    setActiveSessionId(id);
    setNewTitle("");
    setShowNewSession(false);
  }

  function handleSelectConversation(conv: ConversationSummary) {
    setActiveSessionId(conv.id);
  }

  async function handleDeleteSession(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    await removeSession({ sessionId: convId as Id<"coThinkerSessions"> });
    if (activeSessionId === convId) {
      setActiveSessionId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || !activeSessionId) return;

    const query = input.trim();
    setInput("");
    setLoading(true);

    try {
      await askAction({
        sessionId: activeSessionId as Id<"coThinkerSessions">,
        query,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const activeConv = conversations.find((c) => c.id === activeSessionId);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CoThinker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source-grounded academic reasoning. Ask questions about your readings and assignments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Module</label>
          <select
            value={selectedModule}
            onChange={(e) => selectedModuleRaw(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Mode</label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as ProductionStage)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="ingest">Ingest</option>
            <option value="understand">Understand</option>
            <option value="map">Map</option>
            <option value="judge">Judge</option>
            <option value="build">Build</option>
            <option value="draft">Draft</option>
            <option value="refine">Refine</option>
          </select>
        </div>
        <div className="space-y-1.5 self-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              aiConfigured
                ? "bg-success/10 text-success"
                : "bg-interpretation/10 text-interpretation"
            )}
          >
            <Zap className="h-3 w-3" />
            {aiConfigured ? `AI Connected (${providerName})` : "AI Paused"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {activeConv ? activeConv.title : "Select or start a conversation"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <FolderOpen className="h-3 w-3" />
                {selectedModule
                  ? modules.find((m) => m.id === selectedModule)?.title ?? "Module"
                  : "All Modules"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Lightbulb className="h-3 w-3" />
                Mode: {selectedMode}
              </span>
              {!showNewSession && (
                <button
                  onClick={() => {
                    setShowNewSession(true);
                    setActiveSessionId(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3 w-3" />
                  New
                </button>
              )}
            </div>
          </div>
        </div>

        {showNewSession && (
          <div className="border-b border-border p-4">
            <form onSubmit={handleCreateSession} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Conversation title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewSession(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {!activeSessionId && !showNewSession && (
          <div className="p-6 space-y-4">
            {conversations.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Recent conversations
                </h3>
                <div className="space-y-2">
                  {conversations.slice(0, 10).map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors group",
                        activeSessionId === conv.id && "border-accent bg-accent/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""} &middot;{" "}
                            {conv.mode} &middot;{" "}
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(conv.id, e)}
                          className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-danger transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversations.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet. Start one to begin exploring your sources.
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Try asking
              </h3>
              <div className="space-y-2">
                {[
                  "What are the key themes across my readings?",
                  "Help me understand the main arguments in my sources",
                  "What evidence gaps do I have for my assignment?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="block w-full text-left rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSessionId && (
          <>
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages && messages.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Ask a question about your sources to get started.
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      "What are the main arguments in my readings?",
                      "How do the sources relate to each other?",
                      "What gaps exist in my evidence?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="block w-full text-left rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages &&
                messages.map((message) => (
                  <div
                    key={message._id}
                    className="py-6 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {message.role === "user" ? "Research Question" : "Analysis"}
                      </span>
                      {message.role === "assistant" && message.labels && message.labels.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-source/10 px-2 py-0.5 text-xs font-medium text-source">
                          <BookOpen className="h-3 w-3" />
                          {message.labels[0].replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "leading-relaxed whitespace-pre-line",
                        message.role === "user"
                          ? "text-lg font-medium text-foreground"
                          : "font-serif text-[15px] text-foreground/90"
                      )}
                    >
                      {message.content}
                    </div>

                    {message.warnings && message.warnings.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {message.warnings.map((warning, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3"
                          >
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                            <p className="text-xs text-warning">{warning}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Follow-up suggestions:
                        </p>
                        {message.followUpSuggestions.map((suggestion, j) => (
                          <button
                            key={j}
                            onClick={() => setInput(suggestion)}
                            className="block w-full text-left rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {loading && (
                <div className="rounded-lg bg-muted/50 p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {aiConfigured ? "Generating response..." : "Preparing response..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about your sources..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                {aiConfigured
                  ? "AI responses cite uploaded sources and warn when evidence is insufficient."
                  : "Connect an AI provider in Settings for powered responses. Source context is live."}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-success" />
            Citation Safety
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            AI responses label claims as source-supported, interpretation, or general context.
            No fabricated citations are generated.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-accent" />
            Source Grounding
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {filteredSources.length > 0
              ? `${filteredSources.length} source${filteredSources.length !== 1 ? "s" : ""} available in current scope.`
              : "No sources in this scope yet. Upload readings for grounded responses."}
          </p>
        </div>
      </div>
    </div>
  );
}
