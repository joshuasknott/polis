import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const notes = await prisma.sourceNote.findMany({
    where: { sourceId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceId } = await params;
  const { content, tags } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const source = await prisma.source.findFirst({
    where: { id: sourceId, userId: session.user.id },
  });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const note = await prisma.sourceNote.create({
    data: {
      userId: session.user.id,
      sourceId,
      content,
      tags: tags || null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
