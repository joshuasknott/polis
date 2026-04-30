import "server-only";
import { openaiChat, isOpenAIConfigured, openaiEmbed, openaiEmbedBatch } from "./openai-provider";
import { anthropicChat, isAnthropicConfigured } from "./anthropic-provider";

export interface AIProviderConfig {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
}

export const providers: AIProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"],
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-latest"],
    defaultModel: "claude-sonnet-4-20250514",
  },
  {
    id: "google",
    name: "Google Gemini",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    defaultModel: "gemini-2.5-pro",
  },
];

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export function getActiveProviderId(): string {
  return process.env.AI_PROVIDER || "openai";
}

export function isAIConfigured(): boolean {
  const provider = getActiveProviderId();
  if (provider === "openai") return isOpenAIConfigured();
  if (provider === "anthropic") return isAnthropicConfigured();
  return false;
}

export function getProviderStatus(): {
  configured: boolean;
  provider: string;
  model: string;
  hasEmbeddings: boolean;
} {
  const provider = getActiveProviderId();
  return {
    configured: isAIConfigured(),
    provider,
    model: process.env.AI_MODEL || providers.find((p) => p.id === provider)?.defaultModel || "gpt-4o-mini",
    hasEmbeddings: isOpenAIConfigured(),
  };
}

export async function chat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const provider = getActiveProviderId();

  if (provider === "openai") {
    return openaiChat(messages, options);
  }

  if (provider === "anthropic") {
    return anthropicChat(messages, options);
  }

  throw new Error(
    `AI provider "${provider}" is not implemented. Set AI_PROVIDER to "openai" or "anthropic".`
  );
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return openaiEmbed(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return openaiEmbedBatch(texts);
}

export { isOpenAIConfigured };
