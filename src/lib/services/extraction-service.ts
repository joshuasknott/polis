export interface ExtractionResult {
  text: string;
  wordCount: number;
}

export async function extractTextFromFile(filePath: string): Promise<ExtractionResult> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const ext = path.extname(filePath).toLowerCase();

  let text: string;

  if (ext === ".pdf") {
    const pdfParse = await import("pdf-parse") as any;
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse.default(buffer);
    text = data.text;
  } else if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = await fs.readFile(filePath, "utf-8");
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, wordCount };
}
