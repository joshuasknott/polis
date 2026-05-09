"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type SessionDoc = {
  _id: Id<"coThinkerSessions">;
  _creationTime: number;
  tokenIdentifier: string;
  moduleId?: Id<"modules">;
  assignmentId?: Id<"assignments">;
  sourceId?: Id<"sources">;
  title: string;
  scope: string;
  stage?: string;
  createdAt: number;
  updatedAt: number;
};

type MessageDoc = {
  _id: Id<"coThinkerMessages">;
  _creationTime: number;
  tokenIdentifier: string;
  sessionId: Id<"coThinkerSessions">;
  role: string;
  content: string;
  citedChunkIds?: Id<"sourceChunks">[];
  labels?: string[];
  warnings?: string[];
  followUpSuggestions?: string[];
  createdAt: number;
};

type AssignmentDoc = {
  _id: Id<"assignments">;
  _creationTime: number;
  tokenIdentifier: string;
  moduleId: Id<"modules">;
  title: string;
  question?: string;
  wordLimit?: number;
  dueDate?: string;
  rubric?: Array<{ name: string; description: string; weight: number }>;
  stage: string;
  createdAt: number;
  updatedAt: number;
};

type ModuleDoc = {
  _id: Id<"modules">;
  _creationTime: number;
  tokenIdentifier: string;
  title: string;
  code: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  colour?: string;
  createdAt: number;
  updatedAt: number;
};

type SourceDoc = {
  _id: Id<"sources">;
  _creationTime: number;
  tokenIdentifier: string;
  moduleId: Id<"modules">;
  title: string;
  authors?: string;
  year?: number;
  type: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

type ChunkDoc = {
  _id: Id<"sourceChunks">;
  _creationTime: number;
  sourceId: Id<"sources">;
  chunkIndex: number;
  text: string;
  pageStart?: number;
  pageEnd?: number;
  createdAt: number;
};

type AssignmentSourceLinkDoc = {
  _id: Id<"assignmentSources">;
  _creationTime: number;
  tokenIdentifier: string;
  assignmentId: Id<"assignments">;
  sourceId: Id<"sources">;
  addedAt: number;
};

type ChatMessageForPrompt = {
  role: "user" | "assistant";
  content: string;
};

type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  authors: string | undefined;
  year: number | undefined;
  text: string;
  pageStart: number | undefined;
  pageEnd: number | undefined;
};

type MessageLabel =
  | "source_supported"
  | "interpretation"
  | "user_idea"
  | "general_context"
  | "unsupported";

type AskResult = {
  content: string;
  labels: MessageLabel[];
  warnings: string[];
  followUpSuggestions: string[];
  citedChunks: Array<{
    chunkId: string;
    sourceId: string;
    sourceTitle: string;
    quote: string;
    pageRange: string;
  }>;
  providerUsed: string;
};

function buildFallbackResponse(
  query: string,
  stage: string | undefined,
  hasSources: boolean,
  hasProvider: boolean,
): AskResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!hasProvider) {
    warnings.push("No AI provider is configured. Connect an API key in Settings for AI-powered responses.");
  }
  if (!hasSources) {
    warnings.push("No source material available for this scope. Upload sources first for grounded responses.");
  }

  let content = "";

  if (!hasProvider && !hasSources) {
    content = `I'm unable to answer "${query}" right now because:\n\n`;
    content += "1. No AI provider is connected. Add an API key in Settings.\n";
    content += "2. No sources are available in this scope. Upload readings first.\n\n";
    content += "[General context] Once you've connected a provider and uploaded sources, I can give you source-grounded analysis tailored to the ";
    content += stage ? `${stage} stage.` : "current stage.";
    suggestions.push("Connect an AI provider in Settings", "Upload your assigned readings", "Try a general question about your module");
  } else if (!hasProvider) {
    content = `I can see your sources but cannot generate an AI-powered response yet. Please connect an API key in Settings.\n\n`;
    content += `[General context] Your question "${query}" relates to the `;
    content += stage ? `${stage} stage.` : "current work.";
    suggestions.push("Connect an AI provider in Settings", "Browse your uploaded sources directly");
  } else {
    content = `[General context] I don't have source material to draw from for "${query}". `;
    content += stage ? `In the ${stage} stage, ` : "At this point, ";
    content += "having sources uploaded will allow me to give grounded, cited responses.\n\n";
    content += "In the meantime, I can help you think through your approach to this question using general academic guidance.";
    suggestions.push("Upload your assigned readings", "Add sources from your module", "Try asking a general study question");
  }

  return {
    content,
    labels: ["general_context"],
    warnings,
    followUpSuggestions: suggestions,
    citedChunks: [],
    providerUsed: "fallback",
  };
}

function buildSourceContextItems(chunks: RetrievedChunk[]): string[] {
  return chunks
    .slice(0, 10)
    .map((chunk) => {
      const citation = chunk.authors
        ? `${chunk.authors}${chunk.year ? ` (${chunk.year})` : ""}`
        : chunk.sourceTitle;
      const pages =
        chunk.pageStart != null
          ? `, pp. ${chunk.pageStart}${chunk.pageEnd != null && chunk.pageEnd !== chunk.pageStart ? `-${chunk.pageEnd}` : ""}`
          : "";
      return `"${chunk.sourceTitle}" by ${citation}${pages}:\n${chunk.text}`;
    });
}

