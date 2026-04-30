import { auth } from "@/lib/auth";
import { processUpload } from "@/lib/services/upload-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const moduleId = formData.get("moduleId") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const title = formData.get("title") as string | null;
    const sourceType = formData.get("sourceType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!moduleId) {
      return NextResponse.json({ error: "Module ID required" }, { status: 400 });
    }

    const result = await processUpload(session.user.id, moduleId, file, {
      folderId: folderId || undefined,
      title: title || undefined,
      sourceType: sourceType || undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
