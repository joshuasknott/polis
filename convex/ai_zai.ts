import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ValidationResult,
} from "./ai_providers";

const DEFAULT_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export async function callZaiProvider(
  apiKey: string,
  messages: ChatMessage[],
  options?: ChatOptions,
): Promise<ChatResponse> {
  const model = options?.model || "glm-4-air";
  const endpoint = process.env.ZAI_API_ENDPOINT || DEFAULT_ENDPOINT;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`z.ai API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model || model,
      provider: "zai",
      usage: {
        tokensIn: data.usage?.prompt_tokens,
        tokensOut: data.usage?.completion_tokens,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateZaiKey(
  apiKey: string,
): Promise<ValidationResult> {
  try {
    const endpoint = process.env.ZAI_API_ENDPOINT || DEFAULT_ENDPOINT;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4-air",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        return { valid: true };
      }

      if (response.status === 401 || response.status === 403) {
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
    return { valid: false, error: "Could not connect to z.ai" };
  }
}
