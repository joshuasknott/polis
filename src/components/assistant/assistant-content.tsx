"use client";

import { useState } from "react";
import {
  Send,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Shield,
  Loader2,
  Zap,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistantContentProps {
  modules: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; title: string; moduleId: string }>;
  conversations: Array<{
    id: string;
    title: string;
    mode: string;
    messageCount: number;
    createdAt: string;
  }>;
  aiConfigured: boolean;
  providerName: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citedChunks: Array<{
    chunkId: string;
    sourceId: string;
    sourceTitle: string;
    quote: string;
    pageRange: string;
  }>;
  warnings: string[];
  labels: Array<{ type: string; text: string }>;
  followUpSuggestions: string[];
}

export function AssistantContent({
  modules,
  sources,
  conversations,
  aiConfigured,
  providerName,
}: AssistantContentProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(modules[0]?.id || "");
  const [selectedMode, setSelectedMode] = useState("source_grounded");
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      role: "user",
      content: query,
      citedChunks: [],
      warnings: [],
      labels: [],
      followUpSuggestions: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          moduleId: selectedModule || undefined,
          mode: selectedMode,
          conversationId,
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content || "No response generated.",
        citedChunks: data.citedChunks || [],
        warnings: data.warnings || [],
        labels: data.labels || [],
        followUpSuggestions: data.followUpSuggestions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Failed to get a response. Please try again.",
        citedChunks: [],
        warnings: ["Request failed"],
        labels: [],
        followUpSuggestions: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToEvidence(chunk: ChatMessage["citedChunks"][0]) {
    try {
      await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addEvidence",
          essayId: "essay_01",
          sourceId: chunk.sourceId,
          sourceChunkId: chunk.chunkId,
          claim: chunk.quote.slice(0, 200),
          evidenceText: chunk.quote,
          citation: chunk.pageRange,
        }),
      });
    } catch {
      // Silently fail — evidence add is non-critical
    }
  }

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about your modules and sources. Answers are source-grounded.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Module</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
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
            onChange={(e) => setSelectedMode(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="source_grounded">Source-grounded answer</option>
            <option value="reading_summary">Reading summary</option>
            <option value="essay_planning">Essay planning</option>
            <option value="brainstorm">Brainstorm</option>
            <option value="draft_feedback">Draft feedback</option>
            <option value="citation_safety">Citation safety</option>
          </select>
        </div>
        <div className="space-y-1.5 self-end">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              aiConfigured
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            )}
          >
            <Zap className="h-3 w-3" />
            {aiConfigured ? `AI Connected (${providerName})` : "Template Mode"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">
              {messages.length > 0 ? "Current Conversation" : "Ask a Question"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sources.length} sources available &middot; Mode: {selectedMode.replace(/_/g, " ")}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              className="text-xs text-accent hover:underline"
            >
              New Conversation
            </button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Ask a question about your uploaded sources.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "What are the main differences between consensus and majoritarian democracy?",
                  "Summarise the key arguments about great power competition",
                  "Help me plan an essay on electoral systems",
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

          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg p-4",
                message.role === "user"
                  ? "bg-accent text-accent-foreground ml-12"
                  : "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium">
                  {message.role === "user" ? "You" : "SocialSciencr"}
                </span>
                {message.role === "assistant" && message.labels.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    <BookOpen className="h-3 w-3" />
                    {message.labels[0].text}
                  </span>
                )}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>

              {message.citedChunks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Cited Sources:</p>
                  {message.citedChunks.map((chunk, j) => (
                    <div
                      key={j}
                      className="rounded-lg border border-blue-200 bg-blue-50/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-blue-800">{chunk.sourceTitle}</span>
                        <span className="text-xs text-blue-600">{chunk.pageRange}</span>
                      </div>
                      <p className="mt-1 text-xs text-blue-900 italic">
                        &ldquo;{chunk.quote}&rdquo;
                      </p>
                      <button
                        onClick={() => handleAddToEvidence(chunk)}
                        className="mt-2 inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        Add to Evidence Bank
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {message.warnings.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {message.warnings.map((warning, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{warning}</p>
                    </div>
                  ))}
                </div>
              )}

              {message.followUpSuggestions.length > 0 && (
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
                {aiConfigured ? "Searching sources and generating response..." : "Searching sources..."}
              </span>
            </div>
          )}
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
              ? "Answers are AI-generated from your uploaded sources with hybrid retrieval. Every claim should cite a source."
              : "Answers use template-based keyword retrieval. Connect an AI provider for richer responses."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-green-600" />
            Citation Safety
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Every claim is labelled as source-supported, interpretation, or general context.
            Unsupported claims are flagged with warnings. No fabricated citations.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-accent" />
            Source Grounding
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {aiConfigured
              ? "Hybrid retrieval (semantic + keyword) finds the most relevant chunks. AI generates grounded responses with citations."
              : "Answers reference specific sources and chunks from your uploaded materials."}
            {sources.length === 0 && " Upload sources first to get grounded responses."}
          </p>
        </div>
      </div>

      {conversations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Previous Conversations</h2>
          <div className="space-y-2">
            {conversations.slice(0, 5).map((conv) => (
              <div
                key={conv.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-sm font-medium">{conv.title}</p>
                <p className="text-xs text-muted-foreground">
                  {conv.messageCount} messages &middot; {conv.mode.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
