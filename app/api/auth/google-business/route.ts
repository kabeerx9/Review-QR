import { requireActiveUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google-business
 * Initiates Google OAuth flow for connecting Google Business Profile.
 * Requires an authenticated session.
 */
export async function GET(req: NextRequest) {
  const owner = await requireActiveUserFromRequest(req);
  if (!owner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-business/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent", // Force consent to always get refresh_token
    state: owner.id, // Pass ownerId through state param
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
