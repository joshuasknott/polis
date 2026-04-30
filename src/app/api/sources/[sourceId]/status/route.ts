import { auth } from "@/lib/auth";
import { getSourceById } from "@/lib/services/data-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceId } = await params;
  const source = await getSourceById(session.user.id, sourceId);

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: source.id,
    status: source.status,
    processingStatus: source.processingStatus,
    errorMessage: source.errorMessage,
    title: source.title,
    wordCount: source.wordCount,
    summary: source.summary,
    keyArguments: source.keyArguments,
    concepts: source.concepts,
  });
}
