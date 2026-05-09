import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ValidationResult,
} from "./ai_providers";

function toGeminiContents(messages: ChatMessage[]) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;
    const role = msg.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  return contents;
}

function extractSystemMessage(messages: ChatMessage[]): string {
  return messages.find((m) => m.role === "system")?.content || "";
}

export async function callGeminiProvider(
  apiKey: string,
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<ChatResponse> {
  const model = options?.model || "gemini-2.5-flash";
  const systemInstruction = extractSystemMessage(messages);
  const contents = toGeminiContents(messages);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
      modelVersion: string;
      usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
      };
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usageMeta = data.usageMetadata;

    return {
      content: text,
      model: data.modelVersion || model,
      provider: "gemini",
      usage: {
        tokensIn: usageMeta?.promptTokenCount,
        tokensOut: usageMeta?.candidatesTokenCount,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateGeminiKey(
  apiKey: string,
): Promise<ValidationResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "test" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 400 || response.status === 403) {
        return { valid: false, error: "Invalid API key" };
      }

      if (response.status === 429) {
        return { valid: true };
      }

      return { valid: false, error: `API returned status ${response.status}` };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: unknown) {
    const name = (err as Error).name;
    if (name === "AbortError") {
      return { valid: false, error: "Connection timed out" };
    }
    return { valid: false, error: "Could not connect to Google Gemini" };
  }
}
