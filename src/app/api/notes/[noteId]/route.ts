import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const { content, tags } = await req.json();

  const note = await prisma.sourceNote.findFirst({
    where: { id: noteId, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.sourceNote.update({
    where: { id: noteId },
    data: {
      ...(content !== undefined && { content }),
      ...(tags !== undefined && { tags }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const note = await prisma.sourceNote.findFirst({
    where: { id: noteId, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sourceNote.delete({ where: { id: noteId } });
  return NextResponse.json({ success: true });
}
