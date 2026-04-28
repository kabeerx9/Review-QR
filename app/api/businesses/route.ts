import { getSessionFromRequest } from "@/lib/auth";
import {
  fetchGoogleBusinessLocations,
  getFreshAccessToken,
} from "@/lib/google";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.ownerId },
    select: { googleRefreshToken: true },
  });

  if (!owner?.googleRefreshToken) {
    return NextResponse.json(
      {
        error: "google_not_connected",
        message: "Connect your Google Business account first.",
      },
      { status: 403 },
    );
  }

  try {
    const accessToken = await getFreshAccessToken(owner.googleRefreshToken);

    await prisma.owner.update({
      where: { id: session.ownerId },
      data: { googleAccessToken: accessToken },
    });

    const locations = await fetchGoogleBusinessLocations(accessToken);
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Failed to fetch Google Business locations:", error);
    return NextResponse.json(
      {
        error: "google_business_fetch_failed",
        message: "Unable to load your Google Business locations right now.",
      },
      { status: 502 },
    );
  }
}
