import { auth } from "@/lib/auth";
import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { chat, isAIConfigured } from "@/lib/ai/providers";
import { buildContextBlock } from "@/lib/ai/prompts";
import { DRAFT_REVIEW_PROMPT } from "@/lib/ai/tool-prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI provider not configured. Set OPENAI_API_KEY in .env" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { text, question, rubric, moduleId, essayId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Draft text required" }, { status: 400 });
    }

    const chunks = await retrieveRelevantChunks({
      userId: session.user.id,
      query: text.slice(0, 500),
      moduleId,
      essayId,
      limit: 10,
      retrievalMode: "hybrid",
    });

    const contextBlock = buildContextBlock(
      chunks.map(
        (c) => `From "${c.sourceTitle}" by ${c.sourceAuthors} (${c.sourceYear}):\n${c.text}`
      )
    );

    let userMessage = `Review this essay draft:\n\n${text.slice(0, 8000)}`;
    if (question) {
      userMessage += `\n\nEssay question: ${question}`;
    }
    if (rubric) {
      userMessage += `\n\nMarking rubric: ${rubric}`;
    }

    const response = await chat(
      [
        { role: "system", content: DRAFT_REVIEW_PROMPT },
        { role: "system", content: contextBlock },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.3, maxTokens: 2048 }
    );

    let result;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = {
        strengths: [],
        weaknesses: [],
        missingEvidence: [],
        unsupportedClaims: [],
        revisionPriorities: [],
        estimatedBandRisk: "Unable to estimate",
        overallFeedback: response.content,
      };
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
