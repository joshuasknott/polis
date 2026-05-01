import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { sourceId } = await params;
  const notes = await convexServer.query(api.notes.getBySourceId, { userId, sourceId });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { sourceId } = await params;
  const { content, tags } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const source = await convexServer.query(api.sources.getById, { userId, sourceId });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const note = await convexServer.mutation(api.notes.create, {
    userId,
    sourceId,
    content,
    ...(tags ? { tags } : {}),
  });

  return NextResponse.json(note, { status: 201 });
}