function keywordSearch(query: string, chunks: RetrievedChunk[], topK: number): RetrievedChunk[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();
    const title = chunk.sourceTitle.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const textMatches = (text.match(new RegExp(term, "g")) || []).length;
      const titleMatches = (title.match(new RegExp(term, "g")) || []).length;
      score += textMatches + titleMatches * 3;
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}

function parseCitations(
  response: string,
  chunks: RetrievedChunk[],
): Array<{ chunkId: string; sourceId: string; sourceTitle: string; quote: string; pageRange: string }> {
  const cited: Array<{ chunkId: string; sourceId: string; sourceTitle: string; quote: string; pageRange: string }> = [];
  const seen = new Set<string>();

  const citationRegex = /\[Source (\d+)\]/g;
  let match;
  while ((match = citationRegex.exec(response)) !== null) {
    const index = parseInt(match[1], 10) - 1;
    if (index >= 0 && index < chunks.length) {
      const chunk = chunks[index];
      if (!seen.has(chunk.chunkId)) {
        seen.add(chunk.chunkId);
        const pageRange =
          chunk.pageStart != null
            ? chunk.pageEnd != null && chunk.pageEnd !== chunk.pageStart
              ? `pp. ${chunk.pageStart}-${chunk.pageEnd}`
              : `p. ${chunk.pageStart}`
            : "";
        cited.push({
          chunkId: chunk.chunkId,
          sourceId: chunk.sourceId,
          sourceTitle: chunk.sourceTitle,
          quote: chunk.text.slice(0, 200),
          pageRange,
        });
      }
    }
  }

  return cited;
}

function extractLabels(content: string): MessageLabel[] {
  const labels = new Set<MessageLabel>();
  if (/\[Source-supported\]/i.test(content)) labels.add("source_supported");
  if (/\[Interpretation\]/i.test(content)) labels.add("interpretation");
  if (/\[General context\]/i.test(content)) labels.add("general_context");
  if (/\[Unsupported\]/i.test(content)) labels.add("unsupported");
  return Array.from(labels);
}

function extractWarnings(content: string, hasSources: boolean, citedCount: number): string[] {
  const warnings: string[] = [];
  if (hasSources && citedCount === 0) {
    warnings.push("Response does not cite specific sources despite source material being available.");
  }
  if (/insufficient evidence/i.test(content)) {
    warnings.push("The analysis indicates insufficient evidence in your current source base.");
  }
  if (/could not find/i.test(content) || /no (relevant )?(information|evidence|source)/i.test(content)) {
    warnings.push("Limited relevant source material was found for this query.");
  }
  return warnings;
}

function extractSuggestions(stage: string | undefined): string[] {
  const stageSuggestions: Record<string, string[]> = {
    ingest: [
      "What sources am I still missing for this assignment?",
      "Help me check if I have the rubric and brief",
    ],
    understand: [
      "What is the main argument of each source?",
      "Where do the authors disagree?",
    ],
    map: [
      "What themes connect my readings?",
      "Show me where sources support or contradict each other",
    ],
    judge: [
      "What are the strongest counterarguments to my claims?",
      "Where is my evidence thinnest?",
    ],
    build: [
      "Help me refine my thesis statement",
      "How should I allocate my word budget?",
    ],
    draft: [
      "Does each paragraph cite its sources?",
      "Is my argument flowing logically?",
    ],
    refine: [
      "Which claims lack source support?",
      "How does my draft align with the rubric?",
    ],
  };

  return stageSuggestions[stage ?? "understand"] ?? stageSuggestions.understand;
}

