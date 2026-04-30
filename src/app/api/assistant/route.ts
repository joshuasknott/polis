import { auth } from "@/lib/auth";
import { retrieveRelevantChunks } from "@/lib/services/retrieval-service";
import { generateRetrievalAwareResponse } from "@/lib/ai/grounded-provider";
import { addConversationMessage, createConversation } from "@/lib/services/data-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, moduleId, sourceId, essayId, mode, conversationId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const chunks = await retrieveRelevantChunks({
      userId: session.user.id,
      query,
      moduleId,
      sourceId,
      essayId,
      limit: 8,
    });

    const response = generateRetrievalAwareResponse({
      query,
      mode: mode || "source_grounded",
      chunks,
    });

    let convId = conversationId;
    if (!convId) {
      const conv = await createConversation(session.user.id, {
        title: query.slice(0, 60) + (query.length > 60 ? "..." : ""),
        moduleId: moduleId || undefined,
        sourceId: sourceId || undefined,
        essayId: essayId || undefined,
        mode: mode || "source_grounded",
      });
      convId = conv.id;
    }

    await addConversationMessage(convId, {
      role: "user",
      content: query,
    });

    await addConversationMessage(convId, {
      role: "assistant",
      content: response.content,
      citedChunkIds: chunks.length > 0 ? chunks.map((c) => c.chunkId).join(",") : undefined,
    });

    return NextResponse.json({
      conversationId: convId,
      ...response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
