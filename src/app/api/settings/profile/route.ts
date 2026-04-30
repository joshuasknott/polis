import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      university: true,
      course: true,
      yearOfStudy: true,
      preferences: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true, providerAccountId: true },
  });

  return NextResponse.json({ ...user, accounts });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "updateProfile") {
      const { name, university, course, yearOfStudy } = body;
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(university !== undefined && { university }),
          ...(course !== undefined && { course }),
          ...(yearOfStudy !== undefined && { yearOfStudy }),
        },
      });
      return NextResponse.json({ success: true, user: { name: user.name, university: user.university, course: user.course, yearOfStudy: user.yearOfStudy } });
    }

    if (action === "updatePreferences") {
      const { preferences } = body;
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { preferences },
      });
      return NextResponse.json({ success: true, preferences: user.preferences });
    }

    if (action === "changePassword") {
      const { currentPassword, newPassword } = body;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        return NextResponse.json({ error: "No password set. Use OAuth instead." }, { status: 400 });
      }

      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }

      const hashedPassword = await hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword },
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
