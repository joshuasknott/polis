import "server-only";

import OpenAI from "openai";
import type { ChatMessage, ChatOptions, ChatResponse } from "./providers";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function openaiChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const client = getClient();
  if (!client) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY in .env");
  }

  const model = options?.model || process.env.AI_MODEL || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error("OpenAI returned an empty response");
  }

  return {
    content: choice.message.content,
    model: response.model,
    usage: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    },
  };
}

export async function openaiEmbed(text: string): Promise<number[]> {
  const client = getClient();
  if (!client) {
    throw new Error("OpenAI API key not configured");
  }

  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  const response = await client.embeddings.create({
    model,
    input: text,
  });

  return response.data[0].embedding;
}

export async function openaiEmbedBatch(texts: string[]): Promise<number[][]> {
  const client = getClient();
  if (!client) {
    throw new Error("OpenAI API key not configured");
  }

  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  const response = await client.embeddings.create({
    model,
    input: texts,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
