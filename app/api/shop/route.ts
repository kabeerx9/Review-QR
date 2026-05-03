import { getSessionFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQRDataURL } from "@/lib/qrcode";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, city, niche, googleReviewUrl, googleMapsUrl, customNiche } = await req.json();
  if (!name || !city || !niche) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
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
      specialties: niche === "OTHER" && customNiche ? customNiche : null,
      googleReviewUrl: googleReviewUrl || "",
      googleMapsUrl: googleMapsUrl || "",
      slug,
      qrCodeUrl,
      isActive: true,
    },
  });

  return NextResponse.json({ shop });
}
