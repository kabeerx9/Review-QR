import { NICHE_CATEGORIES } from "@/constants/niches";
import { generateHinglishReview } from "@/lib/groq";
import prisma from "@/lib/prisma";
import { sendBadReviewAlert } from "@/lib/whatsapp";
import { NextRequest, NextResponse } from "next/server";

function fallbackReview(shopName: string, city: string): string {
  return `Great experience at ${shopName} in ${city}! Really happy with the service. Would definitely recommend to everyone. Keep it up! 👍`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, ratings, customerPhone } = body;

    if (!shopId || !Array.isArray(ratings) || ratings.length !== 4) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const [rating1, rating2, rating3, rating4] = ratings.map((r: unknown) => Number(r));
    const invalid = [rating1, rating2, rating3, rating4].some(
      (r) => !Number.isFinite(r) || r < 1 || r > 5 || r !== Math.floor(r),
    );
    if (invalid) {
      return NextResponse.json({ error: "invalid_ratings" }, { status: 400 });
    }

    const ratingTuple = [rating1, rating2, rating3, rating4] as [number, number, number, number];

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "shop_not_found" }, { status: 404 });
    }

    if (!shop.isActive) {
      return NextResponse.json({ error: "shop_inactive" }, { status: 403 });
    }

    const averageRating = (rating1 + rating2 + rating3 + rating4) / 4;
    const isPublic = averageRating >= 3;

    if (!isPublic) {
      try {
        await prisma.review.create({
          data: {
            shopId,
            rating1,
            rating2,
            rating3,
            rating4,
            averageRating,
            isPublic: false,
            customerPhone: customerPhone || null,
            generatedReview: null,
          },
        });
      } catch (e) {
        console.error("[review] private create failed", e);
        return NextResponse.json({ error: "save_failed" }, { status: 500 });
      }

      const rawAlert =
        shop.owner.phone?.trim() ||
        process.env.OWNER_WHATSAPP_DEFAULT?.replace(/^whatsapp:/i, "").trim() ||
        null;

      if (rawAlert) {
        try {
          await sendBadReviewAlert({
            ownerPhone: rawAlert,
            shopName: shop.name,
            niche: shop.niche,
            ratings: ratingTuple,
            averageRating,
            customerPhone: customerPhone || undefined,
            timestamp: new Date(),
          });
        } catch (e) {
          console.error("[review] whatsapp alert failed", e);
        }
      }

      return NextResponse.json({
        status: "private" as const,
        review: null,
        googleReviewUrl: shop.googleReviewUrl || null,
      });
    }

    const categories = (NICHE_CATEGORIES[shop.niche] ?? [
      "Quality",
      "Cleanliness",
      "Service",
      "Experience",
    ]) as [string, string, string, string];

    let generatedReview: string;
    try {
      generatedReview = await generateHinglishReview({
        shopName: shop.name,
        city: shop.city,
        niche: shop.niche,
        categories,
        ratings: ratingTuple,
      });
    } catch (e) {
      console.error("[review] groq failed, using fallback", e);
      generatedReview = fallbackReview(shop.name, shop.city);
    }

    try {
      await prisma.review.create({
        data: {
          shopId,
          rating1,
          rating2,
          rating3,
          rating4,
          averageRating,
          isPublic: true,
          customerPhone: customerPhone || null,
          generatedReview,
        },
      });
    } catch (e) {
      console.error("[review] public create failed", e);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({
      status: "public" as const,
      review: generatedReview,
      googleReviewUrl: shop.googleReviewUrl || null,
    });
  } catch (e) {
    console.error("[review] POST error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
