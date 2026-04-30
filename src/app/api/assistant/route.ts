import { auth } from "@/lib/auth";
import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { generateRetrievalAwareResponse } from "@/lib/ai/grounded-provider";
import { processLLMResponse } from "@/lib/ai/response-processor";
import { chat, isAIConfigured } from "@/lib/ai/providers";
import { buildSystemPrompt, buildContextBlock } from "@/lib/ai/prompts";
import {
  addConversationMessage,
  createConversation,
  getConversationById,
} from "@/lib/services/data-service";
import type { AIMode, AIScope } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, moduleId, sourceId, essayId, mode, conversationId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const aiMode: AIMode = mode || "source_grounded";

    const chunks = await retrieveRelevantChunks({
      userId: session.user.id,
      query,
      moduleId,
      sourceId,
      essayId,
      limit: 8,
      retrievalMode: "hybrid",
    });

    let convId = conversationId;
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (convId) {
      const existing = await getConversationById(session.user.id, convId);
      if (existing) {
        const last10 = existing.messages.slice(-10);
        conversationHistory = last10.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    }

    const useLLM = isAIConfigured();
    let response;

    if (useLLM) {
      response = await generateLLMResponse(query, aiMode, chunks, conversationHistory);
    } else {
      response = generateRetrievalAwareResponse({
        query,
        mode: aiMode,
        chunks,
      });
    }

    if (!convId) {
      const conv = await createConversation(session.user.id, {
        title: query.slice(0, 60) + (query.length > 60 ? "..." : ""),
        moduleId: moduleId || undefined,
        sourceId: sourceId || undefined,
        essayId: essayId || undefined,
        mode: aiMode,
      });
      convId = conv.id;
    }

    await addConversationMessage(convId, {
      role: "user",
      content: query,
    });

    await addConversationMessage(convId, {
      role: "assistant",
      content: response.content,
      citedChunkIds: chunks.length > 0 ? chunks.slice(0, 5).map((c) => c.chunkId).join(",") : undefined,
    });

    return NextResponse.json({
      conversationId: convId,
      aiPowered: useLLM,
      ...response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateLLMResponse(
  query: string,
  mode: AIMode,
  chunks: Array<{
    chunkId: string;
    sourceId: string;
    sourceTitle: string;
    sourceAuthors: string;
    sourceYear: number;
    text: string;
    score: number;
    citationLabel: string;
  }>,
  history: Array<{ role: "user" | "assistant"; content: string }>
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
  });

  return processLLMResponse(llmResponse.content, chunks);
}
