import { auth } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/services/usage-service";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getUserUsageStats(session.user.id);
  return NextResponse.json(stats);
}
