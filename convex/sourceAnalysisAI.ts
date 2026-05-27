"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  PROVIDERS,
  type ProviderId,
  type ChatMessage,
} from "./ai_providers";
import { decrypt } from "./ai_crypto";
import { callZaiProvider } from "./ai_zai";
import { callGeminiProvider } from "./ai_gemini";

const ANALYSIS_SYSTEM_PROMPT = `You are an academic source analysis assistant. You analyse source text and produce structured academic outputs.

## Rules
1. ONLY analyse the text provided. Do not invent information.
2. Use Harvard citation format: Author (Year, p. X).
3. Be precise and academic in tone.
4. If the text is insufficient for analysis, say so explicitly.
5. Label the strength of claims as: strong, moderate, or tentative.`;

export const analyseSource = action({
  args: {
    sourceId: v.id("sources"),
    analysisTypes: v.optional(
      v.array(
        v.union(
          v.literal("summary"),
          v.literal("main_argument"),
          v.literal("limitations"),
          v.literal("concepts"),
          v.literal("claims"),
        ),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const source = await ctx.runQuery(api.sources.get, {
      sourceId: args.sourceId,
    });
    if (!source) throw new Error("Source not found");

    const chunks = await ctx.runQuery(api.sources.listChunks, {
      sourceId: args.sourceId,
    });

    if (!chunks || chunks.length === 0) {
      return {
        success: false,
        error:
          "No text chunks available for this source. The source may still be processing or the file could not be extracted.",
      };
    }

    const fullText = chunks
      .slice(0, 30)
      .map((c: { text: string }) => c.text)
      .join("\n\n");

    if (fullText.trim().length < 50) {
      return {
        success: false,
        error: "Source text is too short for meaningful analysis.",
      };
    }

    const sourceCitation = source.authors
      ? `${source.authors} (${source.year ?? "n.d."})`
      : source.title;

    const types = args.analysisTypes ?? [
      "summary",
      "main_argument",
      "limitations",
      "concepts",
      "claims",
    ];

    const { apiKey, model, provider } = await resolveProviderKey(
      ctx,
      identity.tokenIdentifier,
    );

    if (!apiKey) {
      return {
        success: false,
        error:
          "No AI provider configured. Please add an API key in Settings or ask an administrator to configure an app-level provider.",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: Record<string, any> = {};

    if (types.includes("summary")) {
      const prompt = `Analyse the following academic source text and write a concise summary (200-300 words).

Source: "${source.title}" by ${sourceCitation}

Text:
${fullText.slice(0, 8000)}

Provide a clear academic summary that identifies:
- The main topic and scope
- Key arguments or findings
- Methodology (if apparent)
- Conclusions

Label: [Source-supported]`;

      const response = await callAI(apiKey, provider, model, prompt);
      if (response) {
        await ctx.runMutation(api.sourceAnalyses.createAnalysis, {
          sourceId: args.sourceId,
          analysisType: "summary",
          content: response,
        });
        results.summary = response;
      }
    }

    if (types.includes("main_argument")) {
      const prompt = `Extract the main argument from the following academic source.

Source: "${source.title}" by ${sourceCitation}

Text:
${fullText.slice(0, 8000)}

Identify:
1. The central thesis or argument
2. Key supporting premises
3. How the argument is structured

Label: [Source-supported]`;

      const response = await callAI(apiKey, provider, model, prompt);
      if (response) {
        await ctx.runMutation(api.sourceAnalyses.createAnalysis, {
          sourceId: args.sourceId,
          analysisType: "main_argument",
          content: response,
        });
        results.main_argument = response;
      }
    }

    if (types.includes("limitations")) {
      const prompt = `Identify the limitations of the following academic source.

Source: "${source.title}" by ${sourceCitation}

Text:
${fullText.slice(0, 8000)}

Consider:
1. Methodological limitations
2. Scope limitations
3. Potential biases
4. What the source does NOT address

Label: [Source-supported] where grounded in the text, [Interpretation] where inferred.`;

      const response = await callAI(apiKey, provider, model, prompt);
      if (response) {
        await ctx.runMutation(api.sourceAnalyses.createAnalysis, {
          sourceId: args.sourceId,
          analysisType: "limitations",
          content: response,
        });
        results.limitations = response;
      }
    }

    if (types.includes("concepts")) {
      const prompt = `Extract the key academic concepts from the following source.

Source: "${source.title}" by ${sourceCitation}

Text:
${fullText.slice(0, 8000)}

List the 5-10 most important concepts. For each, provide:
- Concept name
- Brief definition as used in this source
- Why it matters to the argument

Format as a numbered list. Label: [Source-supported]`;

      const response = await callAI(apiKey, provider, model, prompt);
      if (response) {
        const conceptLines = response
          .split("\n")
          .filter(
            (line: string) =>
              line.trim().length > 0 &&
              /^\d+[\.\)]\s/.test(line.trim()),
          )
          .slice(0, 10);

        for (const line of conceptLines) {
          const cleanLine = line.replace(/^\d+[\.\)]\s*/, "").trim();
          const colonIdx = cleanLine.indexOf(":");
          const dashIdx = cleanLine.indexOf(" - ");
          const sepIdx =
            colonIdx > 0 && colonIdx < 60
              ? colonIdx
              : dashIdx > 0
                ? dashIdx
                : -1;

          const concept =
            sepIdx > 0
              ? cleanLine.slice(0, sepIdx).trim()
              : cleanLine.slice(0, 60).trim();
          const definition =
            sepIdx > 0 ? cleanLine.slice(sepIdx + 1).trim() : undefined;

          if (concept && concept.length > 0 && concept.length < 100) {
            try {
              await ctx.runMutation(api.sourceAnalyses.createConcept, {
                sourceId: args.sourceId,
                concept,
                definition,
              });
            } catch {}
          }
        }
        results.concepts = response;
      }
    }

    if (types.includes("claims")) {
      const prompt = `Extract the key claims made in the following academic source.

Source: "${source.title}" by ${sourceCitation}

Text:
${fullText.slice(0, 8000)}

List the 5-10 most important claims. For each, provide:
- The claim (a clear statement)
- Brief context
- Page reference if available
- Strength: strong, moderate, or tentative

Format as a numbered list. Label: [Source-supported]`;

      const response = await callAI(apiKey, provider, model, prompt);
      if (response) {
        results.claims = response;
      }
    }

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: identity.tokenIdentifier,
      provider,
      model,
      type: "source_analysis",
      tokensIn: Math.ceil(fullText.length / 4),
      tokensOut: Math.ceil(
        Object.values(results).reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, r: any) => sum + (r?.length ?? 0),
          0,
        ) / 4,
      ),
    });

    return { success: true, results };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProviderKey(ctx: any, tokenIdentifier: string): Promise<{
  apiKey: string | null;
  model: string;
  provider: ProviderId;
}> {
  const configuredProvider = process.env.AI_PROVIDER;
  const provider: ProviderId =
    configuredProvider === "gemini" ? "gemini" : "zai";
  const defaultModel =
    process.env.AI_MODEL || PROVIDERS[provider]?.defaultModel || "glm-4-air";

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (encryptionKey) {
    const encrypted = await ctx.runQuery(
      internal.ai_keys.internalGetEncryptedKey,
      { tokenIdentifier, provider },
    );
    if (encrypted?.encryptedKey) {
      try {
        const apiKey = await decrypt(encrypted.encryptedKey, encryptionKey);
        const model =
          encrypted.modelPreference || defaultModel;
        return { apiKey, model, provider };
      } catch {}
    }
  }

  const envMap: Record<ProviderId, string> = {
    zai: "ZAI_API_KEY",
    gemini: "GEMINI_API_KEY",
  };
  const apiKey = process.env[envMap[provider]] || null;
  return { apiKey, model: defaultModel, provider };
}

async function callAI(
  apiKey: string,
  provider: ProviderId,
  model: string,
  userPrompt: string,
): Promise<string | null> {
  const messages: ChatMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  try {
    let response;
    if (provider === "zai") {
      response = await callZaiProvider(apiKey, messages, { model });
    } else {
      response = await callGeminiProvider(apiKey, messages, { model });
    }
    return response.content;
  } catch {
    return null;
  }
}
