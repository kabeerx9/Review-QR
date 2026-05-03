import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { shopId, ratings, customerPhone, generatedReview } = await req.json();

    if (!shopId || !Array.isArray(ratings) || ratings.length !== 4) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const [rating1, rating2, rating3, rating4] = ratings.map((r: unknown) => Number(r));
    const activeRatings = [rating1, rating2, rating3, rating4].filter(r => r > 0);
    const averageRating = activeRatings.length > 0 
      ? activeRatings.reduce((a, b) => a + b, 0) / activeRatings.length 
      : 0;

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
        generatedReview: generatedReview || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[review/save] POST error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
