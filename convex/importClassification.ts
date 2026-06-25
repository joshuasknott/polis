"use node";

import { action, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { PROVIDERS, type ProviderId, type ChatMessage } from "./ai_providers";
import { decrypt } from "./ai_crypto";
import { callZaiProvider } from "./ai_zai";
import { callGeminiProvider } from "./ai_gemini";
import { extractText } from "./ingestion/process";
import {
  isSupportedFileType,
  normalizeFileType,
} from "./ingestion/lib";
import {
  CLASSIFICATION_LABELS,
  isValidLabel,
  type ClassificationLabel,
} from "./imports";
import type { Id } from "./_generated/dataModel";

const AUTO_ACCEPT_THRESHOLD = 0.8;
const MAX_TEXT_CHARS = 6000;

const CLASSIFICATION_SYSTEM_PROMPT = `You are a document classification assistant for university social-science coursework materials.

## Task
Classify the provided document excerpt into the most appropriate category or categories.

## Categories
- handbook: Module handbook, course guide, or programme handbook with policies and structure
- syllabus: Week-by-week topic schedule, course outline, or reading schedule
- assignment_brief: Assignment instructions, essay question, or coursework brief with requirements
- rubric: Marking criteria, grading grid, or assessment standards
- slides: Lecture or seminar slide deck
- reading: Academic reading material (journal article, book chapter, paper)
- draft: Student's own draft essay or coursework
- notes: Student's own study notes or seminar notes
- integrity_guidance: Academic integrity policy, plagiarism guide, or referencing guide
- reading_list: Module reading list, bibliography, or recommended readings
- other: Does not clearly fit any above category

## Rules
1. Base your classification ONLY on the provided text and filename. Do not speculate.
2. Assign confidence between 0.0 and 1.0 for the primary label.
3. Keep the rationale to a single concise sentence.
4. A document may have multiple applicable labels; include all that genuinely apply.
5. primaryLabel must be the single best fit.

## Response Format
Respond with ONLY a JSON object. No markdown fences, no commentary, no trailing text:
{"labels": ["category", ...], "primaryLabel": "category", "confidence": 0.0, "rationale": "one sentence"}`;

export interface ParsedClassification {
  labels: ClassificationLabel[];
  primaryLabel: ClassificationLabel;
  confidence: number;
  rationale: string;
}

export function parseClassificationResponse(
  text: string,
): ParsedClassification | null {
  if (!text || !text.trim()) return null;

  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const primaryLabelRaw = obj.primaryLabel;
  if (
    typeof primaryLabelRaw !== "string" ||
    !isValidLabel(primaryLabelRaw)
  ) {
    return null;
  }
  const primaryLabel = primaryLabelRaw as ClassificationLabel;

  let labels: ClassificationLabel[] = [];
  const rawLabels = obj.labels;
  if (Array.isArray(rawLabels)) {
    labels = rawLabels.filter(
      (l): l is ClassificationLabel =>
        typeof l === "string" && isValidLabel(l),
    );
  }
  if (!labels.includes(primaryLabel)) {
    labels = [primaryLabel, ...labels];
  }

  let confidence =
    typeof obj.confidence === "number" ? obj.confidence : 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  const rationale =
    typeof obj.rationale === "string" && obj.rationale.trim()
      ? obj.rationale.trim()
      : `Classified as ${primaryLabel}`;

  return {
    labels: labels.slice(0, CLASSIFICATION_LABELS.length),
    primaryLabel,
    confidence,
    rationale,
  };
}

function buildClassificationPrompt(
  fileName: string | undefined,
  fileType: string | undefined,
  textSnippet: string | undefined,
): string {
  const parts: string[] = [];

  parts.push(`Filename: ${fileName ?? "unknown"}`);
  if (fileType) {
    parts.push(`File type: ${fileType}`);
  }

  if (textSnippet && textSnippet.trim().length > 0) {
    parts.push(
      `\n## Document Excerpt (first ${MAX_TEXT_CHARS} characters)\n${textSnippet.slice(0, MAX_TEXT_CHARS)}`,
    );
  } else {
    parts.push(
      "\nNote: No text could be extracted from this file. Classify based on the filename alone with appropriately lower confidence.",
    );
  }

  parts.push(
    "\n## Respond Now\nReturn ONLY the JSON object described in the instructions.",
  );

  return parts.join("\n");
}

async function resolveProviderKey(
  ctx: ActionCtx,
  tokenIdentifier: string,
): Promise<{
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
      } catch {
        // Decryption failed — fall through to app-level key
      }
    }
  }

  const envMap: Record<ProviderId, string> = {
    zai: "ZAI_API_KEY",
    gemini: "GEMINI_API_KEY",
  };
  const apiKey = process.env[envMap[provider]] || null;
  return { apiKey, model: defaultModel, provider };
}

