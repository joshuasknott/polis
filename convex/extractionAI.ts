"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  PROVIDERS,
  type ProviderId,
  type ChatMessage,
} from "./ai_providers";
import { decrypt } from "./ai_crypto";
import { callZaiProvider } from "./ai_zai";
import { callGeminiProvider } from "./ai_gemini";

const EXTRACTOR_VERSION = "extractionAI:v1";

const MAX_CHUNKS = 40;
const MAX_CONTEXT_CHARS = 16000;
const MAX_ASSESSMENTS = 10;
const MAX_RUBRIC_PER_SPEC = 15;
const MAX_TOPICS = 30;
const MAX_READINGS = 40;

const EXTRACTION_SYSTEM_PROMPT = `You are an academic document extraction assistant for university module materials. You extract structured information from handbooks, syllabi, assignment briefs, rubrics, and reading lists.

## Critical Rules — ACADEMIC INTEGRITY
1. ONLY extract information explicitly present in the provided text. NEVER fabricate.
2. NEVER invent dates, weights, titles, authors, page numbers, word limits, or rules.
3. If a field is not present in the text, OMIT it from the JSON. Do not include null or empty values.
4. If information is ambiguous or inferred (not explicitly stated), include it but set "uncertain": true.
5. For every extracted value, cite the chunk number where it was found using "chunk" (1-based integer matching the [Chunk N] labels).
6. For weight values, extract the numeric percentage (e.g., "50%" → 50). If only descriptive ("heavily weighted"), omit the weight.
7. Recommended readings (not required) must have "kind": "recommended". Required readings have "kind": "required".
8. Do NOT fabricate reading list entries. Only extract readings that are explicitly listed in the text.

## Output Format
Return ONLY a JSON object (no markdown fences, no commentary) with this structure. Omit any top-level key or field that is not found in the text:

{
  "assessments": [
    {
      "title": "string — assessment title",
      "question": "string — full question/prompt/task description",
      "deadline": "string — deadline as stated (preserve original format)",
      "weight": number — percentage as integer,
      "wordLimit": number — word count limit as integer,
      "referencingRule": "string — referencing style/rules",
      "submissionFormat": "string — submission format requirements",
      "uncertain": boolean — true if any field is ambiguous,
      "chunk": number — primary chunk where this assessment was found,
      "rubric": [
        { "name": "string", "description": "string", "weight": number, "chunk": number }
      ],
      "requiredReadings": [
        { "title": "string", "authors": "string or omit", "year": number or omit, "chunk": number }
      ]
    }
  ],
  "moduleFacts": {
    "title": { "value": "string", "chunk": number },
    "code": { "value": "string", "chunk": number },
    "academicYear": { "value": "string", "chunk": number },
    "semester": { "value": "string", "chunk": number },
    "description": { "value": "string", "chunk": number },
    "themes": { "value": "JSON array of strings or newline-separated", "chunk": number },
    "concepts": { "value": "JSON array of strings or newline-separated", "chunk": number },
    "learningOutcomes": { "value": "JSON array of strings or newline-separated", "chunk": number },
    "integrityGuidance": { "value": "string — snippet about academic integrity/plagiarism/AI policy", "chunk": number },
    "submissionFormat": { "value": "string — general submission rules", "chunk": number },
    "referencingRules": { "value": "string — general referencing rules", "chunk": number }
  },
  "weeklyTopics": [
    { "weekNumber": number or omit, "title": "string", "description": "string or omit", "chunk": number }
  ],
  "readings": [
    { "title": "string", "authors": "string or omit", "year": number or omit, "kind": "required or recommended", "weekNumber": number or omit, "chunk": number }
  ]
}`;

interface ChunkInfo {
  id: Id<"sourceChunks">;
  index: number;
  text: string;
  pageStart?: number;
  pageEnd?: number;
}

interface ParsedExtraction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assessments?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moduleFacts?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weeklyTopics?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readings?: any[];
}

