"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
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

const SOURCE_CONTEXT_SYSTEM_PROMPT = `You are Polis, an academic source-context analyst for university coursework.

Rules:
1. Use ONLY the provided chunks. Do not invent authors, page numbers, facts, citations, or source claims.
2. Every summary, concept, claim, relevance signal, and gap signal must cite a chunk number.
3. If evidence is thin, mark confidence below 0.5 and explain the limitation.
4. Gap signals are soft warnings about missing context or unclear coverage. Do not block the student.
5. Return ONLY JSON with this shape:
{
  "summary": { "content": "string", "confidence": 0.0, "chunk": 1 },
  "concepts": [{ "concept": "string", "definition": "string", "relevance": "string", "confidence": 0.0, "chunk": 1 }],
  "claims": [{ "claim": "string", "context": "string", "strength": "strong|moderate|tentative", "confidence": 0.0, "chunk": 1 }],
  "relevanceSignals": [{ "signalType": "module_context|assessment_candidate|reading_support|method|theory", "title": "string", "rationale": "string", "confidence": 0.0, "chunk": 1 }],
  "gapSignals": [{ "gapCategory": "missing_theory|missing_method|missing_concept|missing_evidence_type|missing_counterargument|rubric_gap|required_reading_missing|weak_source_coverage|scope_gap", "title": "string", "content": "string", "severity": "info|warning|critical", "confidence": 0.0, "suggestedAction": "string", "chunk": 1 }]
}`;

const SOURCE_CONTEXT_EXTRACTOR = "sourceAnalysisAI:v2";
const MAX_CONTEXT_CHUNKS = 16;
const MAX_CONTEXT_CHARS = 14000;

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

interface SourceContextChunk {
  id: Id<"sourceChunks">;
  index: number;
  text: string;
  pageStart?: number;
  pageEnd?: number;
}

interface ParsedSourceContext {
  summary?: {
    content?: string;
    confidence?: number;
    chunk?: number;
  };
  concepts?: Array<{
    concept?: string;
    definition?: string;
    relevance?: string;
    confidence?: number;
    chunk?: number;
  }>;
  claims?: Array<{
    claim?: string;
    context?: string;
    strength?: string;
    confidence?: number;
    chunk?: number;
  }>;
  relevanceSignals?: Array<{
    signalType?: string;
    title?: string;
    rationale?: string;
    confidence?: number;
    chunk?: number;
  }>;
  gapSignals?: Array<{
    gapCategory?: string;
    title?: string;
    content?: string;
    severity?: string;
    confidence?: number;
    suggestedAction?: string;
    chunk?: number;
  }>;
}

export const analyseImportedSource = internalAction({
  args: {
    sourceId: v.id("sources"),
    tokenIdentifier: v.string(),
    importedFileId: v.optional(v.id("importedFiles")),
    batchId: v.optional(v.id("importBatches")),
  },
  handler: async (ctx, args) => {
    const source = await ctx.runQuery(internal.sources.internalGet, {
      sourceId: args.sourceId,
    });
    if (!source || source.tokenIdentifier !== args.tokenIdentifier) {
      throw new Error("Source not found");
    }

    const chunks = await ctx.runQuery(internal.sources.internalListChunks, {
      sourceId: args.sourceId,
    });
    if (!chunks || chunks.length === 0) {
      return { success: false, error: "No chunks available" };
    }

    const chunkInfos: SourceContextChunk[] = chunks
      .slice(0, MAX_CONTEXT_CHUNKS)
      .map((chunk: { _id: Id<"sourceChunks">; chunkIndex: number; text: string; pageStart?: number; pageEnd?: number }) => ({
        id: chunk._id,
        index: chunk.chunkIndex,
        text: chunk.text,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
      }));
    const contextText = buildSourceContextPrompt(source, chunkInfos);

    const { apiKey, model, provider } = await resolveProviderKey(
      ctx,
      args.tokenIdentifier,
    );
    if (!apiKey) {
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "source_context_analysis",
        status: "failed",
        title: "Source context analysis skipped",
        summary: "No AI provider is configured.",
        reversible: false,
        errorMessage: "No AI provider configured",
      });
      return { success: false, error: "No AI provider configured" };
    }

    const response = await callSourceContextAI(
      apiKey,
      provider,
      model,
      contextText,
    );
    if (!response) {
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "source_context_analysis",
        status: "failed",
        title: "Source context analysis failed",
        summary: "The AI provider did not return a response.",
        providerUsed: provider,
        modelUsed: model,
        reversible: false,
        errorMessage: "AI provider returned no content",
      });
      return { success: false, error: "AI provider returned no content" };
    }

    const parsed = parseSourceContextResponse(response);
    if (!parsed) {
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "source_context_analysis",
        status: "failed",
        title: "Source context analysis failed",
        summary: "The structured response could not be parsed.",
        providerUsed: provider,
        modelUsed: model,
        reversible: false,
        errorMessage: "Could not parse source context response",
        output: { rawResponse: response.slice(0, 500) },
      });
      return { success: false, error: "Could not parse source context" };
    }

    const runId = `${SOURCE_CONTEXT_EXTRACTOR}-${Date.now()}`;
    const created = await writeSourceContextOutputs(
      ctx,
      args.tokenIdentifier,
      source.moduleId,
      args.sourceId,
      args.batchId,
      args.importedFileId,
      chunkInfos,
      runId,
      parsed,
    );

    await ctx.runMutation(internal.aiActions.record, {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: source.moduleId,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      operation: "source_context_analysis",
      status: "completed",
      title: "Analysed source context",
      summary: `Created ${created.analysisIds.length} summary item, ${created.conceptIds.length} concepts, ${created.claimIds.length} claims, ${created.relevanceSignalIds.length} relevance signals, and ${created.gapSignalIds.length} gap signals.`,
      providerUsed: provider,
      modelUsed: model,
      reversible: true,
      output: { created },
    });

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: args.tokenIdentifier,
      provider,
      model,
      type: "source_analysis",
      tokensIn: Math.ceil(contextText.length / 4),
      tokensOut: Math.ceil(response.length / 4),
    });

    return { success: true, created };
  },
});

