import { auth } from "@/lib/auth";
import {
  getEssaysByModule,
  getEssayById,
  createEssay,
  updateEssay,
  createEssaySection,
  updateEssaySection,
  addEvidenceItem,
  removeEvidenceItem,
} from "@/lib/services/data-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const essayId = searchParams.get("id");
  const moduleId = searchParams.get("moduleId");

  if (essayId) {
    const essay = await getEssayById(session.user.id, essayId);
    if (!essay) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(essay);
  }

  if (moduleId) {
    const essays = await getEssaysByModule(session.user.id, moduleId);
    return NextResponse.json(essays);
  }

  return NextResponse.json({ error: "Provide id or moduleId" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "create": {
        const essay = await createEssay(session.user.id, body);
        return NextResponse.json(essay, { status: 201 });
      }
      case "update": {
        const { essayId, ...data } = body;
        const essay = await updateEssay(session.user.id, essayId, data);
        return NextResponse.json(essay);
      }
      case "createSection": {
        const { essayId, ...data } = body;
        const section = await createEssaySection(session.user.id, essayId, data);
        return NextResponse.json(section, { status: 201 });
      }
      case "updateSection": {
        const { sectionId, ...data } = body;
        const section = await updateEssaySection(sectionId, data);
        return NextResponse.json(section);
      }
      case "addEvidence": {
        const { essayId, ...data } = body;
        const evidence = await addEvidenceItem(session.user.id, essayId, data);
        return NextResponse.json(evidence, { status: 201 });
      }
      case "removeEvidence": {
        const { evidenceItemId } = body;
        await removeEvidenceItem(evidenceItemId);
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
