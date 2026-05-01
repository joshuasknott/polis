import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { noteId } = await params;
  const { content, tags } = await req.json();

  const updated = await convexServer.mutation(api.notes.update, {
    noteId,
    userId,
    ...(content !== undefined && { content }),
    ...(tags !== undefined && { tags }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { noteId } = await params;

  await convexServer.mutation(api.notes.remove, { noteId, userId });
  return NextResponse.json({ success: true });
}
