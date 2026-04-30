import "server-only";
import { openaiChat, isOpenAIConfigured, openaiEmbed, openaiEmbedBatch } from "./openai-provider";
import { anthropicChat, isAnthropicConfigured } from "./anthropic-provider";
import { geminiChat, isGeminiConfigured } from "./gemini-provider";
import { getDecryptedApiKey, getModelPreference } from "@/lib/services/apikey-service";
import { logUsage } from "@/lib/services/usage-service";

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
  userId?: string;
  providerId?: string;
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
  if (provider === "google") return isGeminiConfigured();
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
  const userId = options?.userId;
  const requestedProvider = options?.providerId;

  if (requestedProvider && userId) {
    const userKey = await getDecryptedApiKey(userId, requestedProvider);
    if (userKey) {
      const modelPref = await getModelPreference(userId, requestedProvider);
      const model = options.model || modelPref || providers.find((p) => p.id === requestedProvider)?.defaultModel;
      return chatWithKey(requestedProvider, userKey, messages, { ...options, model });
    }
  }

  const provider = getActiveProviderId();

  if (userId) {
    const userKey = await getDecryptedApiKey(userId, provider);
    if (userKey) {
      const modelPref = await getModelPreference(userId, provider);
      const model = options.model || modelPref || undefined;
      const result = await chatWithKey(provider, userKey, messages, { ...options, model });
      if (userId) {
        logUsage({ userId, provider, model: result.model, type: "chat", tokensIn: result.usage.promptTokens, tokensOut: result.usage.completionTokens }).catch(() => {});
      }
      return result;
    }
  }

  let result: ChatResponse;
  if (provider === "openai") {
    result = await openaiChat(messages, options);
  } else if (provider === "anthropic") {
    result = await anthropicChat(messages, options);
  } else if (provider === "google") {
    result = await geminiChat(messages, options);
  } else {
    throw new Error(
      `AI provider "${provider}" is not implemented. Set AI_PROVIDER to "openai", "anthropic", or "google".`
    );
  }

  if (userId) {
    logUsage({ userId, provider, model: result.model, type: "chat", tokensIn: result.usage.promptTokens, tokensOut: result.usage.completionTokens }).catch(() => {});
  }

  return result;
}

async function chatWithKey(
  provider: string,
  apiKey: string,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  if (provider === "openai") {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });
    const model = options?.model || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
    });
    const choice = response.choices[0];
    if (!choice?.message?.content) throw new Error("OpenAI returned empty response");
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

  if (provider === "anthropic") {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });
    const model = options?.model || "claude-sonnet-4-20250514";
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystem = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const response = await client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessage?.content || undefined,
      messages: nonSystem,
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Anthropic returned empty response");
    return {
      content: textBlock.text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  if (provider === "google") {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = options?.model || "gemini-2.5-pro";
    const genModel = genAI.getGenerativeModel({ model });
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const result = await genModel.generateContent({
      contents: nonSystem.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: systemMessage ? { role: "system" as const, parts: [{ text: systemMessage.content }] } : undefined,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });
    const response = result.response;
    return {
      content: response.text(),
      model,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }

  throw new Error(`Provider "${provider}" does not support user-level keys`);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return openaiEmbed(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return openaiEmbedBatch(texts);
}

export { isOpenAIConfigured };
