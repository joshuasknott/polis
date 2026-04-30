import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/auth/signin"];
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/api/auth");

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  if (req.auth && pathname === "/auth/signin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