export const extractFromSource = action({
  args: {
    sourceId: v.id("sources"),
    importedFileId: v.optional(v.id("importedFiles")),
    batchId: v.optional(v.id("importBatches")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const tokenIdentifier = identity.tokenIdentifier;

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
          "No text chunks available for this source. The source may still be processing.",
      };
    }

    const chunkInfos: ChunkInfo[] = chunks
      .slice(0, MAX_CHUNKS)
      .map((c: { _id: Id<"sourceChunks">; chunkIndex: number; text: string; pageStart?: number; pageEnd?: number }) => ({
        id: c._id,
        index: c.chunkIndex,
        text: c.text,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
      }));

    const chunkContext = buildChunkContext(chunkInfos);
    if (chunkContext.trim().length < 50) {
      return {
        success: false,
        error: "Source text is too short for meaningful extraction.",
      };
    }

    const { apiKey, model, provider } = await resolveProviderKey(
      ctx,
      tokenIdentifier,
    );

    if (!apiKey) {
      return {
        success: false,
        error:
          "No AI provider configured. Add an API key in Settings or configure an app-level provider.",
      };
    }

    const extractionType = describeExtractionType(source.type);
    const userPrompt = buildUserPrompt(
      source.title,
      source.type,
      extractionType,
      chunkContext,
    );

    const response = await callExtractionAI(apiKey, provider, model, userPrompt);
    if (!response) {
      return {
        success: false,
        error: "AI extraction failed. The provider did not return a response.",
      };
    }

    const parsed = parseJsonResponse(response);
    if (!parsed) {
      return {
        success: false,
        error: "AI returned an unparseable response. Try re-running extraction.",
        rawResponse: response.slice(0, 500),
      };
    }

    const runId = `${EXTRACTOR_VERSION}-${Date.now()}`;
    const baseProvenance = {
      source: args.importedFileId ? ("imported_file" as const) : ("source" as const),
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      extractor: EXTRACTOR_VERSION,
      extractionRunId: runId,
      extractedAt: Date.now(),
    };

    await ctx.runMutation(internal.extraction._supersedeForSource, {
      moduleId: source.moduleId,
      sourceId: args.sourceId,
    });

    const result = await writeExtractedData(
      ctx,
      tokenIdentifier,
      source.moduleId,
      args.sourceId,
      chunkInfos,
      baseProvenance,
      parsed,
      args.batchId,
      args.importedFileId,
    );

    await ctx.runMutation(internal.aiActions.record, {
      tokenIdentifier,
      moduleId: source.moduleId,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      operation: "context_extraction",
      status: "completed",
      title: "Extracted workspace context",
      summary: `Found ${result.assessmentSpecs} assessment specs, ${result.moduleFacts} module facts, ${result.weeklyTopics} weekly topics, and ${result.readings} readings.`,
      providerUsed: provider,
      modelUsed: model,
      reversible: true,
      output: result,
    });

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier,
      provider,
      model,
      type: "extraction",
      tokensIn: Math.ceil(chunkContext.length / 4),
      tokensOut: Math.ceil(response.length / 4),
    });

    return { success: true, runId, ...result };
  },
});