export const ask = action({
  args: {
    sessionId: v.id("coThinkerSessions"),
    query: v.string(),
  },
  handler: async (ctx, args): Promise<AskResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = (await ctx.runQuery(api.cothinker.getSession, {
      sessionId: args.sessionId,
    })) as SessionDoc | null;
    if (!session) throw new Error("Session not found");

    const previousMessages = (await ctx.runQuery(api.cothinker.listMessages, {
      sessionId: args.sessionId,
    })) as MessageDoc[];

    const recentHistory: ChatMessageForPrompt[] = previousMessages
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    let assignmentContext: string | null = null;
    if (session.assignmentId) {
      const assignment = (await ctx.runQuery(api.assignments.get, {
        assignmentId: session.assignmentId,
      })) as AssignmentDoc | null;
      if (assignment) {
        assignmentContext = `Title: ${assignment.title}`;
        if (assignment.question) assignmentContext += `\nQuestion: ${assignment.question}`;
        if (assignment.wordLimit) assignmentContext += `\nWord limit: ${assignment.wordLimit}`;
        if (assignment.dueDate) assignmentContext += `\nDue: ${assignment.dueDate}`;
        if (assignment.rubric && assignment.rubric.length > 0) {
          assignmentContext += "\nRubric:";
          for (const r of assignment.rubric) {
            assignmentContext += `\n- ${r.name} (${r.weight}%): ${r.description}`;
          }
        }
      }
    }

    let moduleContext: string | null = null;
    if (session.moduleId) {
      const mod = (await ctx.runQuery(api.modules.get, {
        moduleId: session.moduleId,
      })) as ModuleDoc | null;
      if (mod) {
        moduleContext = `Module: ${mod.title} (${mod.code})`;
        if (mod.description) moduleContext += `\n${mod.description}`;
      }
    }

    let allChunks: RetrievedChunk[] = [];

    if (session.sourceId) {
      const chunks = (await ctx.runQuery(api.sources.listChunks, {
        sourceId: session.sourceId,
      })) as ChunkDoc[];
      const source = (await ctx.runQuery(api.sources.get, {
        sourceId: session.sourceId,
      })) as SourceDoc | null;
      allChunks = chunks.map((c) => ({
        chunkId: c._id,
        sourceId: c.sourceId,
        sourceTitle: source?.title ?? "Unknown",
        authors: source?.authors,
        year: source?.year,
        text: c.text,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
      }));
    } else if (session.moduleId) {
      const moduleSources = (await ctx.runQuery(api.sources.list, {
        moduleId: session.moduleId,
      })) as SourceDoc[];

      let sourcesToSearch = moduleSources;
      if (session.assignmentId) {
        const assignmentSourceLinks = (await ctx.runQuery(api.assignments.listSources, {
          assignmentId: session.assignmentId,
        })) as AssignmentSourceLinkDoc[];
        const linkedSourceIds = new Set(assignmentSourceLinks.map((l) => l.sourceId));
        sourcesToSearch = moduleSources.filter((s) => linkedSourceIds.has(s._id));
        if (sourcesToSearch.length === 0) {
          sourcesToSearch = moduleSources;
        }
      }

      for (const source of sourcesToSearch.slice(0, 20)) {
        const chunks = (await ctx.runQuery(api.sources.listChunks, {
          sourceId: source._id,
        })) as ChunkDoc[];
        for (const c of chunks) {
          allChunks.push({
            chunkId: c._id,
            sourceId: c.sourceId,
            sourceTitle: source.title,
            authors: source.authors,
            year: source.year,
            text: c.text,
            pageStart: c.pageStart,
            pageEnd: c.pageEnd,
          });
        }
      }
    }

    const hasSources = allChunks.length > 0;
    const relevantChunks = hasSources
      ? keywordSearch(args.query, allChunks, 8)
      : [];

    const providerStatus = await ctx.runQuery(api.ai.getProviderStatus, {});
    const hasProvider = providerStatus.configured;

    if (!hasProvider || !hasSources) {
      await ctx.runMutation(api.cothinker.addMessage, {
        sessionId: args.sessionId,
        role: "user",
        content: args.query,
      });

      const fallback = buildFallbackResponse(args.query, session.stage, hasSources, hasProvider);

      await ctx.runMutation(api.cothinker.addMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: fallback.content,
        citedChunkIds: fallback.citedChunks.map((c) => c.chunkId as Id<"sourceChunks">),
        labels: fallback.labels,
        warnings: fallback.warnings,
        followUpSuggestions: fallback.followUpSuggestions,
      });

      return fallback;
    }

    const sourceContext = buildSourceContextItems(relevantChunks);
    const contextParts = [moduleContext, assignmentContext].filter(Boolean);
    const queryWithContext = contextParts.length > 0
      ? `${contextParts.join("\n\n")}\n\nStudent question: ${args.query}`
      : args.query;

    const messages = [
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: queryWithContext },
    ];

    let responseContent: string;
    let providerUsed = providerStatus.provider ?? "configured";

    try {
      const response = await ctx.runAction(api.ai.chat, {
        messages,
        stage: session.stage,
        sources: sourceContext,
        provider: providerStatus.provider ?? undefined,
        model: providerStatus.model ?? undefined,
      });
      responseContent = response.content;
      providerUsed = response.provider ?? providerUsed;
    } catch {
      responseContent = `[General context] I encountered an error while generating a response. Your question was: "${args.query}"\n\nPlease try again. If the issue persists, check your provider settings.`;
    }

    const citedChunks = parseCitations(responseContent, relevantChunks);
    const labels = extractLabels(responseContent);
    const warnings = extractWarnings(responseContent, hasSources, citedChunks.length);
    const followUpSuggestions = extractSuggestions(session.stage);

    await ctx.runMutation(api.cothinker.addMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.query,
    });

    await ctx.runMutation(api.cothinker.addMessage, {
      sessionId: args.sessionId,
      role: "assistant",
      content: responseContent,
      citedChunkIds: citedChunks.map((c) => c.chunkId as Id<"sourceChunks">),
      labels,
      warnings,
      followUpSuggestions,
    });

    return {
      content: responseContent,
      labels,
      warnings,
      followUpSuggestions,
      citedChunks,
      providerUsed,
    };
  },
});
