import "server-only";

import type { ChatMessage, ChatOptions, ChatResponse } from "./providers";

export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

export async function geminiChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("Google AI API key not configured. Set GOOGLE_AI_API_KEY in .env");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

  const model = options?.model || "gemini-2.5-pro";
  const genModel = genAI.getGenerativeModel({ model });

  const systemMessage = messages.find((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  const result = await genModel.generateContent({
    contents: nonSystem.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    systemInstruction: systemMessage
      ? { role: "system" as const, parts: [{ text: systemMessage.content }] }
      : undefined,
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