export const extractImportedSource = internalAction({
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
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "context_extraction",
        status: "failed",
        title: "Workspace context extraction failed",
        summary: "No chunks were available after source processing.",
        reversible: false,
        errorMessage: "No text chunks available for this source.",
      });
      return { success: false, error: "No chunks available" };
    }

    const chunkInfos: ChunkInfo[] = chunks
      .slice(0, MAX_CHUNKS)
      .map((c: { _id: Id<"sourceChunks">; chunkIndex: number; text: string; pageStart?: number; pageEnd?: number }) => ({
        id: c._id,
        index: c.chunkIndex,
        text: c.text,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
      }));

    const chunkContext = buildChunkContext(chunkInfos);
    if (chunkContext.trim().length < 50) {
      return { success: false, error: "Source text is too short" };
    }

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
        operation: "context_extraction",
        status: "failed",
        title: "Workspace context extraction skipped",
        summary: "No AI provider is configured.",
        reversible: false,
        errorMessage: "No AI provider configured",
      });
      return { success: false, error: "No AI provider configured" };
    }

    const extractionType = describeExtractionType(source.type);
    const userPrompt = buildUserPrompt(
      source.title,
      source.type,
      extractionType,
      chunkContext,
    );

    const response = await callExtractionAI(apiKey, provider, model, userPrompt);
    if (!response) {
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "context_extraction",
        status: "failed",
        title: "Workspace context extraction failed",
        summary: "The AI provider did not return a response.",
        providerUsed: provider,
        modelUsed: model,
        reversible: false,
        errorMessage: "AI extraction failed",
      });
      return { success: false, error: "AI extraction failed" };
    }

    const parsed = parseJsonResponse(response);
    if (!parsed) {
      await ctx.runMutation(internal.aiActions.record, {
        tokenIdentifier: args.tokenIdentifier,
        moduleId: source.moduleId,
        batchId: args.batchId,
        importedFileId: args.importedFileId,
        sourceId: args.sourceId,
        operation: "context_extraction",
        status: "failed",
        title: "Workspace context extraction failed",
        summary: "The AI response could not be parsed.",
        providerUsed: provider,
        modelUsed: model,
        reversible: false,
        errorMessage: "Could not parse extraction response",
        output: { rawResponse: response.slice(0, 500) },
      });
      return { success: false, error: "Could not parse extraction response" };
    }

    const runId = `${EXTRACTOR_VERSION}-${Date.now()}`;
    const baseProvenance = {
      source: args.importedFileId ? ("imported_file" as const) : ("source" as const),
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      extractor: EXTRACTOR_VERSION,
      extractionRunId: runId,
      extractedAt: Date.now(),
    };

    await ctx.runMutation(internal.extraction._supersedeForSource, {
      moduleId: source.moduleId,
      sourceId: args.sourceId,
    });

    const result = await writeExtractedData(
      ctx,
      args.tokenIdentifier,
      source.moduleId,
      args.sourceId,
      chunkInfos,
      baseProvenance,
      parsed,
      args.batchId,
      args.importedFileId,
    );

    await ctx.runMutation(internal.aiActions.record, {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: source.moduleId,
      batchId: args.batchId,
      importedFileId: args.importedFileId,
      sourceId: args.sourceId,
      operation: "context_extraction",
      status: "completed",
      title: "Extracted workspace context",
      summary: `Found ${result.assessmentSpecs} assessment specs, ${result.moduleFacts} module facts, ${result.weeklyTopics} weekly topics, and ${result.readings} readings.`,
      providerUsed: provider,
      modelUsed: model,
      reversible: true,
      output: result,
    });

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: args.tokenIdentifier,
      provider,
      model,
      type: "extraction",
      tokensIn: Math.ceil(chunkContext.length / 4),
      tokensOut: Math.ceil(response.length / 4),
    });

    return { success: true, runId, ...result };
  },
});

function buildChunkContext(chunks: ChunkInfo[]): string {
  const parts: string[] = [];
  let totalChars = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNum = i + 1;
    const pageLabel =
      chunk.pageStart != null
        ? chunk.pageEnd != null && chunk.pageEnd !== chunk.pageStart
          ? ` (pp. ${chunk.pageStart}\u2013${chunk.pageEnd})`
          : ` (p. ${chunk.pageStart})`
        : "";
    const header = `[Chunk ${chunkNum}]${pageLabel}`;
    const available = MAX_CONTEXT_CHARS - totalChars;
    if (available <= header.length + 10) break;
    const text = chunk.text.slice(0, available - header.length - 2);
    parts.push(`${header}\n${text}`);
    totalChars += header.length + text.length + 2;
  }

  return parts.join("\n\n");
}

function describeExtractionType(sourceType: string): string {
  switch (sourceType) {
    case "module_handbook":
      return "a module handbook. Extract module-level facts (title, code, themes, learning outcomes, weekly topics, required/recommended readings, integrity guidance). Also extract any assessment briefs embedded in the handbook.";
    case "assignment_brief":
      return "an assignment brief. Extract the assessment title, question/prompt, deadline, weight, word limit, referencing rules, submission format, rubric criteria, and any required readings.";
    case "marking_rubric":
      return "a marking rubric. Extract the rubric criteria (criterion name, description, weight) and any assessment context. If there is an assessment title or question in the rubric document, include it.";
    default:
      return "a university module document. Extract any assessment specifications, module facts, weekly topics, and reading lists present in the text.";
  }
}

