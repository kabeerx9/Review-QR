import { getSession } from "@/lib/auth";
import {
  getTokensFromCode,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/google";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/onboarding?google_error=access_denied", req.url),
    );
  }

  if (!state || !cookieState || state !== cookieState) {
    const response = NextResponse.redirect(
      new URL("/onboarding?google_error=invalid_state", req.url),
    );
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  }

  try {
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error("No access token returned from Google");
    }

    const existingOwner = await prisma.owner.findUnique({
      where: { id: session.ownerId },
      select: { googleRefreshToken: true },
    });

    await prisma.owner.update({
      where: { id: session.ownerId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken:
          tokens.refresh_token ?? existingOwner?.googleRefreshToken ?? undefined,
      },
    });

    const response = NextResponse.redirect(new URL("/onboarding?step=3", req.url));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const response = NextResponse.redirect(
      new URL("/onboarding?google_error=callback_failed", req.url),
    );
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  }
}
