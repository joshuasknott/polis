import "server-only";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { extractTextFromFile } from "./extraction-service";
import { chunkAndStore } from "./chunking-service";
import { isAIConfigured } from "@/lib/ai/providers";
import { chat } from "@/lib/ai/providers";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "50")) * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function processUpload(
  userId: string,
  moduleId: string,
  file: File,
  options?: {
    folderId?: string;
    title?: string;
    sourceType?: string;
  }
) {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storageFileName = `${sourceId}${ext}`;
  const storagePath = path.join(UPLOAD_DIR, storageFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, buffer);

  await prisma.source.create({
    data: {
      id: sourceId,
      userId,
      moduleId,
      folderId: options?.folderId,
      title: options?.title || file.name.replace(ext, ""),
      authors: "Unknown",
      type: options?.sourceType || inferSourceType(ext),
      fileName: file.name,
      fileType: ext.replace(".", ""),
      fileSize: file.size,
      storagePath,
      status: "processing",
    },
  });

  try {
    const extraction = await extractTextFromFile(storagePath, file.type);

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        extractedText: extraction.text,
        wordCount: extraction.wordCount,
        status: "processing",
      },
    });

    const chunkCount = await chunkAndStore(sourceId, extraction.text);

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "ready",
      },
    });

    if (isAIConfigured() && extraction.text.length > 100) {
      analyseSourceInBackground(sourceId, file.name.replace(ext, ""), extraction.text).catch(() => {});
    }

    return { sourceId, chunkCount, wordCount: extraction.wordCount };
  } catch (error) {
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Processing failed",
      },
    });

    throw error;
  }
}

function inferSourceType(ext: string): string {
  switch (ext) {
    case ".pdf":
      return "journal_article";
    case ".docx":
      return "draft";
    case ".txt":
    case ".md":
      return "seminar_notes";
    default:
      return "report";
  }
}

const ANALYSIS_PROMPT = `You are an academic source analysis assistant. Analyse the provided source text and generate:

1. A structured summary (2-3 paragraphs) covering the main argument, methodology, and key findings
2. The key argument in 1-2 sentences
3. Key concepts as a comma-separated list

ACADEMIC INTEGRITY:
- Summarise accurately from the text provided
- Do not add information not present in the text
- Do not fabricate claims or findings

Respond in this exact JSON format:
{
  "summary": "Your 2-3 paragraph summary here",
  "keyArguments": "The central argument in 1-2 sentences",
  "concepts": "concept1, concept2, concept3, concept4, concept5"
}`;

async function analyseSourceInBackground(
  sourceId: string,
  title: string,
  text: string
) {
  try {
    const textToAnalyse = text.slice(0, 12000);

    const response = await chat(
      [
        { role: "system", content: ANALYSIS_PROMPT },
        {
          role: "user",
          content: `Analyse this source titled "${title}":\n\n${textToAnalyse}`,
        },
      ],
      { temperature: 0.2, maxTokens: 1024 }
    );

    let analysis;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = { summary: response.content.slice(0, 500), keyArguments: "", concepts: "" };
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: {
        summary: analysis.summary || "",
        keyArguments: analysis.keyArguments || "",
        concepts: analysis.concepts || "",
      },
    });
  } catch {
    // Non-fatal: source is still usable without AI analysis
  }
}