function buildSourceContextPrompt(
  source: { title: string; type: string; authors?: string; year?: number },
  chunks: SourceContextChunk[],
): string {
  const lines = [
    `Source title: ${source.title}`,
    `Source type: ${source.type}`,
  ];
  if (source.authors) lines.push(`Authors: ${source.authors}`);
  if (source.year) lines.push(`Year: ${source.year}`);
  lines.push("\nChunks:");

  let chars = lines.join("\n").length;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const page =
      chunk.pageStart != null
        ? chunk.pageEnd != null && chunk.pageEnd !== chunk.pageStart
          ? ` pp. ${chunk.pageStart}-${chunk.pageEnd}`
          : ` p. ${chunk.pageStart}`
        : "";
    const header = `\n[Chunk ${i + 1}${page}]`;
    const remaining = MAX_CONTEXT_CHARS - chars - header.length;
    if (remaining <= 100) break;
    const text = chunk.text.slice(0, remaining);
    lines.push(`${header}\n${text}`);
    chars += header.length + text.length;
  }

  return lines.join("\n");
}

function parseSourceContextResponse(text: string): ParsedSourceContext | null {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  try {
    return JSON.parse(cleaned) as ParsedSourceContext;
  } catch {}

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1)) as ParsedSourceContext;
    } catch {}
  }

  return null;
}

async function writeSourceContextOutputs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
  sourceId: Id<"sources">,
  batchId: Id<"importBatches"> | undefined,
  importedFileId: Id<"importedFiles"> | undefined,
  chunks: SourceContextChunk[],
  runId: string,
  parsed: ParsedSourceContext,
) {
  const created = {
    analysisIds: [] as string[],
    claimIds: [] as string[],
    conceptIds: [] as string[],
    relevanceSignalIds: [] as string[],
    gapSignalIds: [] as string[],
  };

  const provenanceFor = (
    chunkNum: number | undefined,
    confidence: number | undefined,
    quote?: string,
  ) => {
    const chunk = resolveContextChunk(chunkNum, chunks);
    return {
      source: importedFileId ? ("imported_file" as const) : ("source" as const),
      batchId,
      importedFileId,
      sourceId,
      sourceChunkId: chunk?.id,
      extractor: SOURCE_CONTEXT_EXTRACTOR,
      extractionRunId: runId,
      pageStart: chunk?.pageStart,
      pageEnd: chunk?.pageEnd,
      quote,
      confidence,
      extractedAt: Date.now(),
    };
  };

  const summary = parsed.summary;
  const summaryContent = str(summary?.content);
  if (summaryContent) {
    const confidence = confidenceNum(summary?.confidence);
    const id: Id<"sourceAnalyses"> = await ctx.runMutation(
      internal.sourceAnalyses.internalCreateAnalysis,
      {
        tokenIdentifier,
        sourceId,
        batchId,
        importedFileId,
        sourceChunkId: resolveContextChunk(summary?.chunk, chunks)?.id,
        analysisType: "summary",
        content: summaryContent,
        confidence,
        provenance: provenanceFor(summary?.chunk, confidence, summaryContent.slice(0, 300)),
      },
    );
    created.analysisIds.push(id);
  }

  for (const concept of (parsed.concepts ?? []).slice(0, 12)) {
    const name = str(concept.concept);
    if (!name) continue;
    const confidence = confidenceNum(concept.confidence);
    const id: Id<"sourceConcepts"> = await ctx.runMutation(
      internal.sourceAnalyses.internalCreateConcept,
      {
        tokenIdentifier,
        sourceId,
        batchId,
        importedFileId,
        sourceChunkId: resolveContextChunk(concept.chunk, chunks)?.id,
        concept: name,
        definition: str(concept.definition) ?? undefined,
        relevance: str(concept.relevance) ?? undefined,
        confidence,
        provenance: provenanceFor(concept.chunk, confidence, name),
      },
    );
    created.conceptIds.push(id);
  }

  for (const claim of (parsed.claims ?? []).slice(0, 12)) {
    const text = str(claim.claim);
    if (!text) continue;
    const confidence = confidenceNum(claim.confidence);
    const chunk = resolveContextChunk(claim.chunk, chunks);
    const id: Id<"sourceClaims"> = await ctx.runMutation(
      internal.sourceAnalyses.internalCreateClaim,
      {
        tokenIdentifier,
        sourceId,
        batchId,
        importedFileId,
        sourceChunkId: chunk?.id,
        claim: text,
        context: str(claim.context) ?? undefined,
        pageRange: formatPageRange(chunk),
        strength: normalizeStrength(claim.strength),
        confidence,
        provenance: provenanceFor(claim.chunk, confidence, text.slice(0, 300)),
      },
    );
    created.claimIds.push(id);
  }

  for (const signal of (parsed.relevanceSignals ?? []).slice(0, 8)) {
    const title = str(signal.title);
    const rationale = str(signal.rationale);
    if (!title || !rationale) continue;
    const confidence = confidenceNum(signal.confidence) ?? 0.5;
    const id: Id<"sourceRelevanceSignals"> = await ctx.runMutation(
      internal.sourceAnalyses.internalCreateRelevanceSignal,
      {
        tokenIdentifier,
        moduleId,
        sourceId,
        batchId,
        importedFileId,
        sourceChunkId: resolveContextChunk(signal.chunk, chunks)?.id,
        signalType: str(signal.signalType) ?? "module_context",
        title,
        rationale,
        confidence,
        provenance: provenanceFor(signal.chunk, confidence, rationale.slice(0, 300)),
      },
    );
    created.relevanceSignalIds.push(id);
  }

  for (const signal of (parsed.gapSignals ?? []).slice(0, 8)) {
    const title = str(signal.title);
    const content = str(signal.content);
    if (!title || !content) continue;
    const confidence = confidenceNum(signal.confidence) ?? 0.4;
    const id: Id<"sourceGapSignals"> = await ctx.runMutation(
      internal.sourceAnalyses.internalCreateGapSignal,
      {
        tokenIdentifier,
        moduleId,
        sourceId,
        batchId,
        importedFileId,
        sourceChunkId: resolveContextChunk(signal.chunk, chunks)?.id,
        gapCategory: normalizeGapCategory(signal.gapCategory),
        title,
        content,
        severity: normalizeSeverity(signal.severity),
        confidence,
        suggestedAction: str(signal.suggestedAction) ?? undefined,
        provenance: provenanceFor(signal.chunk, confidence, content.slice(0, 300)),
      },
    );
    created.gapSignalIds.push(id);
  }

  return created;
}

