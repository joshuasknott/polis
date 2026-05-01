import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { extractTextFromFile } from "@/lib/services/extraction-service";
import { createChunksFromText } from "@/lib/services/chunking-service";
import { isAIConfiguredForUser, chat, generateEmbeddings, isOpenAIConfigured } from "@/lib/ai/providers";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "50")) * 1024 * 1024;
const MAX_STORED_TEXT_CHARS = 750_000;
const CHUNK_INSERT_BATCH_SIZE = 100;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const moduleId = formData.get("moduleId") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const title = formData.get("title") as string | null;
    const sourceType = formData.get("sourceType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!moduleId) {
      return NextResponse.json({ error: "Module ID required" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storageFileName = `${sourceId}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storageFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(storagePath, buffer);

    const source = await convexServer.mutation(api.sources.create, {
      userId,
      moduleId,
      folderId: folderId || undefined,
      title: title || file.name.replace(ext, ""),
      authors: "Unknown",
      type: sourceType || inferSourceType(ext),
      fileName: file.name,
      fileType: ext.replace(".", ""),
      fileSize: file.size,
      storagePath,
      status: "processing",
      processingStatus: "extracting",
    });

    const createdSourceId = source as string;
    processInBackground(createdSourceId, title || file.name.replace(ext, ""), userId).catch(() => {});

    return NextResponse.json({ sourceId: createdSourceId, status: "processing" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processInBackground(sourceId: string, title: string, userId: string) {
  try {
    await convexServer.mutation(api.sources.update, {
      userId,
      sourceId,
      processingStatus: "extracting",
    });

    const source = await convexServer.query(api.sources.getById, { userId, sourceId });
    if (!source?.storagePath) throw new Error("No storage path");

    const extraction = await extractTextFromFile(source.storagePath);

    await convexServer.mutation(api.sources.update, {
      userId,
      sourceId,
      extractedText: extraction.text.slice(0, MAX_STORED_TEXT_CHARS),
      wordCount: extraction.wordCount,
      processingStatus: "chunking",
    });

    const chunks = createChunksFromText(extraction.text);

    for (let i = 0; i < chunks.length; i += CHUNK_INSERT_BATCH_SIZE) {
      const batch = chunks.slice(i, i + CHUNK_INSERT_BATCH_SIZE);
      await convexServer.mutation(api.sourceChunks.createBatch, {
        userId,
        chunks: batch.map((c) => ({
          sourceId,
          chunkIndex: c.chunkIndex,
          text: c.text,
          charCount: c.charCount,
          tokenEstimate: c.tokenEstimate,
          pageNumber: c.pageNumber ?? undefined,
        })),
      });
    }

    if (isOpenAIConfigured()) {
      try {
        const texts = chunks.map((c) => c.text.slice(0, 8000));
        const embeddings = await generateEmbeddings(texts);
        const createdChunks = await convexServer.query(api.sourceChunks.getBySourceId, { userId, sourceId });
        for (let i = 0; i < createdChunks.length; i++) {
          if (embeddings[i] && createdChunks[i]) {
            await convexServer.mutation(api.sourceChunks.setEmbedding, {
              userId,
              chunkId: createdChunks[i].id as string,
              embedding: embeddings[i],
            });
          }
        }
      } catch {
        // Embedding failure is non-fatal
      }
    }

    const aiConfigured = await isAIConfiguredForUser(userId);

    await convexServer.mutation(api.sources.update, {
      userId,
      sourceId,
      processingStatus: aiConfigured ? "analysing" : "ready",
      status: "ready",
    });

    if (aiConfigured && extraction.text.length > 100) {
      try {
        await analyseSourceInBackground(sourceId, title, extraction.text, userId);
      } catch {
        // Non-fatal
      }

      await convexServer.mutation(api.sources.update, {
        userId,
        sourceId,
        processingStatus: "ready",
      });
    }
  } catch (error) {
    await convexServer.mutation(api.sources.update, {
      userId,
      sourceId,
      status: "error",
      processingStatus: "error",
      errorMessage: error instanceof Error ? error.message : "Processing failed",
    });
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
  text: string,
  userId: string
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
      { temperature: 0.2, maxTokens: 1024, userId }
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

    await convexServer.mutation(api.sources.update, {
      userId,
      sourceId,
      summary: analysis.summary || "",
      keyArguments: analysis.keyArguments || "",
      concepts: analysis.concepts || "",
    });
  } catch {
    // Non-fatal: source is still usable without AI analysis
  }
}
