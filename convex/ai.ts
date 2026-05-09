import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  PROVIDERS,
  PROVIDER_LIST,
  type ProviderId,
  type ChatMessage,
} from "./ai_providers";
import { buildSystemPrompt, type CoThinkerStage } from "./ai_prompts";
import { encrypt, decrypt } from "./ai_crypto";
import { callZaiProvider, validateZaiKey } from "./ai_zai";
import { callGeminiProvider, validateGeminiKey } from "./ai_gemini";

function getAppLevelKey(provider: ProviderId): string | null {
  const envMap: Record<ProviderId, string> = {
    zai: "ZAI_API_KEY",
    gemini: "GEMINI_API_KEY",
  };
  return process.env[envMap[provider]] || null;
}

function getDefaultProvider(): { provider: ProviderId; model: string } {
  const provider = (process.env.AI_PROVIDER as ProviderId) || "zai";
  const model =
    process.env.AI_MODEL || PROVIDERS[provider]?.defaultModel || "glm-4-air";
  return { provider, model };
}

export const getProviderStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { configured: false, provider: null as string | null, model: null as string | null };
    }

    const connections = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .filter((q) => q.eq(q.field("status"), "connected"))
      .first();

    if (connections) {
      const providerConfig = PROVIDERS[connections.provider as ProviderId];
      return {
        configured: true,
        provider: connections.provider,
        model:
          connections.modelPreference ||
          providerConfig?.defaultModel ||
          null,
      };
    }

    const defaultConfig = getDefaultProvider();
    const appKey = getAppLevelKey(defaultConfig.provider);
    if (appKey) {
      return {
        configured: true,
        provider: defaultConfig.provider,
        model: defaultConfig.model,
      };
    }

    return {
      configured: false,
      provider: null as string | null,
      model: null as string | null,
    };
  },
});

export const listProviders = query({
  args: {},
  handler: async () => {
    return PROVIDER_LIST.map((id) => {
      const config = PROVIDERS[id];
      const appKeySet = !!getAppLevelKey(id);
      return {
        ...config,
        appKeyAvailable: appKeySet,
      };
    });
  },
});

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      }),
    ),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    stage: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const targetProvider =
      (args.provider as ProviderId) || getDefaultProvider().provider;

    let apiKey: string | null = null;
    let resolvedModel =
      args.model || getDefaultProvider().model;

    const identity = await ctx.auth.getUserIdentity();
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (identity && encryptionKey) {
      const encrypted = await ctx.runQuery(
        internal.ai_keys.internalGetEncryptedKey,
        {
          tokenIdentifier: identity.tokenIdentifier,
          provider: targetProvider,
        },
      );
      if (encrypted?.encryptedKey) {
        try {
          apiKey = await decrypt(encrypted.encryptedKey, encryptionKey);
          resolvedModel =
            args.model ||
            encrypted.modelPreference ||
            PROVIDERS[targetProvider]?.defaultModel ||
            resolvedModel;
        } catch {
          // Decryption failed, fall through to app-level key
        }
      }
    }

    if (!apiKey) {
      apiKey = getAppLevelKey(targetProvider);
    }

    if (!apiKey) {
      return {
        content:
          "No AI provider is configured. Please add an API key in Settings, or ask your administrator to configure an app-level provider.",
        provider: targetProvider,
        model: "none",
        usage: { tokensIn: 0, tokensOut: 0 },
        label: "no-provider" as const,
      };
    }

    const systemPrompt = buildSystemPrompt(
      args.stage as CoThinkerStage | undefined,
      args.sources,
    );

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let response;
    try {
      if (targetProvider === "zai") {
        response = await callZaiProvider(apiKey, chatMessages, {
          model: resolvedModel,
        });
      } else if (targetProvider === "gemini") {
        response = await callGeminiProvider(apiKey, chatMessages, {
          model: resolvedModel,
        });
      } else {
        return {
          content: `Unknown provider: ${targetProvider}`,
          provider: targetProvider,
          model: resolvedModel,
          usage: { tokensIn: 0, tokensOut: 0 },
          label: "error" as const,
        };
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unknown error";
      const safeError =
        msg.includes("auth") || msg.includes("key") || msg.includes("401")
          ? "Authentication error with AI provider. Please check your API key."
          : "The AI provider returned an error. Please try again later.";

      return {
        content: safeError,
        provider: targetProvider,
        model: resolvedModel,
        usage: { tokensIn: 0, tokensOut: 0 },
        label: "error" as const,
      };
    }

    if (identity) {
      await ctx.runMutation(internal.ai_keys.internalLogUsage, {
        tokenIdentifier: identity.tokenIdentifier,
        provider: targetProvider,
        model: response.model,
        type: "chat",
        tokensIn: response.usage?.tokensIn,
        tokensOut: response.usage?.tokensOut,
      });
    }

    return {
      ...response,
      label: "success" as const,
    };
  },
});

export const validateAndSaveKey = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    modelPreference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const providerId = args.provider as ProviderId;
    const providerConfig = PROVIDERS[providerId];
    if (!providerConfig) {
      return { success: false, error: `Unknown provider: ${args.provider}` };
    }

    let valid = false;
    let validationError: string | undefined;

    try {
      if (providerId === "zai") {
        const result = await validateZaiKey(args.apiKey);
        valid = result.valid;
        validationError = result.error;
      } else if (providerId === "gemini") {
        const result = await validateGeminiKey(args.apiKey);
        valid = result.valid;
        validationError = result.error;
      }
    } catch {
      return {
        success: false,
        error: "Validation request failed. Please check your key and try again.",
      };
    }

    if (!valid) {
      return { success: false, error: validationError || "Invalid API key" };
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return {
        success: false,
        error:
          "Server encryption not configured. Contact your administrator to set ENCRYPTION_KEY.",
      };
    }

    const encryptedKey = await encrypt(args.apiKey, encryptionKey);

    await ctx.runMutation(internal.ai_keys.internalStoreConnection, {
      tokenIdentifier: identity.tokenIdentifier,
      provider: args.provider,
      status: "connected",
      modelPreference: args.modelPreference,
      encryptedCredentialRef: encryptedKey,
    });

    return { success: true };
  },
});

export const removeProviderKey = action({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.runMutation(internal.ai_keys.internalRemoveConnection, {
      tokenIdentifier: identity.tokenIdentifier,
      provider: args.provider,
    });

    return { success: true };
  },
});
