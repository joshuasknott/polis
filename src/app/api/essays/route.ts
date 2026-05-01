import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const essayId = searchParams.get("id");
  const moduleId = searchParams.get("moduleId");

  if (essayId) {
    const essay = await convexServer.query(api.essays.getById, { userId, essayId });
    if (!essay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(essay);
  }

  if (moduleId) {
    const essays = await convexServer.query(api.essays.getByModuleId, { userId, moduleId });
    return NextResponse.json(essays);
  }

  return NextResponse.json({ error: "Provide id or moduleId" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "create": {
        const { action: _, ...data } = body;
        const essay = await convexServer.mutation(api.essays.create, { userId, ...data });
        return NextResponse.json(essay, { status: 201 });
      }
      case "update": {
        const { action: _, essayId, ...data } = body;
        const essay = await convexServer.mutation(api.essays.update, { userId, essayId, ...data });
        return NextResponse.json(essay);
      }
      case "updateDraft": {
        const { action: _, essayId, draftContent } = body;
        const essay = await convexServer.mutation(api.essays.update, { userId, essayId, draftContent });
        return NextResponse.json(essay);
      }
      case "createSection": {
        const { action: _, essayId, ...data } = body;
        const section = await convexServer.mutation(api.essays.createSection, { userId, essayId, ...data });
        return NextResponse.json(section, { status: 201 });
      }
      case "updateSection": {
        const { action: _, sectionId, ...data } = body;
        const section = await convexServer.mutation(api.essays.updateSection, { userId, sectionId, ...data });
        return NextResponse.json(section);
      }
      case "addEvidence": {
        const { action: _, essayId, ...data } = body;
        const evidence = await convexServer.mutation(api.essays.addEvidence, { userId, essayId, ...data });
        return NextResponse.json(evidence, { status: 201 });
      }
      case "removeEvidence": {
        const { action: _, evidenceItemId } = body;
        await convexServer.mutation(api.essays.removeEvidence, { userId, evidenceId: evidenceItemId });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    );
  }
}
