import type { RetrievalResultItem } from "./grounded-provider";
import type { GroundedResponse } from "./grounded-provider";

export interface CitationRef {
  index: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  pageRange: string;
}

export function processLLMResponse(
  llmContent: string,
  chunks: RetrievalResultItem[]
): GroundedResponse {
  if (chunks.length === 0) {
    return {
      content: llmContent,
      citedChunks: [],
      warnings: ["No source chunks were available for this query. The response may contain general knowledge not grounded in your sources."],
      labels: [{ type: "general", text: "No source material available" }],
      followUpSuggestions: [
        "Upload sources related to this topic",
        "Try asking about a different topic",
        "Search across all modules",
      ],
    };
  }

  const citedChunks = extractAndValidateCitations(llmContent, chunks);
  const warnings = generateWarnings(llmContent, chunks, citedChunks);
  const labels = generateLabels(citedChunks);
  const suggestions = generateFollowUpsFromResponse(llmContent, chunks);

  return {
    content: llmContent,
    citedChunks,
    warnings,
    labels,
    followUpSuggestions: suggestions,
  };
}

function extractAndValidateCitations(
  content: string,
  chunks: RetrievalResultItem[]
): GroundedResponse["citedChunks"] {
  const citationPattern = /\[Source\s+(\d+)\]/gi;
  const matches = [...content.matchAll(citationPattern)];

  const citedIndices = new Set<number>();
  for (const match of matches) {
    const idx = parseInt(match[1], 10);
    if (idx >= 1 && idx <= chunks.length) {
      citedIndices.add(idx);
    }
  }

  return [...citedIndices]
    .sort((a, b) => a - b)
    .map((idx) => {
      const chunk = chunks[idx - 1];
      return {
        chunkId: chunk.chunkId,
        sourceId: chunk.sourceId,
        sourceTitle: chunk.sourceTitle,
        quote: chunk.text.slice(0, 200).trim() + (chunk.text.length > 200 ? "..." : ""),
        pageRange: chunk.citationLabel,
      };
    });
}

function generateWarnings(
  content: string,
  chunks: RetrievalResultItem[],
  citedChunks: GroundedResponse["citedChunks"]
): string[] {
  const warnings: string[] = [];

  if (chunks.length < 3) {
    warnings.push(
      "Limited source material found. Consider uploading more sources for a more comprehensive analysis."
    );
  }

  if (citedChunks.length === 0 && chunks.length > 0) {
    warnings.push(
      "The response does not cite specific sources. Treat the content as general interpretation rather than source-grounded analysis."
    );
  }

  const uncitedWarningPattern = /(?:I don't have|not enough|insufficient|cannot find|no sources? mention)/i;
  if (uncitedWarningPattern.test(content)) {
    warnings.push(
      "The AI indicated insufficient evidence for this query. Consider uploading additional sources."
    );
  }

  return warnings;
}

function generateLabels(
  citedChunks: GroundedResponse["citedChunks"]
): GroundedResponse["labels"] {
  if (citedChunks.length > 0) {
    return [{ type: "source_supported", text: "Based on uploaded sources" }];
  }
  return [{ type: "general", text: "General response — not source-grounded" }];
}

function generateFollowUpsFromResponse(
  _content: string,
  chunks: RetrievalResultItem[]
): string[] {
  const sourceNames = [...new Set(chunks.map((c) => c.sourceTitle))];
  const suggestions: string[] = [
    "How can I use these sources in my essay?",
    "What sources would strengthen this answer?",
  ];

  if (sourceNames.length > 1) {
    suggestions.push(`Compare ${sourceNames[0]} with ${sourceNames[1]}`);
  }

  if (sourceNames.length > 0) {
    suggestions.push(`What are the key disagreements between these sources?`);
  }

  return suggestions.slice(0, 4);
}
