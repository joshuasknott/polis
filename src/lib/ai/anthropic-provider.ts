import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ChatOptions, ChatResponse } from "./providers";

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function anthropicChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const client = getClient();
  if (!client) {
    throw new Error("Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env");
  }

  const model = options?.model || "claude-sonnet-4-20250514";

  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create({
    model,
    max_tokens: options?.maxTokens ?? 2048,
    system: systemMessage?.content || undefined,
    messages: nonSystemMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic returned an empty response");
  }

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
