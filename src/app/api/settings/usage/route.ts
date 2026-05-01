import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const stats = await convexServer.query(api.usage.getStats, { userId });
  return NextResponse.json(stats);
}
