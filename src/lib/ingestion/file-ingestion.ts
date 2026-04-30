export type SupportedFileType = "pdf" | "docx" | "pptx" | "txt" | "md";

export interface IngestionResult {
  sourceId: string;
  title: string;
  pageCount: number;
  textExtracted: boolean;
  chunksCreated: number;
  status: "success" | "partial" | "failed";
  error?: string;
}

export async function ingestFile(
  _file: File,
  _moduleId: string,
  _folderId: string
): Promise<IngestionResult> {
  throw new Error(
    "File ingestion not implemented. Upload will be available in Phase 1."
  );
}

export async function extractText(
  _file: File
): Promise<{ text: string; pageCount: number }> {
  throw new Error(
    "Text extraction not implemented. Will be available in Phase 1."
  );
}

export const supportedMimeTypes: Record<string, SupportedFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/markdown": "md",
};
