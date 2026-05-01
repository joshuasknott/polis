import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await convexServer.query(api.users.getProfile, { userId });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accounts = await convexServer.query(api.users.getLinkedProviders, { userId });

  return NextResponse.json({ ...user, accounts });
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "updateProfile") {
      const { action: _, ...data } = body;
      await convexServer.mutation(api.users.updateProfile, { userId, ...data });
      const user = await convexServer.query(api.users.getProfile, { userId });
      return NextResponse.json({
        success: true,
        user: {
          name: user?.name,
          university: user?.university,
          course: user?.course,
          yearOfStudy: user?.yearOfStudy,
        },
      });
    }

    if (action === "updatePreferences") {
      const { action: _, preferences } = body;
      const prefStr = typeof preferences === "string" ? preferences : JSON.stringify(preferences);
      await convexServer.mutation(api.users.updatePreferences, { userId, preferences: prefStr });
      return NextResponse.json({ success: true, preferences: prefStr });
    }

    if (action === "changePassword") {
      const { currentPassword, newPassword } = body;

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }

      const profile = await convexServer.query(api.users.getProfile, { userId });
      if (profile?.hasPassword && currentPassword) {
        const userDoc: any = await convexServer.query(api.users.getById, { userId });
        const credentialAccount = await convexServer.query(api.users.getCredentialAccount, { userId });
        const passwordHash = credentialAccount?.password || userDoc?.passwordHash;
        if (passwordHash) {
          const valid = await verifyPassword({ hash: passwordHash, password: currentPassword });
          if (!valid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
          }
        }
      }

      const hashedPassword = await hashPassword(newPassword);
      await convexServer.mutation(api.users.updatePassword, {
        userId,
        passwordHash: hashedPassword,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
