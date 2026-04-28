import { getSession } from "@/lib/auth";
import { getAuthUrl, GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(getAuthUrl(state));

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
