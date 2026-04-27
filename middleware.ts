import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("rqr_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const session = await verifyToken(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("rqr_session");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
