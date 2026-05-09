export type ProviderId = "zai" | "gemini";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  supportsEmbeddings: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  zai: {
    id: "zai",
    name: "z.ai / GLM",
    description: "Zhipu AI GLM models. High-quality reasoning for academic work.",
    models: ["glm-4-plus", "glm-4-air", "glm-4-airx", "glm-4-flash", "glm-4-long"],
    defaultModel: "glm-4-air",
    supportsEmbeddings: false,
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Google Gemini models. Fast and capable for academic analysis.",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    defaultModel: "gemini-2.5-flash",
    supportsEmbeddings: false,
  },
};

export const PROVIDER_LIST: ProviderId[] = ["zai", "gemini"];

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
  provider: ProviderId;
  usage?: {
    tokensIn?: number;
    tokensOut?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
