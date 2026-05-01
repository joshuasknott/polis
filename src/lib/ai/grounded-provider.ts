export interface RetrievalResultItem {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceAuthors: string;
  sourceYear: number;
  text: string;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
  citationLabel: string;
}

export interface GroundedResponseConfig {
  query: string;
  mode: string;
  chunks: RetrievalResultItem[];
}

export interface GroundedResponse {
  content: string;
  citedChunks: Array<{
    chunkId: string;
    sourceId: string;
    sourceTitle: string;
    quote: string;
    pageRange: string;
  }>;
  warnings: string[];
  labels: Array<{ type: string; text: string }>;
  followUpSuggestions: string[];
}

export function generateRetrievalAwareResponse(
  config: GroundedResponseConfig
): GroundedResponse {
  const { query, mode, chunks } = config;

  if (chunks.length === 0) {
    return {
      content: `I couldn't find relevant information in your uploaded sources for this question: "${query}"\n\nThis could mean:\n1. You haven't uploaded sources related to this topic yet\n2. The available sources don't cover this specific question\n3. Try rephrasing your question or uploading additional sources\n\nTo get source-grounded answers, upload relevant readings to your module first.`,
      citedChunks: [],
      warnings: [
        "No relevant sources found for this query. Upload more sources or try a different question.",
      ],
      labels: [{ type: "unsupported", text: "No source material available" }],
      followUpSuggestions: [
        "Upload sources related to this topic",
        "Try asking about a different topic",
        "Search across all modules",
      ],
    };
  }

  const citedChunks = chunks.slice(0, 5).map((chunk) => ({
    chunkId: chunk.chunkId,
    sourceId: chunk.sourceId,
    sourceTitle: chunk.sourceTitle,
    quote: chunk.text.slice(0, 200).trim() + (chunk.text.length > 200 ? "..." : ""),
    pageRange: chunk.citationLabel,
  }));

  const sourceNames = [...new Set(chunks.map((c) => c.sourceTitle))];
  const uniqueSources = [...new Set(chunks.map((c) => `${c.sourceAuthors} (${c.sourceYear})`))];

  let content = "";
  const warnings: string[] = [];
  let suggestions: string[] = [];

  switch (mode) {
    case "source_grounded":
      content = buildSourceGroundedResponse(query, chunks, sourceNames, uniqueSources);
      break;
    case "reading_summary":
      content = buildReadingSummaryResponse(query, chunks, sourceNames);
      break;
    case "essay_planning":
      content = buildEssayPlanningResponse(query, chunks, sourceNames);
      break;
    default:
      content = buildSourceGroundedResponse(query, chunks, sourceNames, uniqueSources);
  }

  if (chunks.length < 3) {
    warnings.push(
      "Limited source material found. Consider uploading more sources to get a more comprehensive answer."
    );
  }

  suggestions = generateFollowUps(query, mode, sourceNames);

  return {
    content,
    citedChunks,
    warnings,
    labels: [{ type: "source_supported", text: "Based on uploaded sources" }],
    followUpSuggestions: suggestions,
  };
}

function buildSourceGroundedResponse(
  query: string,
  chunks: RetrievalResultItem[],
  sourceNames: string[],
  uniqueSources: string[]
): string {
  const relevantExcerpts = chunks
    .slice(0, 5)
    .map(
      (c, i) =>
        `[${i + 1}] ${c.sourceAuthors} (${c.sourceYear}): "${c.text.slice(0, 300).trim()}${c.text.length > 300 ? "..." : ""}"`
    )
    .join("\n\n");

  return `Based on your uploaded sources, here is what I found regarding "${query}":\n\n**Relevant sources found:** ${sourceNames.length} source${sourceNames.length !== 1 ? "s" : ""}\n${uniqueSources.map((s) => `- ${s}`).join("\n")}\n\n**Key findings from your sources:**\n\n${relevantExcerpts}\n\n**Analysis:**\nBased on the retrieved passages, your sources address this question from ${sourceNames.length > 1 ? "multiple perspectives" : "one primary perspective"}. ${sourceNames.length < 3 ? "Adding more sources would strengthen the analysis." : ""}\n\n**Important:** This analysis is based solely on your uploaded source material. Claims above reference specific sources as cited. For claims not directly supported by the excerpts shown, additional source material may be needed.\n\n${sourceNames.length < 3 ? "⚠️ Consider uploading additional sources for a more comprehensive analysis." : ""}`;
}

function buildReadingSummaryResponse(
  query: string,
  chunks: RetrievalResultItem[],
  sourceNames: string[]
): string {
  if (sourceNames.length === 0) {
    return "No sources found to summarise. Upload a reading first.";
  }

  const source = sourceNames[0];
  const sourceChunks = chunks.filter((c) => c.sourceTitle === source);

  return `**Reading Summary: ${source}**\n\n**Based on the available extracted text from your uploaded source:**\n\n${sourceChunks
    .slice(0, 4)
    .map((c, i) => `**Excerpt ${i + 1}:** ${c.text.slice(0, 250).trim()}...`)
    .join("\n\n")}\n\n**Note:** This summary is generated from the text extracted from your upload. For the most complete understanding, always refer to the original source. This tool helps you organise your reading, not replace it.`;
}

function buildEssayPlanningResponse(
  query: string,
  chunks: RetrievalResultItem[],
  sourceNames: string[]
): string {
  return `**Essay Plan Suggestion based on your sources**\n\n**Question:** ${query}\n\n**Available source material:** ${sourceNames.length} source${sourceNames.length !== 1 ? "s" : ""}\n${sourceNames.map((s) => `- ${s}`).join("\n")}\n\n**Suggested structure based on source coverage:**\n\n**I. Introduction**\n- Define key terms from your source material\n- State your thesis\n- Preview your argument structure\n\n**II. Theoretical Framework**\n- Use your sources to establish the theoretical landscape\n${chunks.length > 2 ? "- Compare perspectives across sources" : "- ⚠️ Limited sources - consider adding more theoretical framework readings"}\n\n**III. Main Arguments**\n${chunks
    .slice(0, 3)
    .map((c, i) => `- Argument ${i + 1}: Drawing on ${c.sourceAuthors} (${c.sourceYear})`)
    .join("\n")}\n\n**IV. Critical Assessment**\n- Evaluate the strength of evidence\n- Identify tensions between sources\n- Note gaps in the available evidence\n\n**V. Conclusion**\n- Summarise key findings\n- Restate thesis in light of evidence\n${sourceNames.length < 4 ? "\n⚠️ Your current source base may be insufficient for a comprehensive essay. Consider adding " + (4 - sourceNames.length) + " more sources." : ""}\n\n**Important:** This is a planning scaffold. The argument, analysis, and writing must be your own intellectual work.`;
}

function generateFollowUps(
  query: string,
  mode: string,
  sourceNames: string[]
): string[] {
  const base = [
    "How can I use these sources in my essay?",
    "What sources would strengthen this answer?",
  ];

  if (sourceNames.length > 1) {
    base.push(`Compare ${sourceNames[0]} with ${sourceNames[1]}`);
  }

  if (mode === "essay_planning") {
    base.push("Help me build an evidence bank for this essay");
    base.push("Identify gaps in my current source coverage");
  }

  if (mode === "reading_summary") {
    base.push("Extract key concepts from this source");
    base.push("How could I use this source in an essay?");
  }

  return base.slice(0, 4);
}
