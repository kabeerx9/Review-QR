import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { shopId, ratings, customerPhone } = await req.json();

  if (!shopId || !Array.isArray(ratings) || ratings.length !== 4) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const [rating1, rating2, rating3, rating4] = ratings.map((rating) => Number(rating));
  const invalid = [rating1, rating2, rating3, rating4].some(
    (rating) => Number.isNaN(rating) || rating < 1 || rating > 5,
  );
  if (invalid) {
    return NextResponse.json({ error: "invalid_ratings" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    return NextResponse.json({ error: "shop_not_found" }, { status: 404 });
  }

  const averageRating = (rating1 + rating2 + rating3 + rating4) / 4;
  const isPublic = averageRating >= 3;
  const generatedReview = isPublic
    ? `Great experience at ${shop.name} in ${shop.city}! Really enjoyed the visit. Would definitely recommend! 👍`
    : null;

  await prisma.review.create({
    data: {
      shopId,
      rating1,
      rating2,
      rating3,
      rating4,
      averageRating,
      isPublic,
      customerPhone: customerPhone || null,
      generatedReview,
    },
  });

  return NextResponse.json({
    status: isPublic ? "public" : "private",
    review: generatedReview,
    googleReviewUrl: shop.googleReviewUrl || null,
  });
}