function buildUserPrompt(
  sourceTitle: string,
  sourceType: string,
  extractionType: string,
  chunkContext: string,
): string {
  return `## Source
Title: "${sourceTitle}"
Type: ${sourceType}
This document is ${extractionType}

## Document Text
${chunkContext}

## Task
Extract all relevant structured information from the document text above. Follow the JSON output format from your instructions precisely.

Remember:
- Only extract what is explicitly in the text.
- Cite the chunk number for every value.
- Mark uncertain extractions with "uncertain": true.
- Omit fields that are not present — do NOT guess or fabricate.
- Return ONLY the JSON object.`;
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
        const model = encrypted.modelPreference || defaultModel;
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

async function callExtractionAI(
  apiKey: string,
  provider: ProviderId,
  model: string,
  userPrompt: string,
): Promise<string | null> {
  const messages: ChatMessage[] = [
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
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

function parseJsonResponse(text: string): ParsedExtraction | null {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as ParsedExtraction;
  } catch {}

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1),
      ) as ParsedExtraction;
    } catch {}
  }

  return null;
}

function resolveChunk(
  chunkNum: number | undefined,
  chunks: ChunkInfo[],
): { chunkId?: Id<"sourceChunks">; pageStart?: number; pageEnd?: number } {
  if (chunkNum == null || chunkNum < 1 || chunkNum > chunks.length) {
    return {};
  }
  const chunk = chunks[chunkNum - 1];
  return {
    chunkId: chunk.id,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
  };
}

