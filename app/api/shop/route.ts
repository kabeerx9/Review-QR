import { getSessionFromRequest } from "@/lib/auth";
import {
  findOwnedGoogleBusinessLocation,
  getFreshAccessToken,
} from "@/lib/google";
import prisma from "@/lib/prisma";
import { generateQRDataURL } from "@/lib/qrcode";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, city, niche, googleLocationId } = await req.json();

  if (!name || !city || !niche) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (!googleLocationId) {
    return NextResponse.json(
      {
        error: "google_not_verified",
        message:
          "You must connect your Google Business account to generate a QR code.",
      },
      { status: 403 },
    );
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    select: { googleRefreshToken: true },
  });

  if (!owner?.googleRefreshToken) {
    return NextResponse.json(
      {
        error: "google_not_connected",
        message: "Google Business account not connected.",
      },
      { status: 403 },
    );
  }

  let accessToken: string;

  try {
    accessToken = await getFreshAccessToken(owner.googleRefreshToken);
  } catch (error) {
    console.error("Failed to refresh Google access token:", error);
    return NextResponse.json(
      {
        error: "google_refresh_failed",
        message:
          "We could not verify your Google Business connection. Please reconnect Google and try again.",
      },
      { status: 502 },
    );
  }

  await prisma.owner.update({
    where: { id: session.ownerId },
    data: { googleAccessToken: accessToken },
  });

  const verifiedLocation = await findOwnedGoogleBusinessLocation(
    accessToken,
    googleLocationId,
  );

  if (!verifiedLocation) {
    return NextResponse.json(
      {
        error: "google_location_not_verified",
        message:
          "The selected Google Business location could not be verified for this account.",
      },
      { status: 403 },
    );
  }

  const slug = nanoid(8);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrUrl = `${baseUrl}/r/${slug}`;
  const qrCodeUrl = await generateQRDataURL(qrUrl);

  const shop = await prisma.shop.create({
    data: {
      ownerId: session.ownerId,
      name,
      city,
      niche,
      googleLocationId: verifiedLocation.locationId,
      googlePlaceId: verifiedLocation.placeId,
      googleReviewUrl: verifiedLocation.googleReviewUrl,
      googleMapsUrl: verifiedLocation.googleMapsUrl,
      slug,
      qrCodeUrl,
      isActive: true,
    },
  });

  return NextResponse.json({ shop });
}
