import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "authjs.session-token";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const publicPaths = ["/", "/auth/signin"];
  const isPublic =
    publicPaths.includes(pathname) || pathname.startsWith("/api/auth");

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  if (hasSession && pathname === "/auth/signin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
