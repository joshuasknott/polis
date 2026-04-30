import "server-only";
import fs from "fs/promises";
import path from "path";

export interface ExtractionResult {
  text: string;
  wordCount: number;
  pageCount: number;
  metadata?: Record<string, unknown>;
}

export async function extractTextFromFile(
  filePath: string,
  _mimeType?: string
): Promise<ExtractionResult> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".txt":
    case ".md":
      return extractTextPlain(filePath);
    case ".pdf":
      return extractTextPdf(filePath);
    case ".docx":
      return extractTextDocx(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function extractTextPlain(filePath: string): Promise<ExtractionResult> {
  const buffer = await fs.readFile(filePath);
  const text = buffer.toString("utf-8");
  const wordCount = text.trim().split(/\s+/).length;
  return { text, wordCount, pageCount: Math.max(1, Math.ceil(wordCount / 300)) };
}

async function extractTextPdf(filePath: string): Promise<ExtractionResult> {
  try {
    const pdfParse = await import("pdf-parse") as unknown as { (buffer: Buffer): Promise<{ text: string; numpages: number }> };
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      wordCount: data.text.trim().split(/\s+/).length,
      pageCount: data.numpages || 1,
    };
  } catch (error) {
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function extractTextDocx(filePath: string): Promise<ExtractionResult> {
  try {
    const mammoth = await import("mammoth");
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    const text = result.value;
    return {
      text,
      wordCount: text.trim().split(/\s+/).length,
      pageCount: Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 300)),
    };
  } catch (error) {
    throw new Error(
      `DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