function resolveContextChunk(
  chunkNum: number | undefined,
  chunks: SourceContextChunk[],
): SourceContextChunk | null {
  if (chunkNum == null || chunkNum < 1 || chunkNum > chunks.length) return null;
  return chunks[chunkNum - 1];
}

function formatPageRange(chunk: SourceContextChunk | null): string | undefined {
  if (!chunk || chunk.pageStart == null) return undefined;
  if (chunk.pageEnd == null || chunk.pageEnd === chunk.pageStart) {
    return String(chunk.pageStart);
  }
  return `${chunk.pageStart}-${chunk.pageEnd}`;
}

function normalizeStrength(value: string | undefined): string {
  const lower = (value ?? "").toLowerCase();
  if (lower === "strong" || lower === "moderate" || lower === "tentative") {
    return lower;
  }
  return "moderate";
}

function normalizeSeverity(value: string | undefined): "info" | "warning" | "critical" {
  const lower = (value ?? "").toLowerCase();
  if (lower === "critical" || lower === "warning" || lower === "info") {
    return lower;
  }
  return "warning";
}

type GapSignalCategory =
  | "missing_theory"
  | "missing_method"
  | "missing_concept"
  | "missing_evidence_type"
  | "missing_counterargument"
  | "rubric_gap"
  | "required_reading_missing"
  | "weak_source_coverage"
  | "scope_gap";

function normalizeGapCategory(
  value: string | undefined,
): GapSignalCategory {
  const valid = new Set([
    "missing_theory",
    "missing_method",
    "missing_concept",
    "missing_evidence_type",
    "missing_counterargument",
    "rubric_gap",
    "required_reading_missing",
    "weak_source_coverage",
    "scope_gap",
  ]);
  const lower = (value ?? "").toLowerCase();
  return valid.has(lower) ? (lower as GapSignalCategory) : "scope_gap";
}

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

async function callSourceContextAI(
  apiKey: string,
  provider: ProviderId,
  model: string,
  userPrompt: string,
): Promise<string | null> {
  const messages: ChatMessage[] = [
    { role: "system", content: SOURCE_CONTEXT_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  try {
    let response;
    if (provider === "zai") {
      response = await callZaiProvider(apiKey, messages, {
        model,
        temperature: 0.1,
        maxTokens: 4096,
      });
    } else {
      response = await callGeminiProvider(apiKey, messages, {
        model,
        temperature: 0.1,
        maxTokens: 4096,
      });
    }
    return response.content;
  } catch {
    return null;
  }
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function confidenceNum(value: unknown): number | undefined {
  if (typeof value !== "number" || isNaN(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}
