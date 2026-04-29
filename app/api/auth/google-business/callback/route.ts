import { encrypt } from "@/lib/crypto";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google-business/callback
 * Handles the OAuth callback from Google.
 * Exchanges the authorization code for tokens, encrypts them, and stores in DB.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // ownerId
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // User denied access
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${appUrl}/dashboard?google=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?google=error`);
  }

  // Verify the owner exists
  const owner = await prisma.owner.findUnique({ where: { id: state } });
  if (!owner) {
    console.error("Owner not found for state:", state);
    return NextResponse.redirect(`${appUrl}/dashboard?google=error`);
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/google-business/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    console.error("Token exchange failed:", errorBody);
    return NextResponse.redirect(`${appUrl}/dashboard?google=error`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token } = tokenData;

  if (!access_token) {
    console.error("No access token in response:", tokenData);
    return NextResponse.redirect(`${appUrl}/dashboard?google=error`);
  }

  // Encrypt and store tokens
  const encryptedAccess = encrypt(access_token);
  const encryptedRefresh = refresh_token ? encrypt(refresh_token) : owner.googleRefreshToken;

  await prisma.owner.update({
    where: { id: state },
    data: {
      googleAccessToken: encryptedAccess,
      googleRefreshToken: encryptedRefresh,
    },
  });

  console.log(`Google Business connected for owner ${state}`);

  return NextResponse.redirect(`${appUrl}/dashboard?google=connected`);
}
