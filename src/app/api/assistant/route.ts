import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { generateRetrievalAwareResponse } from "@/lib/ai/grounded-provider";
import { processLLMResponse } from "@/lib/ai/response-processor";
import { chat, isAIConfigured, generateEmbedding, isOpenAIConfigured } from "@/lib/ai/providers";
import { buildSystemPrompt, buildContextBlock } from "@/lib/ai/prompts";
import { checkRateLimit, recordUsage } from "@/lib/services/rate-limit-service";
import type { AIMode, AIScope } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { query, moduleId, sourceId, essayId, mode, conversationId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const rateLimit = checkRateLimit(userId, 2000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.reason, retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    const aiMode: AIMode = mode || "source_grounded";

    const chunks = await retrieveRelevantChunks({
      userId,
      query,
      moduleId,
      sourceId,
      essayId,
      limit: 8,
    });

    let convId = conversationId;
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (convId) {
      const existing = await convexServer.query(api.conversations.getById, {
        userId,
        conversationId: convId,
      });
      if (existing && existing.messages) {
        const last10 = existing.messages.slice(-10);
        conversationHistory = last10.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    }

    const useLLM = isAIConfigured();
    let response;

    if (useLLM) {
      response = await generateLLMResponse(query, aiMode, chunks, conversationHistory, userId);
      recordUsage(userId, response.estimatedTokens || 1500);
    } else {
      response = generateRetrievalAwareResponse({
        query,
        mode: aiMode,
        chunks,
      });
    }

    if (!convId) {
      const conv = await convexServer.mutation(api.conversations.create, {
        userId,
        title: query.slice(0, 60) + (query.length > 60 ? "..." : ""),
        moduleId: moduleId || undefined,
        sourceId: sourceId || undefined,
        essayId: essayId || undefined,
        mode: aiMode,
      });
      convId = conv as string;
    }

    await convexServer.mutation(api.conversations.addMessage, {
      userId,
      conversationId: convId,
      role: "user",
      content: query,
    });

    await convexServer.mutation(api.conversations.addMessage, {
      userId,
      conversationId: convId,
      role: "assistant",
      content: response.content,
      citedChunkIds: chunks.length > 0 ? chunks.slice(0, 5).map((c: { chunkId: string }) => c.chunkId).join(",") : undefined,
    });

    return NextResponse.json({
      conversationId: convId,
      aiPowered: useLLM,
      rateLimit: { remaining: rateLimit.remaining, tokensRemaining: rateLimit.remaining },
      ...response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface RetrievalChunk {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceAuthors: string;
  sourceYear: number;
  text: string;
  score: number;
  citationLabel: string;
}

async function retrieveRelevantChunks(params: {
  userId: string;
  query: string;
  moduleId?: string;
  sourceId?: string;
  essayId?: string;
  limit?: number;
}): Promise<RetrievalChunk[]> {
  const { userId, query, moduleId, sourceId, essayId, limit = 8 } = params;

  let sourceIdsFilter: string[] | undefined;

  if (essayId) {
    const essay = await convexServer.query(api.essays.getById, { userId, essayId });
    if (essay?.evidence) {
      sourceIdsFilter = [...new Set(essay.evidence.map((e: any) => e.sourceId).filter(Boolean) as string[])];
    }
  }

  const keywordResults = await convexServer.query(api.sourceChunks.keywordSearch, {
    userId,
      query,
      moduleId,
      sourceId,
      sourceIds: sourceIdsFilter,
      limit: limit * 2,
    });

  const queryEmbedding = isOpenAIConfigured() ? await generateEmbedding(query).catch(() => null) : null;

  if (queryEmbedding) {
    const semanticResults = await convexServer.action(api.sourceChunks.searchByEmbedding, {
      userId,
      embedding: queryEmbedding,
      sourceId,
      moduleId,
      sourceIds: sourceIdsFilter,
      limit,
    });

    const combined = new Map<string, RetrievalChunk>();

    const maxSemScore = Math.max(...semanticResults.map((r: { score: number }) => r.score), 0.001);
    for (const r of semanticResults) {
      const normalized = r.score / maxSemScore;
      combined.set(r.chunkId, {
        chunkId: r.chunkId,
        sourceId: r.sourceId,
        sourceTitle: r.sourceTitle,
        sourceAuthors: r.sourceAuthors,
        sourceYear: r.sourceYear,
        text: r.text,
        score: Math.round(normalized * 0.7 * 100) / 100,
        citationLabel: `${r.sourceAuthors} (${r.sourceYear})`,
      });
    }

    const maxKwScore = Math.max(...keywordResults.map((r: { score: number }) => r.score), 0.001);
    for (const r of keywordResults) {
      const normalized = r.score / maxKwScore;
      const existing = combined.get(r.chunkId);
      if (existing) {
        existing.score = Math.round((existing.score + normalized * 0.3) * 100) / 100;
      } else {
        combined.set(r.chunkId, {
          chunkId: r.chunkId,
          sourceId: r.sourceId,
          sourceTitle: r.sourceTitle,
          sourceAuthors: r.sourceAuthors,
          sourceYear: r.sourceYear,
          text: r.text,
          score: Math.round(normalized * 0.3 * 100) / 100,
          citationLabel: `${r.sourceAuthors} (${r.sourceYear})`,
        });
      }
    }

    return [...combined.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  return keywordResults.map((r: { chunkId: string; sourceId: string; sourceTitle: string; sourceAuthors: string; sourceYear: number; text: string; score: number }) => ({
    chunkId: r.chunkId,
    sourceId: r.sourceId,
    sourceTitle: r.sourceTitle,
    sourceAuthors: r.sourceAuthors,
    sourceYear: r.sourceYear,
    text: r.text,
    score: r.score,
    citationLabel: `${r.sourceAuthors} (${r.sourceYear})`,
  }));
}

async function generateLLMResponse(
  query: string,
  mode: AIMode,
  chunks: RetrievalChunk[],
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userId: string
) {
  const contextChunks = chunks.map(
    (c) => `From "${c.sourceTitle}" by ${c.sourceAuthors} (${c.sourceYear}):\n${c.text}`
  );

  const promptConfig = {
    mode,
    scope: "whole_module" as AIScope,
    query,
    contextChunks,
  };

  const systemPrompt = buildSystemPrompt(promptConfig);
  const contextBlock = buildContextBlock(contextChunks);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    { role: "system", content: contextBlock },
  ];

  for (const msg of history.slice(0, -1)) {
    messages.push(msg);
  }

  messages.push({ role: "user", content: query });

  const llmResponse = await chat(messages, {
    temperature: mode === "brainstorm" ? 0.7 : 0.3,
    maxTokens: 2048,
    userId,
  });

  return {
    ...processLLMResponse(llmResponse.content, chunks),
    estimatedTokens: llmResponse.usage.totalTokens,
  };
}
