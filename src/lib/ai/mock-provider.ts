import type { AIMode, AIMessage, CitedChunk, MessageLabel } from "../types";

export interface MockResponseConfig {
  mode: AIMode;
  query: string;
  scope: string;
}

export function generateMockResponse(config: MockResponseConfig): AIMessage {
  const labels: MessageLabel[] = [
    { type: "source_supported", text: "Supported by uploaded sources" },
  ];

  const citedChunks: CitedChunk[] = [
    {
      chunkId: "mock_chk_01",
      sourceId: "src_01",
      sourceTitle: "Patterns of Democracy",
      quote: "Consensus democracy is characterised by power-sharing, bargaining, and compromise.",
      pageRange: "pp. 2-3",
    },
  ];

  return {
    id: `mock_msg_${Date.now()}`,
    role: "assistant",
    content: `[Mock response for "${config.query}" in ${config.mode} mode]\n\nThis is a placeholder AI response. When an AI provider is connected, this will contain a source-grounded answer with citations, labels, and warnings.`,
    citedChunks,
    warnings: ["This is a mock response. Connect an AI provider for real answers."],
    labels,
    followUpSuggestions: [
      "How can I use this in my essay?",
      "What sources would strengthen this answer?",
      "Compare this with another theory",
    ],
    createdAt: new Date().toISOString(),
  };
}
