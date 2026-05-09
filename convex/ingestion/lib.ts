export interface PageSegment {
  text: string;
  pageNumber: number;
}

export interface ChunkData {
  chunkIndex: number;
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
  tokenEstimate: number;
  citationLabel: string;
}

export const SUPPORTED_UPLOAD_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const DEFAULT_MAX_UPLOAD_SIZE_MB = 50;
const CHUNK_WORD_TARGET = 1000;
const CHUNK_WORD_OVERLAP = 150;
const TOKEN_RATIO = 1.3;

export function getMaxUploadBytes(): number {
  const configured = Number(process.env.MAX_UPLOAD_SIZE_MB);
  const maxMb = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_UPLOAD_SIZE_MB;
  return maxMb * 1024 * 1024;
}

export function assertSupportedUpload(args: {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}): string {
  const normalizedType = normalizeFileType(args.fileName ?? "", args.fileType);
  if (!SUPPORTED_UPLOAD_TYPES.has(normalizedType)) {
    throw new Error("Unsupported file type. Upload TXT, Markdown, PDF, or DOCX files.");
  }

  if (args.fileSize == null || args.fileSize <= 0) {
    throw new Error("File size is required for uploads.");
  }

  if (args.fileSize > getMaxUploadBytes()) {
    throw new Error(
      `File is too large. Maximum upload size is ${Math.round(getMaxUploadBytes() / (1024 * 1024))}MB.`,
    );
  }

  return normalizedType;
}

export function isSupportedFileType(fileName: string | undefined, fileType: string | undefined): boolean {
  return SUPPORTED_UPLOAD_TYPES.has(normalizeFileType(fileName ?? "", fileType));
}

export function extractPlainText(buffer: Buffer, fileType: string): string {
  if (fileType === "text/plain" || fileType === "text/markdown") {
    return buffer.toString("utf-8");
  }

  if (
    fileType === "application/pdf" ||
    fileType.endsWith("/pdf")
  ) {
    throw new Error(
      "PDF extraction requires the processing pipeline. Re-upload as TXT for immediate processing.",
    );
  }

  if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType.endsWith("wordprocessingml.document")
  ) {
    throw new Error(
      "DOCX extraction requires the processing pipeline. Re-upload as TXT for immediate processing.",
    );
  }

  return buffer.toString("utf-8");
}

export function extractTextWithPages(
  buffer: Buffer,
  fileType: string,
): { text: string; pages: PageSegment[] } {
  const text = extractPlainText(buffer, fileType);
  const pages: PageSegment[] = [{ text, pageNumber: 1 }];
  return { text, pages };
}

export function chunkText(
  text: string,
  pages: PageSegment[],
): ChunkData[] {
  if (!text.trim()) return [];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  if (words.length <= CHUNK_WORD_TARGET) {
    const chunkText = words.join(" ");
    const pageRange = getPageRange(pages);
    return [
      {
        chunkIndex: 0,
        text: chunkText,
        pageStart: pageRange.start,
        pageEnd: pageRange.end,
        tokenEstimate: Math.round(words.length * TOKEN_RATIO),
        citationLabel: pageRange.start != null
          ? formatCitationLabel(pageRange.start, pageRange.end)
          : "Chunk 1",
      },
    ];
  }

  const chunks: ChunkData[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORD_TARGET, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(" ");
    const charOffsetStart = text.indexOf(
      words[start],
      getCharOffsetForWordIndex(words, start, text),
    );
    const charOffsetEnd =
      charOffsetStart + chunkText.length;
    const pageRange = getPageRangeForSpan(
      pages,
      charOffsetStart,
      charOffsetEnd,
    );

    chunks.push({
      chunkIndex,
      text: chunkText,
      pageStart: pageRange.start,
      pageEnd: pageRange.end,
      tokenEstimate: Math.round(chunkWords.length * TOKEN_RATIO),
      citationLabel: pageRange.start != null
        ? formatCitationLabel(pageRange.start, pageRange.end)
        : `Chunk ${chunkIndex + 1}`,
    });

    chunkIndex++;
    start = end - CHUNK_WORD_OVERLAP;
    if (start >= words.length) break;
    if (end >= words.length) break;
  }

  return chunks;
}

function getCharOffsetForWordIndex(
  words: string[],
  wordIndex: number,
  text: string,
): number {
  let offset = 0;
  for (let i = 0; i < wordIndex && i < words.length; i++) {
    const idx = text.indexOf(words[i], offset);
    if (idx === -1) break;
    offset = idx + words[i].length;
  }
  return offset;
}

function getPageRange(
  pages: PageSegment[],
): { start: number | null; end: number | null } {
  if (pages.length <= 1) {
    return {
      start: pages[0]?.pageNumber ?? null,
      end: pages[0]?.pageNumber ?? null,
    };
  }
  return { start: null, end: null };
}

function getPageRangeForSpan(
  pages: PageSegment[],
  charStart: number,
  charEnd: number,
): { start: number | null; end: number | null } {
  if (pages.length === 0) return { start: null, end: null };
  if (pages.length === 1) {
    return { start: pages[0].pageNumber, end: pages[0].pageNumber };
  }

  let runningOffset = 0;
  let startPage: number | null = null;
  let endPage: number | null = null;

  for (const page of pages) {
    const pageEnd = runningOffset + page.text.length;
    if (startPage === null && charStart < pageEnd) {
      startPage = page.pageNumber;
    }
    if (charEnd <= pageEnd) {
      endPage = page.pageNumber;
      break;
    }
    runningOffset = pageEnd;
  }

  if (startPage == null) startPage = pages[pages.length - 1].pageNumber;
  if (endPage == null) endPage = pages[pages.length - 1].pageNumber;

  return { start: startPage, end: endPage };
}

function formatCitationLabel(
  pageStart: number | null,
  pageEnd: number | null,
): string {
  if (pageStart == null) return "";
  if (pageEnd == null || pageStart === pageEnd) return `p. ${pageStart}`;
  return `pp. ${pageStart}\u2013${pageEnd}`;
}

export function inferSourceType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "journal_article";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "report";
  return "report";
}

export function normalizeFileType(
  fileName: string,
  declaredType?: string,
): string {
  if (declaredType && declaredType !== "application/octet-stream") {
    return declaredType;
  }
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".md")) return "text/markdown";
  return declaredType ?? "application/octet-stream";
}