async function writeExtractedData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
  sourceId: Id<"sources">,
  chunks: ChunkInfo[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseProvenance: any,
  parsed: ParsedExtraction,
  batchId: Id<"importBatches"> | undefined,
  importedFileId: Id<"importedFiles"> | undefined,
): Promise<{
  assessmentSpecs: number;
  moduleFacts: number;
  weeklyTopics: number;
  readings: number;
}> {
  let specCount = 0;
  let factCount = 0;
  let topicCount = 0;
  let readingCount = 0;

  if (parsed.assessments) {
    for (const assessment of parsed.assessments.slice(0, MAX_ASSESSMENTS)) {
      const title = str(assessment.title);
      if (!title) continue;

      const chunkRef = resolveChunk(num(assessment.chunk), chunks);
      const specProvenance = {
        ...baseProvenance,
        ...chunkRef,
        confidence: num(assessment.confidence),
        quote: str(assessment.title) ?? undefined,
      };

      const specId: Id<"assessmentSpecs"> = await ctx.runMutation(
        internal.extraction._writeAssessmentSpec,
        {
          tokenIdentifier,
          moduleId,
          title,
          question: str(assessment.question) ?? undefined,
          deadline: str(assessment.deadline) ?? undefined,
          weight: num(assessment.weight),
          wordLimit: num(assessment.wordLimit),
          referencingRule: str(assessment.referencingRule) ?? undefined,
          submissionFormat: str(assessment.submissionFormat) ?? undefined,
          uncertain: bool(assessment.uncertain),
          batchId,
          importedFileId,
          provenance: specProvenance,
        },
      );
      specCount++;

      if (Array.isArray(assessment.rubric)) {
        for (
          let i = 0;
          i < assessment.rubric.length && i < MAX_RUBRIC_PER_SPEC;
          i++
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const criterion: any = assessment.rubric[i];
          const name = str(criterion.name);
          if (!name) continue;
          const critChunk = resolveChunk(num(criterion.chunk), chunks);
          await ctx.runMutation(
            internal.extraction._writeRubricCriterion,
            {
              tokenIdentifier,
              assessmentSpecId: specId,
              name,
              description: str(criterion.description) ?? undefined,
              weight: num(criterion.weight),
              sortOrder: i,
              provenance: { ...baseProvenance, ...critChunk },
            },
          );
        }
      }

      if (Array.isArray(assessment.requiredReadings)) {
        for (const reading of assessment.requiredReadings.slice(0, MAX_READINGS)) {
          const rTitle = str(reading.title);
          if (!rTitle) continue;
          const rChunk = resolveChunk(num(reading.chunk), chunks);
          await ctx.runMutation(
            internal.extraction._writeRequiredReading,
            {
              tokenIdentifier,
              moduleId,
              title: rTitle,
              authors: str(reading.authors) ?? undefined,
              year: num(reading.year),
              kind: "required",
              sortOrder: readingCount,
              batchId,
              importedFileId,
              sourceId,
              provenance: { ...baseProvenance, ...rChunk },
            },
          );
          readingCount++;
        }
      }
    }
  }

  if (parsed.moduleFacts && typeof parsed.moduleFacts === "object") {
    const fieldMap: Record<string, string> = {
      title: "title",
      code: "code",
      academicYear: "academic_year",
      semester: "semester",
      description: "description",
      themes: "themes",
      concepts: "concepts",
      learningOutcomes: "learning_outcomes",
      integrityGuidance: "integrity_guidance",
      submissionFormat: "submission_format",
      referencingRules: "referencing_rules",
    };

    for (const [jsonKey, schemaField] of Object.entries(fieldMap)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry: any = (parsed.moduleFacts as any)[jsonKey];
      if (!entry) continue;
      const value = str(entry.value);
      if (!value) continue;

      const chunkRef = resolveChunk(num(entry.chunk), chunks);
      await ctx.runMutation(internal.extraction._writeModuleFact, {
        tokenIdentifier,
        moduleId,
        field: schemaField,
        value,
        uncertain: bool(entry.uncertain),
        batchId,
        importedFileId,
        provenance: { ...baseProvenance, ...chunkRef },
      });
      factCount++;
    }
  }

  if (parsed.weeklyTopics) {
    for (
      let i = 0;
      i < parsed.weeklyTopics.length && i < MAX_TOPICS;
      i++
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topic: any = parsed.weeklyTopics[i];
      const title = str(topic.title);
      if (!title) continue;
      const chunkRef = resolveChunk(num(topic.chunk), chunks);
      await ctx.runMutation(internal.extraction._writeWeeklyTopic, {
        tokenIdentifier,
        moduleId,
        weekNumber: num(topic.weekNumber),
        title,
        description: str(topic.description) ?? undefined,
        sortOrder: i,
        batchId,
        importedFileId,
        sourceId,
        provenance: { ...baseProvenance, ...chunkRef },
      });
      topicCount++;
    }
  }

  if (parsed.readings) {
    for (
      let i = 0;
      i < parsed.readings.length && i < MAX_READINGS;
      i++
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reading: any = parsed.readings[i];
      const rTitle = str(reading.title);
      if (!rTitle) continue;
      const rChunk = resolveChunk(num(reading.chunk), chunks);
      const kind = str(reading.kind) === "recommended" ? "recommended" : "required";
      await ctx.runMutation(internal.extraction._writeRequiredReading, {
        tokenIdentifier,
        moduleId,
        title: rTitle,
        authors: str(reading.authors) ?? undefined,
        year: num(reading.year),
        kind,
        weekNumber: num(reading.weekNumber),
        sortOrder: readingCount,
        batchId,
        importedFileId,
        sourceId,
        provenance: { ...baseProvenance, ...rChunk },
      });
      readingCount++;
    }
  }

  return {
    assessmentSpecs: specCount,
    moduleFacts: factCount,
    weeklyTopics: topicCount,
    readings: readingCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function str(val: any): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function num(val: any): number | undefined {
  if (val == null) return undefined;
  if (typeof val === "number") return isNaN(val) ? undefined : val;
  const n = parseFloat(String(val));
  return isNaN(n) ? undefined : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bool(val: any): boolean | undefined {
  if (val == null) return undefined;
  if (typeof val === "boolean") return val;
  return undefined;
}