async function callClassification(
  apiKey: string,
  provider: ProviderId,
  model: string,
  userPrompt: string,
): Promise<{
  content: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
} | null> {
  const messages: ChatMessage[] = [
    { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  try {
    let response;
    if (provider === "zai") {
      response = await callZaiProvider(apiKey, messages, {
        model,
        temperature: 0.1,
        maxTokens: 512,
      });
    } else {
      response = await callGeminiProvider(apiKey, messages, {
        model,
        temperature: 0.1,
        maxTokens: 512,
      });
    }
    return {
      content: response.content,
      model: response.model,
      tokensIn: response.usage?.tokensIn,
      tokensOut: response.usage?.tokensOut,
    };
  } catch {
    return null;
  }
}

interface ProcessingFile {
  _id: Id<"importedFiles">;
  storageId?: Id<"_storage">;
  fileName?: string;
  fileType?: string;
}

export const processBatch = action({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const data: {
      batch: {
        _id: Id<"importBatches">;
        moduleId: Id<"modules">;
        totalFiles: number;
      };
      files: ProcessingFile[];
    } | null = await ctx.runQuery(
      internal.imports.internalGetBatchForProcessing,
      {
        batchId: args.batchId,
        tokenIdentifier: identity.tokenIdentifier,
      },
    );

    if (!data) {
      throw new Error("Import batch not found");
    }

    const pendingFiles = data.files;

    if (pendingFiles.length === 0) {
      await ctx.runMutation(internal.imports.internalUpdateBatch, {
        batchId: args.batchId,
        status: "completed",
        processedFiles: 0,
        autoAcceptedFiles: 0,
        needsReviewFiles: 0,
        failedFiles: 0,
      });
      return { batchId: args.batchId, processed: 0 };
    }

    await ctx.runMutation(internal.imports.internalUpdateBatch, {
      batchId: args.batchId,
      status: "processing",
    });

    const { apiKey, model, provider } = await resolveProviderKey(
      ctx,
      identity.tokenIdentifier,
    );

    let totalTokensIn = 0;
    let totalTokensOut = 0;

    for (const file of pendingFiles) {
      let textSnippet: string | undefined;

      if (file.storageId) {
        const fileType = normalizeFileType(
          file.fileName ?? "",
          file.fileType,
        );

        if (!isSupportedFileType(file.fileName ?? "", fileType)) {
          await ctx.runMutation(internal.imports.internalUpdateFileExtraction, {
            fileId: file._id,
            extractionStatus: "unsupported",
          });
        } else {
          await ctx.runMutation(internal.imports.internalUpdateFileExtraction, {
            fileId: file._id,
            extractionStatus: "extracting",
          });

          try {
            const blob = await ctx.storage.get(file.storageId);
            if (!blob) {
              throw new Error("File not found in storage");
            }
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const { text } = await extractText(buffer, fileType);

            await ctx.runMutation(
              internal.imports.internalUpdateFileExtraction,
              {
                fileId: file._id,
                extractionStatus: "extracted",
              },
            );

            textSnippet = text;
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unknown extraction error";
            await ctx.runMutation(
              internal.imports.internalUpdateFileExtraction,
              {
                fileId: file._id,
                extractionStatus: "failed",
                extractionError: message,
              },
            );
          }
        }
      } else {
        await ctx.runMutation(internal.imports.internalUpdateFileExtraction, {
          fileId: file._id,
          extractionStatus: "skipped",
        });
      }

      let classificationStatus:
        | "auto_accepted"
        | "needs_review"
        | "failed" = "needs_review";
      let primaryLabel: ClassificationLabel | undefined;
      let confidence: number | undefined;
      let classificationSummary = "Classification needs review.";
      let classificationModel = model;

      if (!apiKey) {
        await ctx.runMutation(
          internal.imports.internalUpdateFileClassification,
          {
            fileId: file._id,
            classificationStatus: "needs_review",
            classificationError: "No AI provider configured",
          },
        );
        await ctx.runMutation(internal.aiActions.record, {
          tokenIdentifier: identity.tokenIdentifier,
          moduleId: data.batch.moduleId,
          batchId: args.batchId,
          importedFileId: file._id,
          operation: "classification",
          status: "needs_review",
          title: "Classification needs review",
          summary: "No AI provider is configured, so Polis kept the file for manual review.",
          reversible: true,
          errorMessage: "No AI provider configured",
        });
      } else {
        await ctx.runMutation(
          internal.imports.internalUpdateFileClassification,
          {
            fileId: file._id,
            classificationStatus: "classifying",
          },
        );

        const prompt = buildClassificationPrompt(
          file.fileName,
          file.fileType,
          textSnippet,
        );

        const result = await callClassification(apiKey, provider, model, prompt);

        if (!result) {
          classificationStatus = "failed";
          classificationSummary = "The AI provider call failed.";
          await ctx.runMutation(
            internal.imports.internalUpdateFileClassification,
            {
              fileId: file._id,
              classificationStatus: "failed",
              classificationError: "AI provider call failed",
              modelUsed: model,
              providerUsed: provider,
            },
          );
          await ctx.runMutation(internal.aiActions.record, {
            tokenIdentifier: identity.tokenIdentifier,
            moduleId: data.batch.moduleId,
            batchId: args.batchId,
            importedFileId: file._id,
            operation: "classification",
            status: "failed",
            title: "Classification failed",
            summary: classificationSummary,
            providerUsed: provider,
            modelUsed: model,
            reversible: true,
            errorMessage: "AI provider call failed",
          });
        } else {
          classificationModel = result.model;
          totalTokensIn += result.tokensIn ?? Math.ceil(prompt.length / 4);
          totalTokensOut +=
            result.tokensOut ?? Math.ceil(result.content.length / 4);

          const parsed = parseClassificationResponse(result.content);

          if (!parsed) {
            classificationStatus = "failed";
            classificationSummary = "The AI response could not be parsed.";
            await ctx.runMutation(
              internal.imports.internalUpdateFileClassification,
              {
                fileId: file._id,
                classificationStatus: "failed",
                classificationError: "Could not parse classification response",
                modelUsed: result.model,
                providerUsed: provider,
              },
            );
            await ctx.runMutation(internal.aiActions.record, {
              tokenIdentifier: identity.tokenIdentifier,
              moduleId: data.batch.moduleId,
              batchId: args.batchId,
              importedFileId: file._id,
              operation: "classification",
              status: "failed",
              title: "Classification failed",
              summary: classificationSummary,
              providerUsed: provider,
              modelUsed: result.model,
              reversible: true,
              errorMessage: "Could not parse classification response",
              output: { rawResponse: result.content.slice(0, 500) },
            });
          } else {
            const autoAccepted = parsed.confidence >= AUTO_ACCEPT_THRESHOLD;
            classificationStatus = autoAccepted
              ? "auto_accepted"
              : "needs_review";
            primaryLabel = parsed.primaryLabel;
            confidence = parsed.confidence;
            classificationSummary = parsed.rationale;

            await ctx.runMutation(
              internal.imports.internalUpdateFileClassification,
              {
                fileId: file._id,
                classificationStatus,
                labels: parsed.labels,
                primaryLabel: parsed.primaryLabel,
                confidence: parsed.confidence,
                rationale: parsed.rationale,
                modelUsed: result.model,
                providerUsed: provider,
              },
            );
            await ctx.runMutation(internal.aiActions.record, {
              tokenIdentifier: identity.tokenIdentifier,
              moduleId: data.batch.moduleId,
              batchId: args.batchId,
              importedFileId: file._id,
              operation: "classification",
              status: autoAccepted ? "auto_applied" : "needs_review",
              title: autoAccepted
                ? "Auto-classified imported file"
                : "Classified imported file for review",
              summary: parsed.rationale,
              providerUsed: provider,
              modelUsed: result.model,
              confidence: parsed.confidence,
              autoApplied: autoAccepted,
              reversible: true,
              output: parsed,
            });
          }
        }
      }

      try {
        const sourceId: Id<"sources"> = await ctx.runMutation(
          internal.imports.internalCreateSourceForFile,
          {
            importedFileId: file._id,
            tokenIdentifier: identity.tokenIdentifier,
            status: "queued",
          },
        );

        await ctx.runMutation(internal.aiActions.record, {
          tokenIdentifier: identity.tokenIdentifier,
          moduleId: data.batch.moduleId,
          batchId: args.batchId,
          importedFileId: file._id,
          sourceId,
          operation: "source_conversion",
          status: "completed",
          title: "Converted import to source",
          summary: primaryLabel
            ? `Created a source from the imported file as ${primaryLabel}.`
            : "Created a source from the imported file for review.",
          confidence,
          autoApplied: classificationStatus === "auto_accepted",
          reversible: false,
          targetTable: "sources",
          targetId: sourceId,
        });

        const processingResult: {
          success: boolean;
          chunkCount: number;
          errorMessage?: string;
        } = await ctx.runAction(internal.ingestion.process.processSource, {
          sourceId,
        });

        await ctx.runMutation(internal.aiActions.record, {
          tokenIdentifier: identity.tokenIdentifier,
          moduleId: data.batch.moduleId,
          batchId: args.batchId,
          importedFileId: file._id,
          sourceId,
          operation: "source_processing",
          status: processingResult.success ? "completed" : "failed",
          title: processingResult.success
            ? "Extracted and chunked source"
            : "Source processing failed",
          summary: processingResult.success
            ? `Created ${processingResult.chunkCount} source chunks.`
            : "Polis could not extract text from this source.",
          reversible: false,
          errorMessage: processingResult.errorMessage,
          output: processingResult,
        });

        if (!processingResult.success) continue;

        await ctx.runMutation(internal.sources.internalPatchSource, {
          sourceId,
          status:
            classificationStatus === "auto_accepted"
              ? "processed"
              : "needs_review",
        });

        await ctx.runAction(internal.extractionAI.extractImportedSource, {
          sourceId,
          tokenIdentifier: identity.tokenIdentifier,
          importedFileId: file._id,
          batchId: args.batchId,
        });

        await ctx.runAction(internal.sourceAnalysisAI.analyseImportedSource, {
          sourceId,
          tokenIdentifier: identity.tokenIdentifier,
          importedFileId: file._id,
          batchId: args.batchId,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Source pipeline failed";
        await ctx.runMutation(internal.aiActions.record, {
          tokenIdentifier: identity.tokenIdentifier,
          moduleId: data.batch.moduleId,
          batchId: args.batchId,
          importedFileId: file._id,
          operation: "source_processing",
          status: "failed",
          title: "Source pipeline failed",
          summary: classificationSummary,
          providerUsed: provider,
          modelUsed: classificationModel,
          reversible: false,
          errorMessage: message,
        });
      }
    }

    await ctx.runMutation(internal.imports._recomputeBatchProgress, {
      batchId: args.batchId,
    });

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: identity.tokenIdentifier,
      provider,
      model,
      type: "classification",
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
    });

    return { batchId: args.batchId };
  },
});
