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
    defaultModel: "gpt-4o",
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

export async function chat(
  _messages: ChatMessage[],
  _options?: ChatOptions
): Promise<ChatResponse> {
  throw new Error(
    "AI provider not configured. Connect an API key in Settings to enable AI features."
  );
}
