"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { assertSupportedUpload, chunkText, normalizeFileType } from "./lib";
import type { ChunkData } from "./lib";
import type { Id } from "../_generated/dataModel";

export const processSource = internalAction({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    try {
      const source: {
        _id: Id<"sources">;
        storageId?: Id<"_storage">;
        fileName?: string;
        fileType?: string;
        title: string;
        authors?: string;
      } | null = await ctx.runQuery(internal.sources.internalGet, {
        sourceId: args.sourceId,
      });

      if (!source) {
        throw new Error("Source not found");
      }
      if (!source.storageId) {
        throw new Error("No file attached to source");
      }

      await ctx.runMutation(internal.sources.updateStatus, {
        sourceId: args.sourceId,
        status: "extracting",
      });

      const blob = await ctx.storage.get(source.storageId);
      if (!blob) {
        throw new Error("File not found in storage");
      }

      const fileType = normalizeFileType(
        source.fileName ?? "",
        source.fileType,
      );
      assertSupportedUpload({
        fileName: source.fileName,
        fileType,
        fileSize: blob.size,
      });

      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { text, pages } = await extractText(buffer, fileType);

      await ctx.runMutation(internal.sources.updateStatus, {
        sourceId: args.sourceId,
        status: "chunking",
      });

      const chunks = chunkText(text, pages);

      const chunksArg = chunks.map((c: ChunkData) => ({
        chunkIndex: c.chunkIndex,
        text: c.text,
        pageStart: c.pageStart ?? undefined,
        pageEnd: c.pageEnd ?? undefined,
        tokenEstimate: c.tokenEstimate,
        citationLabel: c.citationLabel || undefined,
      }));

      await ctx.runMutation(internal.sources.saveChunks, {
        sourceId: args.sourceId,
        chunks: chunksArg,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown processing error";
      await ctx.runMutation(internal.sources.updateStatus, {
        sourceId: args.sourceId,
        status: "failed",
        errorMessage: message,
      });
    }
  },
});

export interface PageSegment {
  text: string;
  pageNumber: number;
}

export async function extractText(
  buffer: Buffer,
  fileType: string,
): Promise<{ text: string; pages: PageSegment[] }> {
  if (fileType === "text/plain" || fileType === "text/markdown") {
    const text = buffer.toString("utf-8");
    return { text, pages: [{ text, pageNumber: 1 }] };
  }

  if (fileType === "application/pdf") {
    return await extractPdf(buffer);
  }

  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractDocx(buffer);
  }

  const text = buffer.toString("utf-8");
  return { text, pages: [{ text, pageNumber: 1 }] };
}

async function extractPdf(
  buffer: Buffer,
): Promise<{ text: string; pages: PageSegment[] }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseMod = await import("pdf-parse") as any;
    const PDFParse = pdfParseMod.PDFParse ?? pdfParseMod.default;
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();

    const pages: PageSegment[] = [];
    if (result.pages && Array.isArray(result.pages)) {
      for (const page of result.pages) {
        const pageText = (page.text || "").trim();
        if (pageText) {
          pages.push({ text: pageText, pageNumber: page.num ?? page.pageNumber ?? 1 });
        }
      }
    }

    const fullText = result.text || "";

    if (!fullText.trim()) {
      throw new Error(
        "No text could be extracted from this PDF. It may be image-based or encrypted.",
      );
    }

    if (pages.length === 0) {
      pages.push({ text: fullText, pageNumber: 1 });
    }

    return { text: fullText, pages };
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("No text could be extracted")) throw e;
    const msg = e instanceof Error ? e.message : "Unknown error";
    throw new Error(
      `PDF extraction failed: ${msg}. The PDF may be encrypted or image-based.`,
    );
  }
}

async function extractDocx(
  buffer: Buffer,
): Promise<{ text: string; pages: PageSegment[] }> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || "";
    return {
      text,
      pages: [{ text, pageNumber: 1 }],
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    throw new Error(
      `DOCX extraction failed: ${msg}`,
    );
  }
}
