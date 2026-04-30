import { auth } from "@/lib/auth";
import { getSourceById, updateSourceAnalysis } from "@/lib/services/data-service";
import { chat, isAIConfigured } from "@/lib/ai/providers";
import { NextRequest, NextResponse } from "next/server";

const ANALYSIS_PROMPT = `You are an academic source analysis assistant. Analyse the provided source text and generate:

1. A structured summary (2-3 paragraphs) covering the main argument, methodology, and key findings
2. The key argument in 1-2 sentences
3. Key concepts as a comma-separated list

ACADEMIC INTEGRITY:
- Summarise accurately from the text provided
- Do not add information not present in the text
- Do not fabricate claims or findings
- This summary is to help a student understand the source, not replace reading it

Respond in this exact JSON format:
{
  "summary": "Your 2-3 paragraph summary here",
  "keyArguments": "The central argument in 1-2 sentences",
  "concepts": "concept1, concept2, concept3, concept4, concept5"
}`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
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

  const { sourceId } = await params;
  const source = await getSourceById(session.user.id, sourceId);

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  if (!source.extractedText) {
    return NextResponse.json(
      { error: "No extracted text available for this source" },
      { status: 400 }
    );
  }

  try {
    const textToAnalyse = source.extractedText.slice(0, 12000);

    const response = await chat(
      [
        { role: "system", content: ANALYSIS_PROMPT },
        {
          role: "user",
          content: `Analyse this source titled "${source.title}" by ${source.authors} (${source.year}):\n\n${textToAnalyse}`,
        },
      ],
      { temperature: 0.2, maxTokens: 1024 }
    );

    let analysis;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = {
        summary: response.content.slice(0, 500),
        keyArguments: "",
        concepts: "",
      };
    }

    await updateSourceAnalysis(sourceId, {
      summary: analysis.summary || "",
      keyArguments: analysis.keyArguments || "",
      concepts: analysis.concepts || "",
    });

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.summary || "",
        keyArguments: analysis.keyArguments || "",
        concepts: analysis.concepts || "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
