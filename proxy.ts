import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding", "/billing", "/settings", "/google-business"];
const CHANGE_PASSWORD = "/change-password";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isHome = pathname === "/";
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));
  const isChangePassword = pathname.startsWith(CHANGE_PASSWORD);

  if (!isProtected && !isChangePassword && !isHome) return NextResponse.next();

  const token = req.cookies.get("rqr_session")?.value;
  if (!token) {
    if (isHome) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const res = NextResponse.redirect(new URL(isHome ? "/" : "/login", req.url));
    res.cookies.delete("rqr_session");
    return res;
  }

  if (session.role === "SUPERADMIN") {
    return NextResponse.redirect(new URL("/superadmin", req.url));
  }

  if (isHome) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isChangePassword) {
    if (!session.mustChangePassword) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (session.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/onboarding/:path*", "/billing/:path*", "/settings/:path*", "/google-business/:path*", "/change-password"],
};
