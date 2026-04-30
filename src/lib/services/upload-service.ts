import "server-only";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { extractTextFromFile } from "./extraction-service";
import { chunkAndStore } from "./chunking-service";

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
