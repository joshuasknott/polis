import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { chat, isAIConfiguredForUser, generateEmbedding, isOpenAIConfigured } from "@/lib/ai/providers";
import { buildContextBlock } from "@/lib/ai/prompts";
import { CITATION_CHECK_PROMPT } from "@/lib/ai/tool-prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await isAIConfiguredForUser(userId))) {
    return NextResponse.json(
      { error: "AI provider not configured. Set OPENAI_API_KEY in .env" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { text, moduleId, essayId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Draft text required" }, { status: 400 });
    }

    const chunks = await retrieveRelevantChunks({
      userId,
      query: text.slice(0, 500),
      moduleId,
      essayId,
      limit: 10,
    });

    const contextBlock = buildContextBlock(
      chunks.map(
        (c: { sourceTitle: string; sourceAuthors: string; sourceYear: number; text: string }) =>
          `From "${c.sourceTitle}" by ${c.sourceAuthors} (${c.sourceYear}):\n${c.text}`
      )
    );

    const response = await chat(
      [
        { role: "system", content: CITATION_CHECK_PROMPT },
        { role: "system", content: contextBlock },
        {
          role: "user",
          content: `Check this draft text for citation safety:\n\n${text.slice(0, 8000)}`,
        },
      ],
      { temperature: 0.2, maxTokens: 2048, userId }
    );

    let result;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = {
        supported: [],
        weaklySupported: [],
        unsupported: [],
        summary: response.content,
      };
    }

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Citation check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function retrieveRelevantChunks(params: {
  userId: string;
  query: string;
  moduleId?: string;
  essayId?: string;
  limit?: number;
}) {
  const { userId, query, moduleId, essayId, limit = 10 } = params;

  let sourceIdsFilter: string[] | undefined;

  if (essayId) {
    const essay = await convexServer.query(api.essays.getById, { userId, essayId });
    if (essay?.evidence) {
      sourceIdsFilter = [...new Set(essay.evidence.map((e: any) => e.sourceId).filter(Boolean) as string[])];
    }
  }

  const keywordResults = await convexServer.query(api.sourceChunks.keywordSearch, {
    userId,
    query,
    moduleId,
    sourceIds: sourceIdsFilter,
    limit: limit * 2,
  });

  const queryEmbedding = isOpenAIConfigured() ? await generateEmbedding(query).catch(() => null) : null;

  if (queryEmbedding) {
    const semanticResults = await convexServer.action(api.sourceChunks.searchByEmbedding, {
      userId,
      embedding: queryEmbedding,
      moduleId,
      sourceIds: sourceIdsFilter,
      limit,
    });

    const combined = new Map<string, { chunkId: string; sourceId: string; sourceTitle: string; sourceAuthors: string; sourceYear: number; text: string; score: number }>();

    const maxSemScore = Math.max(...semanticResults.map((r: { score: number }) => r.score), 0.001);
    for (const r of semanticResults) {
      const normalized = r.score / maxSemScore;
      combined.set(r.chunkId, {
        chunkId: r.chunkId,
        sourceId: r.sourceId,
        sourceTitle: r.sourceTitle,
        sourceAuthors: r.sourceAuthors,
        sourceYear: r.sourceYear,
        text: r.text,
        score: Math.round(normalized * 0.7 * 100) / 100,
      });
    }

    const maxKwScore = Math.max(...keywordResults.map((r: { score: number }) => r.score), 0.001);
    for (const r of keywordResults) {
      const normalized = r.score / maxKwScore;
      const existing = combined.get(r.chunkId);
      if (existing) {
        existing.score = Math.round((existing.score + normalized * 0.3) * 100) / 100;
      } else {
        combined.set(r.chunkId, {
          chunkId: r.chunkId,
          sourceId: r.sourceId,
          sourceTitle: r.sourceTitle,
          sourceAuthors: r.sourceAuthors,
          sourceYear: r.sourceYear,
          text: r.text,
          score: Math.round(normalized * 0.3 * 100) / 100,
        });
      }
    }

    return [...combined.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  return keywordResults;
}
